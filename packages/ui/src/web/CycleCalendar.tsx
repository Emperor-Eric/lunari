import React from 'react'
import { getPhaseForDay } from '@lunari/phase-data'

interface Props {
  cycleStartDate: string
  currentDay: number
  logs: { day: number }[]
}

export const CycleCalendar: React.FC<Props> = ({ currentDay, logs }) => {
  const days = Array.from({ length: 28 }, (_, i) => i + 1)
  const logDays = new Set(logs.map((l) => l.day))

  const renderDot = (day: number) => {
    const phase = getPhaseForDay(day)
    const isToday = day === currentDay
    const hasLog = logDays.has(day)

    return (
      <div key={day} className="flex flex-col items-center gap-0.5">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold"
          style={{
            backgroundColor: isToday ? phase.color : phase.lightColor,
            color: isToday ? '#FFFFFF' : phase.color,
          }}
        >
          {day}
        </div>
        {hasLog && (
          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: phase.color }} />
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-14 gap-1">{days.slice(0, 14).map(renderDot)}</div>
      <div className="grid grid-cols-14 gap-1">{days.slice(14).map(renderDot)}</div>
    </div>
  )
}
