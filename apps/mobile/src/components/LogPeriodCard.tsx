import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { format, parseISO } from 'date-fns'
import { useAuth } from '@lunari/utils'
import { Toast } from '@lunari/ui'
import type { PeriodEvent } from '@lunari/types'
import type { PredictionSurface } from './NextUpCard'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/v1'
const OFFSETS = [0, 1, 2, 3, 5, 7, 14]

function ymdFromOffset(days: number): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}
const offsetLabel = (d: number) => (d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d}d ago`)
const daysBetween = (a: string, b: string) =>
  Math.abs(Math.round((parseISO(a).getTime() - parseISO(b).getTime()) / 86400000))

/** "Log period" control for Today — recalibrates predictions via `onChange`. */
export function LogPeriodCard({ surface, onChange }: { surface: PredictionSurface; onChange: () => void }) {
  const { session } = useAuth()
  const { ink, sub, gold, cardwash, cardbd } = surface
  const [events, setEvents] = useState<PeriodEvent[]>([])
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(() => ymdFromOffset(0))
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const authHeaders = useCallback(
    () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` }),
    [session]
  )

  const load = useCallback(async () => {
    if (!session) return
    try {
      const r = await fetch(`${API_URL}/me/period-events`, { headers: authHeaders() })
      if (r.ok) setEvents(await r.json())
    } catch {
      /* ignore */
    }
  }, [session, authHeaders])

  useEffect(() => { load() }, [load])

  const mostRecent = events[0] ?? null
  // Open period = most recent start with no end, within the last 12 days.
  const openPeriod =
    events.find((e) => !e.endDate && daysBetween(ymdFromOffset(0), e.startDate) <= 12) ?? null
  const openStartDate = openPeriod?.startDate ?? ''

  const flash = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), type === 'error' ? 2800 : 1600)
  }
  const reset = () => { setOpen(false); setConfirming(false); setSelected(ymdFromOffset(0)) }

  const doLogStart = async () => {
    if (!session) return
    setBusy(true)
    try {
      const r = await fetch(`${API_URL}/me/period-events`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ startDate: selected }),
      })
      if (!r.ok) throw new Error('log failed')
      await load()
      onChange()
      flash(`Period logged: ${format(parseISO(selected), 'MMM d')}`, 'success')
      reset()
    } catch {
      flash("Couldn't log — try again", 'error')
    } finally {
      setBusy(false)
    }
  }

  const doLogEnd = async () => {
    if (!openPeriod || !session) return
    setBusy(true)
    try {
      const r = await fetch(`${API_URL}/me/period-events/${openPeriod.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ endDate: selected }),
      })
      if (!r.ok) throw new Error('end failed')
      await load()
      onChange()
      flash(`Period ended: ${format(parseISO(selected), 'MMM d')}`, 'success')
      reset()
    } catch {
      flash("Couldn't save — try again", 'error')
    } finally {
      setBusy(false)
    }
  }

  const attemptLogStart = () => {
    if (mostRecent && daysBetween(selected, mostRecent.startDate) < 10) {
      setConfirming(true)
      return
    }
    doLogStart()
  }

  // Undo adapts: a just-logged END clears the endDate (reopen); a just-logged START deletes it.
  const undo = async () => {
    if (!mostRecent || !session) return
    setBusy(true)
    try {
      if (mostRecent.endDate) {
        const r = await fetch(`${API_URL}/me/period-events/${mostRecent.id}`, {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ endDate: null }),
        })
        if (!r.ok) throw new Error('undo failed')
        await load()
        onChange()
        flash('Reopened', 'success')
      } else {
        const r = await fetch(`${API_URL}/me/period-events/${mostRecent.id}`, { method: 'DELETE', headers: authHeaders() })
        if (!r.ok) throw new Error('undo failed')
        await load()
        onChange()
        flash('Removed', 'success')
      }
    } catch {
      flash("Couldn't undo", 'error')
    } finally {
      setBusy(false)
    }
  }

  const gapDays = mostRecent ? daysBetween(selected, mostRecent.startDate) : 0

  return (
    <View>
      {/* Compact, prominent entry point — context-aware label. */}
      <View style={styles.triggerRow}>
        <Pressable
          onPress={() => setOpen((o) => !o)}
          style={[styles.trigger, { borderColor: gold, backgroundColor: open ? cardwash : 'transparent' }]}
        >
          <View style={[styles.triggerDot, { backgroundColor: gold }]} />
          <Text style={[styles.triggerText, { color: gold }]}>{openPeriod ? 'Period ended' : 'Log period'}</Text>
        </Pressable>
      </View>

      {/* Inline expansion. */}
      {open && (
        <View style={[styles.panel, { backgroundColor: cardwash, borderColor: cardbd }]}>
          {openPeriod ? (
            /* ── END mode: an open period exists → pick the end date ── */
            <>
              <Text style={[styles.subline, { color: sub }]}>
                Started {format(parseISO(openPeriod.startDate), 'MMM d')} ·{' '}
                <Text style={[styles.link, { color: gold }]} onPress={busy ? undefined : undo}>
                  Undo
                </Text>
              </Text>

              <Text style={[styles.fieldLabel, styles.fieldGap, { color: sub }]}>When did it end?</Text>
              <View style={styles.chips}>
                {OFFSETS.map((o) => {
                  const v = ymdFromOffset(o)
                  if (v < openStartDate) return null
                  const on = selected === v
                  return (
                    <Pressable
                      key={o}
                      onPress={() => setSelected(v)}
                      style={[styles.chip, { backgroundColor: on ? gold : 'transparent', borderColor: on ? 'transparent' : cardbd }]}
                    >
                      <Text style={[styles.chipText, { color: on ? '#2C2825' : ink }]}>{offsetLabel(o)}</Text>
                    </Pressable>
                  )
                })}
              </View>

              <View style={[styles.actions, { marginTop: 10 }]}>
                <Pressable onPress={doLogEnd} disabled={busy} style={[styles.primaryBtn, { backgroundColor: gold, opacity: busy ? 0.6 : 1 }]}>
                  <Text style={styles.primaryText}>{busy ? 'Saving…' : 'Mark ended'}</Text>
                </Pressable>
                <Pressable onPress={reset} style={[styles.ghostBtn, { borderColor: cardbd }]}>
                  <Text style={[styles.ghostText, { color: ink }]}>Cancel</Text>
                </Pressable>
              </View>
            </>
          ) : (
            /* ── START mode: log a new period start ── */
            <>
              {mostRecent ? (
                <Text style={[styles.subline, { color: sub }]}>
                  {mostRecent.endDate
                    ? `Last period ${format(parseISO(mostRecent.startDate), 'MMM d')}–${format(parseISO(mostRecent.endDate), 'MMM d')}`
                    : `Last logged ${format(parseISO(mostRecent.startDate), 'MMM d')}`}{' '}
                  ·{' '}
                  <Text style={[styles.link, { color: gold }]} onPress={busy ? undefined : undo}>
                    Undo
                  </Text>
                </Text>
              ) : (
                <Text style={[styles.hint, { color: sub }]}>Log the day your period starts to keep predictions accurate.</Text>
              )}

              <Text style={[styles.fieldLabel, styles.fieldGap, { color: sub }]}>When did it start?</Text>
              <View style={styles.chips}>
                {OFFSETS.map((o) => {
                  const v = ymdFromOffset(o)
                  const on = selected === v
                  return (
                    <Pressable
                      key={o}
                      onPress={() => { setSelected(v); setConfirming(false) }}
                      style={[styles.chip, { backgroundColor: on ? gold : 'transparent', borderColor: on ? 'transparent' : cardbd }]}
                    >
                      <Text style={[styles.chipText, { color: on ? '#2C2825' : ink }]}>{offsetLabel(o)}</Text>
                    </Pressable>
                  )
                })}
              </View>

              {confirming ? (
                <View style={{ marginTop: 10 }}>
                  <Text style={[styles.warn, { color: ink }]}>
                    Only {gapDays} day{gapDays === 1 ? '' : 's'} since your last logged period — log anyway?
                  </Text>
                  <View style={styles.actions}>
                    <Pressable onPress={doLogStart} disabled={busy} style={[styles.primaryBtn, { backgroundColor: gold, opacity: busy ? 0.6 : 1 }]}>
                      <Text style={styles.primaryText}>{busy ? 'Logging…' : 'Log anyway'}</Text>
                    </Pressable>
                    <Pressable onPress={reset} style={[styles.ghostBtn, { borderColor: cardbd }]}>
                      <Text style={[styles.ghostText, { color: ink }]}>Cancel</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={[styles.actions, { marginTop: 10 }]}>
                  <Pressable onPress={attemptLogStart} disabled={busy} style={[styles.primaryBtn, { backgroundColor: gold, opacity: busy ? 0.6 : 1 }]}>
                    <Text style={styles.primaryText}>{busy ? 'Logging…' : 'Log period'}</Text>
                  </Pressable>
                  <Pressable onPress={reset} style={[styles.ghostBtn, { borderColor: cardbd }]}>
                    <Text style={[styles.ghostText, { color: ink }]}>Cancel</Text>
                  </Pressable>
                </View>
              )}
            </>
          )}
        </View>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </View>
  )
}

const styles = StyleSheet.create({
  triggerRow: { alignItems: 'center' },
  trigger: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 8, paddingHorizontal: 17, borderRadius: 999, borderWidth: 1 },
  triggerDot: { width: 7, height: 7, borderRadius: 999 },
  triggerText: { fontFamily: 'Raleway_600SemiBold', fontSize: 11.5, letterSpacing: 0.4 },
  panel: { marginTop: 10, padding: 16, borderRadius: 14, borderWidth: 1 },
  link: { fontFamily: 'Raleway_600SemiBold', fontSize: 10.5 },
  subline: { fontFamily: 'Raleway_400Regular', fontSize: 11 },
  hint: { fontFamily: 'Raleway_300Light', fontSize: 11 },
  fieldLabel: { fontFamily: 'Raleway_500Medium', fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 8 },
  fieldGap: { marginTop: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingVertical: 6, paddingHorizontal: 11, borderRadius: 18, borderWidth: 1 },
  chipText: { fontFamily: 'Raleway_500Medium', fontSize: 10.5 },
  warn: { fontFamily: 'Raleway_400Regular', fontSize: 11 },
  actions: { flexDirection: 'row', gap: 8 },
  primaryBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 11 },
  primaryText: { fontFamily: 'Raleway_600SemiBold', fontSize: 11, color: '#2C2825' },
  ghostBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 11, borderWidth: 1 },
  ghostText: { fontFamily: 'Raleway_500Medium', fontSize: 11 },
})
