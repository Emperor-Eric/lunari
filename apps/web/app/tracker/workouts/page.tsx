'use client'
import React from 'react'
import { WorkoutCard } from '@lunari/ui'
import { getPhaseForDay } from '@lunari/phase-data'
import { useCycleContext } from '../cycle-context'

export default function WorkoutsPage() {
  const { cycleData } = useCycleContext()
  const phase = cycleData ? getPhaseForDay(cycleData.day) : getPhaseForDay(1)

  return (
    <div className="max-w-3xl mx-auto p-6 flex flex-col gap-6">
      {/* Phase strip */}
      <div
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-semibold self-start"
        style={{ backgroundColor: phase.lightColor, color: phase.color }}
      >
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: phase.color }} />
        {phase.name} phase
      </div>

      <h1 className="font-display text-3xl text-brand-ink">Move</h1>

      <div>
        <h2 className="text-base font-semibold text-brand-ink mb-3">Recommended this phase</h2>
        {/* 3-column desktop, horizontal scroll mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {phase.workouts.map((w) => (
            <WorkoutCard key={w.title} workout={w} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-brand-ink mb-3">Best to avoid</h2>
        <div className="flex flex-col gap-3">
          {phase.avoidWorkouts.map((a) => (
            <div
              key={a.name}
              className="bg-white rounded-xl p-4 border border-brand-stone flex flex-col gap-1"
            >
              <span className="text-sm font-semibold text-phase-menstrual">✗ {a.name}</span>
              <span className="text-xs text-brand-ink-soft">{a.reason}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
