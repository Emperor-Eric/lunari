'use client'
import React, { useState } from 'react'
import { getPhaseForDay } from '@lunari/phase-data'
import { phases, phaseKeyFor, palette } from '@lunari/design-tokens'
import { useCycleContext } from './cycle-context'

export default function TrackerToday() {
  const { cycleData } = useCycleContext()
  const phase = cycleData ? getPhaseForDay(cycleData.day) : getPhaseForDay(1)
  const t = phases[phaseKeyFor(phase.id)]
  const containerNumber = cycleData?.containerNumber ?? 1
  const day = cycleData?.day ?? 1

  const [quickSymptoms, setQuickSymptoms] = useState<string[]>([])
  const toggleSymptom = (s: string) =>
    setQuickSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    // Lab background — phase-tinted, light, legible
    <div className="min-h-screen" style={{ backgroundColor: t.labBg }}>
      <div className="max-w-2xl mx-auto flex flex-col gap-6 p-6">
        {/* ─── HERO: floods with the phase gradient ─── */}
        <div className="rounded-[28px] overflow-hidden" style={{ background: t.flood }}>
          <div className="px-8 py-10 text-center">
            <p
              className="font-body text-[11px] font-medium uppercase tracking-[0.28em]"
              style={{ color: t.headerLabel }}
            >
              {t.vibe}
            </p>
            <h1 className="font-display text-5xl mt-3 leading-none" style={{ color: t.floodText }}>
              {t.label}
            </h1>
            <p className="font-body text-sm mt-3" style={{ color: t.floodSub }}>
              Day {day} · {dateLabel}
            </p>

            {/* Phase progress segments — current = gold */}
            <div className="flex gap-1.5 mt-7 justify-center">
              {[1, 2, 3, 4].map((n) => (
                <span
                  key={n}
                  className="h-1 w-12 rounded-full transition-colors"
                  style={{ backgroundColor: n === containerNumber ? palette.gold : 'rgba(255,255,255,0.22)' }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ─── Container selector — 1/2/3/4, active = gold ─── */}
        <div>
          <p className="font-body text-sm mb-3" style={{ color: t.textMuted }}>
            Container {containerNumber} of 4 — {t.label} phase
          </p>
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((n) => {
              const active = n === containerNumber
              return (
                <div
                  key={n}
                  className="flex-1 rounded-2xl py-4 text-center border-2 transition-colors"
                  style={{
                    backgroundColor: t.labCard,
                    borderColor: active ? palette.gold : t.labBorder,
                  }}
                >
                  <span
                    className="font-display text-3xl"
                    style={{ color: active ? palette.goldOnLight : t.textMuted }}
                  >
                    {n}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ─── Symptoms — Lab card ─── */}
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: t.labCard, borderColor: t.labBorder }}>
          <h2 className="font-body text-base font-semibold mb-3" style={{ color: t.text }}>
            How are you feeling today?
          </h2>
          <div className="flex flex-wrap gap-2">
            {phase.symptoms.slice(0, 4).map((s) => {
              const on = quickSymptoms.includes(s)
              return (
                <button
                  key={s}
                  onClick={() => toggleSymptom(s)}
                  className="font-body px-3.5 py-2 rounded-full border-2 text-sm font-medium transition-all"
                  style={{
                    backgroundColor: on ? t.accent : t.labCard,
                    borderColor: on ? t.accent : t.labBorder,
                    color: on ? '#FFFFFF' : t.text,
                  }}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </div>

        {/* ─── Supplement focus — Lab card ─── */}
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: t.labCard, borderColor: t.labBorder }}>
          <h2 className="font-body text-base font-semibold mb-3" style={{ color: t.text }}>
            Today&apos;s supplement focus
          </h2>
          <div className="flex flex-col gap-2">
            {phase.supplements.slice(8, 10).map((s) => (
              <div
                key={s.name}
                className="rounded-xl p-3.5 flex items-center justify-between gap-3"
                style={{ backgroundColor: t.labWhy }}
              >
                <div className="flex flex-col gap-0.5">
                  <p className="font-body text-sm font-semibold" style={{ color: t.text }}>
                    {s.name}
                  </p>
                  <p className="font-body text-xs leading-snug" style={{ color: t.textSoft }}>
                    {s.purpose}
                  </p>
                </div>
                <span
                  className="font-mono text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap"
                  style={{ backgroundColor: t.labCard, color: t.accent }}
                >
                  {s.dosage}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
