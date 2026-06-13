'use client'
import React, { useState } from 'react'
import { getDayInCycle, getPhaseForDay } from '@lunari/phase-data'
import { phases as phaseTheme, phaseKeyFor } from '@lunari/design-tokens'
import type { CycleSettings, PhaseId } from '@lunari/types'
import { addMonths, format, getDay, getDaysInMonth, isSameDay, startOfMonth } from 'date-fns'
import type { PredictionSurface } from './NextUpCard'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const LEGEND: PhaseId[] = ['menstrual', 'follicular', 'ovulatory', 'luteal']

const phaseColor = (id: PhaseId) => phaseTheme[phaseKeyFor(id)].phase
const phaseLabel = (id: PhaseId) => phaseTheme[phaseKeyFor(id)].label

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

      {/* day grid */}
      <div className="grid grid-cols-7" style={{ gap: 4, marginTop: 6 }}>
        {cells.map((dayNum, i) => {
          if (dayNum === null) return <div key={`b${i}`} />
          const { date, cycleDay, id } = dayInfo(dayNum)
          const isToday = isSameDay(date, today)
          const isPeriodStart = cycleDay === 1 // predicted next-period start
          const ringColor = isToday ? gold : isPeriodStart ? phaseColor('menstrual') : 'transparent'
          return (
            <div
              key={dayNum}
              className="flex flex-col items-center justify-center"
              style={{
                aspectRatio: '1 / 1',
                borderRadius: 9,
                // Soft tint of the phase colour on the light Lab card.
                background: `${phaseColor(id)}2E`,
                border: `2px solid ${ringColor}`,
              }}
            >
              <span
                className={isToday ? 'font-display' : undefined}
                style={{ fontSize: 11.5, color: ink, fontWeight: isToday ? 700 : 400, lineHeight: 1 }}
              >
                {dayNum}
              </span>
              {/* Crisp phase dot — matches the legend colours exactly. */}
              <span style={{ width: 5, height: 5, borderRadius: 999, background: phaseColor(id), marginTop: 3 }} />
            </div>
          )
        })}
      </div>

      {/* legend */}
      <div className="flex flex-wrap" style={{ gap: '6px 14px', marginTop: 12 }}>
        {LEGEND.map((id) => (
          <div key={id} className="flex items-center" style={{ gap: 5 }}>
            <span style={{ width: 9, height: 9, borderRadius: 999, background: phaseColor(id) }} />
            <span style={{ fontSize: 9, color: sub }}>{phaseLabel(id)}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 9, color: sub, marginTop: 8, opacity: 0.85 }}>
        Estimated phases · today is ringed in gold · a coloured ring marks a predicted period start.
      </div>
    </div>
  )
}
