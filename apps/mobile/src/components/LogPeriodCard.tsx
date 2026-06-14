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
  const flash = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), type === 'error' ? 2800 : 1600)
  }
  const reset = () => { setOpen(false); setConfirming(false); setSelected(ymdFromOffset(0)) }

  const doLog = async () => {
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

  const attemptLog = () => {
    if (mostRecent && daysBetween(selected, mostRecent.startDate) < 10) {
      setConfirming(true)
      return
    }
    doLog()
  }

  const undo = async () => {
    if (!mostRecent || !session) return
    setBusy(true)
    try {
      const r = await fetch(`${API_URL}/me/period-events/${mostRecent.id}`, { method: 'DELETE', headers: authHeaders() })
      if (!r.ok) throw new Error('undo failed')
      await load()
      onChange()
      flash('Removed', 'success')
    } catch {
      flash("Couldn't undo", 'error')
    } finally {
      setBusy(false)
    }
  }

  const gapDays = mostRecent ? daysBetween(selected, mostRecent.startDate) : 0

  return (
    <View style={[styles.card, { backgroundColor: cardwash, borderColor: cardbd }]}>
      <View style={styles.headRow}>
        <Text style={[styles.eyebrow, { color: gold }]}>Period start</Text>
        {!open && (
          <Pressable onPress={() => setOpen(true)}>
            <Text style={[styles.link, { color: gold }]}>Log period</Text>
          </Pressable>
        )}
      </View>

      {!open && mostRecent && (
        <Text style={[styles.subline, { color: sub }]}>
          Period logged: {format(parseISO(mostRecent.startDate), 'MMM d')} ·{' '}
          <Text style={[styles.link, { color: gold }]} onPress={busy ? undefined : undo}>
            Undo
          </Text>
        </Text>
      )}
      {!open && !mostRecent && (
        <Text style={[styles.hint, { color: sub }]}>Log the day your period starts to keep predictions accurate.</Text>
      )}

      {open && (
        <View style={{ marginTop: 10 }}>
          <Text style={[styles.fieldLabel, { color: sub }]}>When did it start?</Text>
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
                <Pressable onPress={doLog} disabled={busy} style={[styles.primaryBtn, { backgroundColor: gold, opacity: busy ? 0.6 : 1 }]}>
                  <Text style={styles.primaryText}>{busy ? 'Logging…' : 'Log anyway'}</Text>
                </Pressable>
                <Pressable onPress={reset} style={[styles.ghostBtn, { borderColor: cardbd }]}>
                  <Text style={[styles.ghostText, { color: ink }]}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={[styles.actions, { marginTop: 10 }]}>
              <Pressable onPress={attemptLog} disabled={busy} style={[styles.primaryBtn, { backgroundColor: gold, opacity: busy ? 0.6 : 1 }]}>
                <Text style={styles.primaryText}>{busy ? 'Logging…' : 'Log period'}</Text>
              </Pressable>
              <Pressable onPress={reset} style={[styles.ghostBtn, { borderColor: cardbd }]}>
                <Text style={[styles.ghostText, { color: ink }]}>Cancel</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 14, borderWidth: 1 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  eyebrow: { fontFamily: 'Raleway_600SemiBold', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase' },
  link: { fontFamily: 'Raleway_600SemiBold', fontSize: 10.5 },
  subline: { fontFamily: 'Raleway_400Regular', fontSize: 11, marginTop: 6 },
  hint: { fontFamily: 'Raleway_300Light', fontSize: 11, marginTop: 6 },
  fieldLabel: { fontFamily: 'Raleway_500Medium', fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 8 },
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
