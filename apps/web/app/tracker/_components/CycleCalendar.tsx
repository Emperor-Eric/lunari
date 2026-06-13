'use client'
import React, { useState } from 'react'
import { getDayInCycle, getPhaseForDay, getPhaseRanges } from '@lunari/phase-data'
import { phases as phaseTheme, phaseKeyFor } from '@lunari/design-tokens'
import type { CycleSettings, PhaseId } from '@lunari/types'
import { addMonths, format, getDay, getDaysInMonth, isSameDay, startOfMonth } from 'date-fns'
import type { PredictionSurface } from './NextUpCard'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const phaseColor = (id: PhaseId) => phaseTheme[phaseKeyFor(id)].phase
const PERIOD_NUM = '#FBF6EC' // light number inside the navy period circle

/**
 * Self-contained month calendar. Each day is tinted by its PREDICTED phase
 * (proportional model, projected forward by repeating the cycle from startDate).
 * Pure aside from its own month-navigation state — trivially relocatable.
 */
export function CycleCalendar({
  settings,
  surface,
}: {
  settings: CycleSettings | null
  surface: PredictionSurface
}) {
  const { ink, sub, gold, cardwash, cardbd } = surface
  const [view, setView] = useState(() => startOfMonth(new Date()))

  const cardStyle: React.CSSProperties = {
    padding: '14px 16px',
    borderRadius: 14,
    background: cardwash,
    border: `1px solid ${cardbd}`,
  }

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
  const lead = getDay(startOfMonth(view)) // 0=Sun
  const today = new Date()

  const cells: (number | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const dayInfo = (dayNum: number) => {
    const date = new Date(year, month, dayNum)
    const cycleDay = getDayInCycle(settings.startDate, format(date, 'yyyy-MM-dd'), settings.cycleLength)
    const id = getPhaseForDay(cycleDay, settings.cycleLength, settings.periodLength).id
    return { date, cycleDay, id }
  }

  // Peak ovulation = ~14 days before the next period, clamped into the proportional
  // ovulation window → exactly ONE starred day per cycle (others get the saffron dot).
  const ovRange = getPhaseRanges(settings.cycleLength, settings.periodLength).find((r) => r.phase === 'ovulatory')
  const peakCycleDay = ovRange
    ? Math.min(Math.max(settings.cycleLength - 13, ovRange.startDay), ovRange.endDay)
    : -1

  return (
    <div style={cardStyle}>
      {/* header: month + nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setView((v) => addMonths(v, -1))}
          aria-label="Previous month"
          style={{ fontSize: 16, color: gold, width: 28, height: 28 }}
        >
          ‹
        </button>
        <span className="font-display" style={{ fontSize: 16, color: ink }}>
          {format(view, 'MMMM yyyy')}
        </span>
        <button
          onClick={() => setView((v) => addMonths(v, 1))}
          aria-label="Next month"
          style={{ fontSize: 16, color: gold, width: 28, height: 28 }}
        >
          ›
        </button>
      </div>

      {/* weekday header */}
      <div className="grid grid-cols-7" style={{ marginTop: 10 }}>
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="text-center" style={{ fontSize: 8.5, letterSpacing: '0.06em', color: sub }}>
            {w}
          </div>
        ))}
      </div>

      {/* day grid — neutral cells; phase is shown by dot/star/navy-circle */}
      <div className="grid grid-cols-7" style={{ gap: 4, marginTop: 6 }}>
        {cells.map((dayNum, i) => {
          if (dayNum === null) return <div key={`b${i}`} />
          const { date, cycleDay, id } = dayInfo(dayNum)
          const isToday = isSameDay(date, today)
          const isMenstrual = id === 'menstrual'
          const isPeak = id === 'ovulatory' && cycleDay === peakCycleDay
          const dotColor =
            id === 'follicular'
              ? phaseColor('follicular')
              : id === 'luteal'
                ? phaseColor('luteal')
                : id === 'ovulatory' && !isPeak
                  ? phaseColor('ovulatory')
                  : null
          return (
            <div
              key={dayNum}
              className="flex flex-col items-center justify-center"
              style={{ aspectRatio: '1 / 1', borderRadius: 9, border: `2px solid ${isToday ? gold : 'transparent'}` }}
            >
              {isMenstrual ? (
                <span
                  className="flex items-center justify-center"
                  style={{ width: 22, height: 22, borderRadius: 999, background: phaseColor('menstrual'), color: PERIOD_NUM, fontSize: 11, fontWeight: 600 }}
                >
                  {dayNum}
                </span>
              ) : (
                <span
                  className={isToday ? 'font-display' : undefined}
                  style={{ fontSize: 11.5, color: ink, fontWeight: isToday ? 700 : 400, lineHeight: 1 }}
                >
                  {dayNum}
                </span>
              )}
              {/* mark slot — fixed height keeps every row aligned */}
              <span className="flex items-center justify-center" style={{ height: 9, marginTop: 2 }}>
                {isPeak ? (
                  <span style={{ fontSize: 10, color: phaseColor('ovulatory'), lineHeight: 1 }}>★</span>
                ) : dotColor ? (
                  <span style={{ width: 5, height: 5, borderRadius: 999, background: dotColor }} />
                ) : null}
              </span>
            </div>
          )
        })}
      </div>

      {/* legend */}
      <div className="flex flex-wrap" style={{ gap: '7px 14px', marginTop: 12 }}>
        <LegendItem sub={sub} label="Menstrual">
          <span style={{ width: 11, height: 11, borderRadius: 999, background: phaseColor('menstrual') }} />
        </LegendItem>
        <LegendItem sub={sub} label="Follicular">
          <span style={{ width: 7, height: 7, borderRadius: 999, background: phaseColor('follicular') }} />
        </LegendItem>
        <LegendItem sub={sub} label="Ovulation (peak)">
          <span style={{ fontSize: 11, color: phaseColor('ovulatory'), lineHeight: 1 }}>★</span>
        </LegendItem>
        <LegendItem sub={sub} label="Fertile window">
          <span style={{ width: 7, height: 7, borderRadius: 999, background: phaseColor('ovulatory') }} />
        </LegendItem>
        <LegendItem sub={sub} label="Luteal">
          <span style={{ width: 7, height: 7, borderRadius: 999, background: phaseColor('luteal') }} />
        </LegendItem>
      </div>
      <div style={{ fontSize: 9, color: sub, marginTop: 8, opacity: 0.85 }}>
        Estimated phases · today ringed in gold · ★ peak ovulation · navy circle = period day.
      </div>
    </div>
  )
}

function LegendItem({ children, label, sub }: { children: React.ReactNode; label: string; sub: string }) {
  return (
    <div className="flex items-center" style={{ gap: 5 }}>
      <span className="flex items-center justify-center" style={{ width: 12 }}>
        {children}
      </span>
      <span style={{ fontSize: 9, color: sub }}>{label}</span>
    </div>
  )
}
