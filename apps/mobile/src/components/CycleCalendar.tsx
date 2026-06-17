import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, Pressable, StyleSheet } from 'react-native'
import {
  getDayInCycle, getPhaseForDay, getPhaseRanges, resolveCalendarTap, loggedPeriodDays, daysBetweenYmd,
} from '@lunari/phase-data'
import { phases as phaseTheme, phaseKeyFor, palette } from '@lunari/design-tokens'
import { useAuth } from '@lunari/utils'
import { Toast } from '@lunari/ui'
import type { CycleSettings, PhaseId, PeriodEvent } from '@lunari/types'
import { addMonths, differenceInCalendarDays, format, getDay, getDaysInMonth, isSameDay, parseISO, startOfMonth } from 'date-fns'
import type { PredictionSurface } from './NextUpCard'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/v1'
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const phaseColor = (id: PhaseId) => phaseTheme[phaseKeyFor(id)].phase
const NUM = palette.goldOnLight // readable gold for every date number
const TODAY_FILL = `${palette.goldOnLight}26` // subtle gold wash marks today
const NAVY = phaseColor('menstrual')
const fmtYmd = (ymd: string) => format(parseISO(ymd), 'MMM d')

/**
 * Month calendar + period-logging surface. Tapping a date logs/ends/removes a period
 * (rules shared with the Today button via resolveCalendarTap); logged days get a SOLID
 * navy dot (vs the thin dash for PREDICTED period days). `onChange` recalibrates the host.
 */
