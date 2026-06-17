'use client'
import React, { useEffect, useState } from 'react'
import {
  getDayInCycle, getPhaseForDay, getPhaseRanges, resolveCalendarTap, loggedPeriodDays, daysBetweenYmd,
} from '@lunari/phase-data'
import { phases as phaseTheme, phaseKeyFor, palette } from '@lunari/design-tokens'
import { Toast } from '@lunari/ui'
import type { CycleSettings, PhaseId, PeriodEvent } from '@lunari/types'
import { addMonths, differenceInCalendarDays, format, getDay, getDaysInMonth, isSameDay, parseISO, startOfMonth } from 'date-fns'
import { apiGet, apiPost, apiPatch, apiDelete } from '@/src/lib/api'
import type { PredictionSurface } from './NextUpCard'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const phaseColor = (id: PhaseId) => phaseTheme[phaseKeyFor(id)].phase
const NUM = palette.goldOnLight // readable gold for every date number
const TODAY_FILL = `${palette.goldOnLight}26` // subtle gold wash marks today
const NAVY = phaseColor('menstrual')
const fmtYmd = (ymd: string) => format(parseISO(ymd), 'MMM d')

/**
 * Month calendar + period-logging surface. Tapping a date logs/ends/removes a period
 * (rules shared with the Today button via resolveCalendarTap), and logged days get a
 * SOLID navy dot (vs the thin dash for PREDICTED period days). `onChange` recalibrates
 * the host (refetch effective cycle) after any change.
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
  const { ink, sub, gold, cardwash, cardbd } = surface
  const [view, setView] = useState(() => startOfMonth(new Date()))
  const [events, setEvents] = useState<PeriodEvent[]>([])
  const [tapped, setTapped] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const load = () => apiGet<PeriodEvent[]>('/me/period-events').then(setEvents).catch(() => {})
  useEffect(() => { load() }, [])

  const flash = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), type === 'error' ? 2800 : 1600)
  }

  const cardStyle: React.CSSProperties = { background: 'transparent' }

  if (!settings) {
    return (
      <div style={cardStyle}>
        <div className="uppercase" style={{ fontSize: 9, letterSpacing: '0.22em', color: gold, fontWeight: 600 }}>
          Cycle calendar
        </div>
        <div style={{ fontSize: 12, color: ink, opacity: 0.85, marginTop: 6, fontWeight: 300 }}>
          Your predicted phases appear here once your cycle is set up.
        </div>
      </div>
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
    if (!tapped) return
    const action = resolveCalendarTap(events, todayYmd, tapped)
    if (action.kind === 'none') return
    setBusy(true)
    try {
      if (action.kind === 'start') {
        await apiPost('/me/period-events', { startDate: action.date })
        flash(`Period logged: ${fmtYmd(action.date)}`, 'success')
      } else if (action.kind === 'end') {
        await apiPatch(`/me/period-events/${action.id}`, { endDate: action.date })
        flash(`Period ended: ${fmtYmd(action.date)}`, 'success')
      } else if (action.kind === 'remove') {
        await apiDelete(`/me/period-events/${action.id}`)
        flash('Removed', 'success')
      } else if (action.kind === 'clearEnd') {
        await apiPatch(`/me/period-events/${action.id}`, { endDate: null })
        flash('Reopened', 'success')
      }
      await load()
      onChange?.()
      setTapped(null)
    } catch {
      flash("Couldn't save — try again", 'error')
    } finally {
      setBusy(false)
    }
  }

  const navBtn: React.CSSProperties = { fontSize: 16, color: gold, width: 28, height: 28 }

  return (
    <div style={cardStyle}>
      {/* header: month + nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => setView((v) => addMonths(v, -1))} aria-label="Previous month" style={navBtn}>‹</button>
        <span className="font-display" style={{ fontSize: 16, color: ink }}>{format(view, 'MMMM yyyy')}</span>
        <button onClick={() => setView((v) => addMonths(v, 1))} aria-label="Next month" style={navBtn}>›</button>
      </div>

      {/* weekday header */}
      <div className="grid grid-cols-7" style={{ marginTop: 10 }}>
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="text-center" style={{ fontSize: 8.5, letterSpacing: '0.06em', color: sub }}>{w}</div>
        ))}
      </div>

      {/* day grid — tap to log; solid dot = logged, dash = predicted */}
      <div className="grid grid-cols-7" style={{ gap: 4, marginTop: 6 }}>
        {cells.map((dayNum, i) => {
          if (dayNum === null) return <div key={`b${i}`} />
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
            <button
              key={dayNum}
              type="button"
              disabled={isFuture}
              onClick={() => onTapCell(ymd)}
              className="flex flex-col items-center justify-center"
              style={{
                aspectRatio: '1 / 1',
                borderRadius: 9,
                border: `${isSelected ? 2 : 1}px solid ${isSelected ? gold : cardbd}`,
                background: isToday ? TODAY_FILL : 'transparent',
                cursor: isFuture ? 'default' : 'pointer',
                opacity: isFuture ? 0.5 : 1,
              }}
            >
              <span
                className={isToday ? 'font-display' : undefined}
                style={{ fontSize: 11.5, color: NUM, fontWeight: isToday ? 700 : 500, lineHeight: 1 }}
              >
                {dayNum}
              </span>
              {/* mark slot — peak star > logged dot > predicted dash */}
              <span className="flex items-center justify-center" style={{ height: 7, marginTop: 3 }}>
                {isPeak ? (
                  <span style={{ fontSize: 10, color: phaseColor('ovulatory'), lineHeight: 1 }}>★</span>
                ) : isLogged ? (
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: NAVY }} />
                ) : dashColor ? (
                  <span style={{ width: 11, height: 2.5, borderRadius: 2, background: dashColor }} />
                ) : null}
              </span>
            </button>
          )
        })}
      </div>

      {/* confirm panel (anchored: tapped cell shows a gold ring) */}
      {tapped && confirm && (
        <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 12, background: cardwash, border: `1px solid ${cardbd}` }}>
          <div style={{ fontSize: 12, color: ink, fontWeight: 300, lineHeight: 1.5 }}>{confirm.msg}</div>
          <div className="flex" style={{ gap: 8, marginTop: 10 }}>
            <button
              onClick={execTap}
              disabled={busy}
              style={{ fontSize: 11, fontWeight: 600, padding: '8px 16px', borderRadius: 11, background: confirm.danger ? '#7A1E2E' : gold, color: confirm.danger ? '#FBF6EC' : '#2C2825', opacity: busy ? 0.6 : 1 }}
            >
              {busy ? 'Saving…' : confirm.btn}
            </button>
            <button
              onClick={() => setTapped(null)}
              style={{ fontSize: 11, padding: '8px 14px', borderRadius: 11, background: 'transparent', color: ink, border: `1px solid ${cardbd}` }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* legend */}
      <div className="flex flex-wrap" style={{ gap: '7px 14px', marginTop: 14 }}>
        <LegendItem sub={sub} label="Logged period">
          <span style={{ width: 7, height: 7, borderRadius: 999, background: NAVY }} />
        </LegendItem>
        <LegendItem sub={sub} label="Predicted period">
          <span style={{ width: 11, height: 2.5, borderRadius: 2, background: NAVY }} />
        </LegendItem>
        <LegendItem sub={sub} label="Fertile window">
          <span style={{ width: 11, height: 2.5, borderRadius: 2, background: phaseColor('ovulatory') }} />
        </LegendItem>
        <LegendItem sub={sub} label="Peak ovulation (estimated)">
          <span style={{ fontSize: 11, color: phaseColor('ovulatory'), lineHeight: 1 }}>★</span>
        </LegendItem>
        <LegendItem sub={sub} label="Today">
          <span style={{ width: 12, height: 12, borderRadius: 4, background: TODAY_FILL, border: `1px solid ${cardbd}` }} />
        </LegendItem>
      </div>
      <div style={{ fontSize: 9, color: sub, marginTop: 8, opacity: 0.85, lineHeight: 1.5 }}>
        Tap a day to log or remove a period · estimated phases otherwise.
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  )
}

function LegendItem({ children, label, sub }: { children: React.ReactNode; label: string; sub: string }) {
  return (
    <div className="flex items-center" style={{ gap: 5 }}>
      <span className="flex items-center justify-center" style={{ width: 12 }}>{children}</span>
      <span style={{ fontSize: 9, color: sub }}>{label}</span>
    </div>
  )
}
