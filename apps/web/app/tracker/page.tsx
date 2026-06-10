'use client'
import React, { useState } from 'react'
import { PhaseHero, ContainerRow, SupplementCard } from '@lunari/ui'
import { getPhaseForDay } from '@lunari/phase-data'
import { useCycleContext } from './layout'

export default function TrackerToday() {
  const { cycleData } = useCycleContext()
  const phase = cycleData ? getPhaseForDay(cycleData.day) : getPhaseForDay(1)
  const [quickSymptoms, setQuickSymptoms] = useState<string[]>([])

  const toggleSymptom = (s: string) =>
    setQuickSymptoms((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])

  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl text-brand-ink">Today</h1>
        <p className="text-sm text-brand-ink-soft mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <PhaseHero phase={phase} cycleDay={cycleData?.day ?? 1} />

      <div>
        <p className="text-sm text-brand-ink-soft mb-3">
          Container {cycleData?.containerNumber ?? 1} of 4 — {phase.name} phase
        </p>
        <ContainerRow phase={phase} currentDay={cycleData?.day ?? 1} />
      </div>

      <div>
        <h2 className="font-body text-base font-semibold text-brand-ink mb-3">
          How are you feeling today?
        </h2>
        <div className="flex flex-wrap gap-2">
          {phase.symptoms.slice(0, 4).map((s) => (
            <button
              key={s}
              onClick={() => toggleSymptom(s)}
              className="px-3.5 py-2 rounded-full border-2 text-sm font-medium transition-all"
              style={{
                backgroundColor: quickSymptoms.includes(s) ? phase.color : '#FFFFFF',
                borderColor: quickSymptoms.includes(s) ? phase.color : '#E8E2D6',
                color: quickSymptoms.includes(s) ? '#FFFFFF' : '#2C2825',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-body text-base font-semibold text-brand-ink mb-3">
          Today's supplement focus
        </h2>
        <div className="flex flex-col gap-2">
          {phase.supplements.slice(8, 10).map((s) => (
            <SupplementCard key={s.name} supplement={s} />
          ))}
        </div>
      </div>
    </div>
  )
}