export function CycleCalendar({
  settings,
  surface,
  onChange,
}: {
  settings: CycleSettings | null
  surface: PredictionSurface
  onChange?: () => void
}) {
  const { session } = useAuth()
  const { ink, sub, gold, cardwash, cardbd } = surface
  const [view, setView] = useState(() => startOfMonth(new Date()))
  const [events, setEvents] = useState<PeriodEvent[]>([])
  const [tapped, setTapped] = useState<string | null>(null)
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

  const flash = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), type === 'error' ? 2800 : 1600)
  }

  if (!settings) {
    return (
      <View style={styles.card}>
        <Text style={[styles.eyebrow, { color: gold }]}>Cycle calendar</Text>
        <Text style={[styles.placeholder, { color: ink }]}>
          Your predicted phases appear here once your cycle is set up.
        </Text>
      </View>
    )
  }

  const year = view.getFullYear()
  const month = view.getMonth()
  const daysInMonth = getDaysInMonth(view)
  const lead = getDay(startOfMonth(view))
  const today = new Date()
  const todayYmd = format(today, 'yyyy-MM-dd')
  const loggedDays = loggedPeriodDays(events, todayYmd)

  const cells: (number | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  const ymdOf = (d: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  const dayInfo = (dayNum: number) => {
    const date = new Date(year, month, dayNum)
    const cycleDay = getDayInCycle(settings.startDate, format(date, 'yyyy-MM-dd'), settings.cycleLength)
    const cyclesPassed = Math.floor(differenceInCalendarDays(date, parseISO(settings.startDate)) / settings.cycleLength)
    const pl = cyclesPassed === 0 ? settings.periodLength : settings.projectedPeriodLength
    const id = getPhaseForDay(cycleDay, settings.cycleLength, pl).id
    return { date, cycleDay, id }
  }

  const ovRange = getPhaseRanges(settings.cycleLength, settings.periodLength).find((r) => r.phase === 'ovulatory')
  const peakCycleDay = ovRange
    ? Math.min(Math.max(settings.cycleLength - 13, ovRange.startDay), ovRange.endDay)
    : -1

  // ── Tap-to-log ──
  const onTapCell = (ymd: string) => {
    if (resolveCalendarTap(events, todayYmd, ymd).kind === 'none') return
    setTapped(ymd)
  }

  const tapAction = tapped ? resolveCalendarTap(events, todayYmd, tapped) : { kind: 'none' as const }
  const confirm = (() => {
    if (!tapped) return null
    const label = fmtYmd(tapped)
    const mr = events[0]
    const gap = mr ? daysBetweenYmd(tapped, mr.startDate) : 0
    switch (tapAction.kind) {
      case 'start':
        return tapAction.guard
          ? { msg: `Only ${gap} days since your last logged period. Mark period started ${label} anyway?`, btn: 'Log anyway', danger: false }
          : { msg: `Mark period started ${label}?`, btn: 'Mark started', danger: false }
      case 'end':
        return { msg: `Mark period ended ${label}?`, btn: 'Mark ended', danger: false }
      case 'remove':
        return { msg: 'Remove this logged period?', btn: 'Remove', danger: true }
      case 'clearEnd':
        return { msg: 'Remove the logged end date? This reopens the period.', btn: 'Remove end', danger: true }
      default:
        return null
    }
  })()

  const execTap = async () => {
    if (!tapped || !session) return
    const action = resolveCalendarTap(events, todayYmd, tapped)
    if (action.kind === 'none') return
    setBusy(true)
    const call = (path: string, method: string, body?: object) =>
      fetch(`${API_URL}${path}`, { method, headers: authHeaders(), body: body ? JSON.stringify(body) : undefined })
    try {
      let r: Response
      let msg = ''
      if (action.kind === 'start') {
        r = await call('/me/period-events', 'POST', { startDate: action.date })
        msg = `Period logged: ${fmtYmd(action.date)}`
      } else if (action.kind === 'end') {
        r = await call(`/me/period-events/${action.id}`, 'PATCH', { endDate: action.date })
        msg = `Period ended: ${fmtYmd(action.date)}`
      } else if (action.kind === 'remove') {
        r = await call(`/me/period-events/${action.id}`, 'DELETE')
        msg = 'Removed'
      } else {
        r = await call(`/me/period-events/${action.id}`, 'PATCH', { endDate: null })
        msg = 'Reopened'
      }
      if (!r.ok) throw new Error('save failed')
      flash(msg, 'success')
      await load()
      onChange?.()
      setTapped(null)
    } catch {
      flash("Couldn't save — try again", 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={styles.card}>
      {/* header: month + nav */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => setView((v) => addMonths(v, -1))} hitSlop={10}>
          <Text style={[styles.nav, { color: gold }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.month, { color: ink }]}>{format(view, 'MMMM yyyy')}</Text>
        <TouchableOpacity onPress={() => setView((v) => addMonths(v, 1))} hitSlop={10}>
          <Text style={[styles.nav, { color: gold }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* weekday header */}
      <View style={styles.weekRow}>
        {WEEKDAYS.map((w, i) => (
          <Text key={i} style={[styles.weekday, { color: sub }]}>{w}</Text>
        ))}
      </View>

      {/* day grid — tap to log; solid dot = logged, dash = predicted */}
      <View style={styles.grid}>
        {cells.map((dayNum, i) => {
          if (dayNum === null) return <View key={`b${i}`} style={styles.cell} />
          const { date, cycleDay, id } = dayInfo(dayNum)
          const ymd = ymdOf(dayNum)
          const isToday = isSameDay(date, today)
          const isFuture = ymd > todayYmd
          const isLogged = loggedDays.has(ymd)
          const isSelected = tapped === ymd
          const isPeak = id === 'ovulatory' && cycleDay === peakCycleDay
          const dashColor =
            id === 'menstrual' ? NAVY : id === 'ovulatory' && !isPeak ? phaseColor('ovulatory') : null
          return (
            <View key={dayNum} style={styles.cell}>
              <Pressable
                disabled={isFuture}
                onPress={() => onTapCell(ymd)}
                style={[
                  styles.cellInner,
                  {
                    borderColor: isSelected ? gold : cardbd,
                    borderWidth: isSelected ? 2 : 1,
                    backgroundColor: isToday ? TODAY_FILL : 'transparent',
                    opacity: isFuture ? 0.5 : 1,
                  },
                ]}
              >
                <Text
                  style={[styles.cellNum, { color: NUM, fontFamily: isToday ? 'Marcellus_400Regular' : 'Raleway_500Medium' }]}
                >
                  {dayNum}
                </Text>
                <View style={styles.markSlot}>
                  {isPeak ? (
                    <Text style={[styles.star, { color: phaseColor('ovulatory') }]}>★</Text>
                  ) : isLogged ? (
                    <View style={[styles.loggedDot, { backgroundColor: NAVY }]} />
                  ) : dashColor ? (
                    <View style={[styles.dash, { backgroundColor: dashColor }]} />
                  ) : null}
                </View>
              </Pressable>
            </View>
          )
        })}
      </View>

      {/* confirm panel (tapped cell shows a gold ring) */}
      {tapped && confirm && (
        <View style={[styles.confirm, { backgroundColor: cardwash, borderColor: cardbd }]}>
          <Text style={[styles.confirmMsg, { color: ink }]}>{confirm.msg}</Text>
          <View style={styles.confirmActions}>
            <Pressable onPress={execTap} disabled={busy} style={[styles.confirmBtn, { backgroundColor: confirm.danger ? '#7A1E2E' : gold, opacity: busy ? 0.6 : 1 }]}>
              <Text style={[styles.confirmBtnText, { color: confirm.danger ? '#FBF6EC' : '#2C2825' }]}>{busy ? 'Saving…' : confirm.btn}</Text>
            </Pressable>
            <Pressable onPress={() => setTapped(null)} style={[styles.confirmCancel, { borderColor: cardbd }]}>
              <Text style={[styles.confirmCancelText, { color: ink }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: NAVY }]} />
          <Text style={[styles.legendLabel, { color: sub }]}>Logged period</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDash, { backgroundColor: NAVY }]} />
          <Text style={[styles.legendLabel, { color: sub }]}>Predicted period</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDash, { backgroundColor: phaseColor('ovulatory') }]} />
          <Text style={[styles.legendLabel, { color: sub }]}>Fertile window</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={[styles.legendStar, { color: phaseColor('ovulatory') }]}>★</Text>
          <Text style={[styles.legendLabel, { color: sub }]}>Peak ovulation (estimated)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendToday, { backgroundColor: TODAY_FILL, borderColor: cardbd }]} />
          <Text style={[styles.legendLabel, { color: sub }]}>Today</Text>
        </View>
      </View>
      <Text style={[styles.note, { color: sub }]}>Tap a day to log or remove a period · estimated phases otherwise.</Text>

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'transparent' },
  eyebrow: { fontFamily: 'Raleway_600SemiBold', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase' },
  placeholder: { fontFamily: 'Raleway_300Light', fontSize: 12, marginTop: 6, opacity: 0.85 },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nav: { fontSize: 22, width: 28, textAlign: 'center' },
  month: { fontFamily: 'Marcellus_400Regular', fontSize: 16 },

  weekRow: { flexDirection: 'row', marginTop: 10 },
  weekday: { flex: 1, textAlign: 'center', fontFamily: 'Raleway_400Regular', fontSize: 8.5 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2 },
  cellInner: { flex: 1, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  cellNum: { fontSize: 11.5, lineHeight: 13 },
  markSlot: { height: 7, marginTop: 3, alignItems: 'center', justifyContent: 'center' },
  dash: { width: 11, height: 2.5, borderRadius: 2 },
  loggedDot: { width: 6, height: 6, borderRadius: 999 },
  star: { fontSize: 10, lineHeight: 10 },

  confirm: { marginTop: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  confirmMsg: { fontFamily: 'Raleway_300Light', fontSize: 12, lineHeight: 18 },
  confirmActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  confirmBtn: { borderRadius: 11, paddingVertical: 8, paddingHorizontal: 16 },
  confirmBtnText: { fontFamily: 'Raleway_600SemiBold', fontSize: 11 },
  confirmCancel: { borderRadius: 11, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 14 },
  confirmCancelText: { fontFamily: 'Raleway_500Medium', fontSize: 11 },

  legend: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 6 },
  legendDot: { width: 7, height: 7, borderRadius: 999, marginRight: 5 },
  legendDash: { width: 11, height: 2.5, borderRadius: 2, marginRight: 5 },
  legendStar: { fontSize: 11, marginRight: 5 },
  legendToday: { width: 12, height: 12, borderRadius: 4, borderWidth: 1, marginRight: 5 },
  legendLabel: { fontFamily: 'Raleway_400Regular', fontSize: 9 },

  note: { fontFamily: 'Raleway_400Regular', fontSize: 9, marginTop: 8, opacity: 0.85 },
})
