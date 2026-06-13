'use client'
import React, { useState } from 'react'
import { getPhaseForDay, getPhaseById } from '@lunari/phase-data'
import { phases as phaseTheme, phaseKeyFor } from '@lunari/design-tokens'
import type { PhaseId } from '@lunari/types'
import { useCycleContext } from '../cycle-context'

// Curated per-phase Fuel metadata (phase-data has no nutrition-tagline / focus-nutrient
// fields). Ovulation matches the design reference exactly.
const FUEL_TAGLINE: Record<PhaseId, string> = {
  menstrual: 'iron-rich, warming, replenishing',
  follicular: 'fresh, vibrant, energising',
  ovulatory: 'light, fresh, anti-inflammatory',
  luteal: 'grounding, complex carbs, magnesium',
}
const FUEL_FOCUS: Record<PhaseId, { label: string; sub: string }[]> = {
  menstrual: [
    { label: 'Iron', sub: 'replenish' },
    { label: 'Warm', sub: 'soothe' },
    { label: 'Magnesium', sub: 'ease cramps' },
  ],
  follicular: [
    { label: 'Protein', sub: 'build' },
    { label: 'Probiotics', sub: 'gut' },
    { label: 'Seeds', sub: 'estrogen' },
  ],
  ovulatory: [
    { label: 'Fiber', sub: 'clearance' },
    { label: 'Raw', sub: 'cooling' },
    { label: 'Zinc', sub: 'egg quality' },
  ],
  luteal: [
    { label: 'Complex carbs', sub: 'calm' },
    { label: 'Magnesium', sub: 'mood' },
    { label: 'Fiber', sub: 'anti-bloat' },
  ],
}

// Fixed Lab neutrals — phase-independent (labBg is light on all four phases).
const N = { section: '#A99E88', title: '#2C2825', stat: '#6A655D' }

export default function NutritionPage() {
  const { cycleData } = useCycleContext()
  const day = cycleData?.day ?? 1
  const phase = cycleData ? getPhaseById(cycleData.phase) : getPhaseForDay(1)
  const t = phaseTheme[phaseKeyFor(phase.id)]
  const [coreOpen, setCoreOpen] = useState(false)

  const focus = FUEL_FOCUS[phase.id]
  const phaseSupplements = phase.supplements.slice(8)
  const coreBlend = phase.supplements.slice(0, 8)

  const divider = (last: boolean) => (last ? 'none' : `1px solid ${t.labBorder}`)

  return (
    <div className="min-h-screen" style={{ backgroundColor: t.labBg }}>
      {/* ── HEADER BAND (phase gradient) ── */}
      <div className="relative overflow-hidden" style={{ background: t.header, color: t.headerText }}>
        <svg
          className="absolute pointer-events-none"
          style={{ right: -34, top: -22, width: 130, height: 130 }}
          viewBox="0 0 130 130"
          fill="none"
          aria-hidden
        >
          <circle cx="65" cy="65" r="64" stroke={t.headerLabel} strokeOpacity="0.25" strokeWidth="1" />
        </svg>
        <div className="relative max-w-3xl mx-auto px-6 md:px-10" style={{ paddingTop: 18, paddingBottom: 24 }}>
          <div className="font-body uppercase" style={{ fontSize: 9, letterSpacing: '0.24em', color: t.headerLabel, fontWeight: 600 }}>
            {t.label} · Day {day}
          </div>
          <h1 className="font-display" style={{ fontSize: 30, marginTop: 5, color: t.headerText }}>
            Fuel
          </h1>
          <div className="font-body" style={{ fontSize: 12, marginTop: 4, fontWeight: 300, color: t.headerText, opacity: 0.72 }}>
            {FUEL_TAGLINE[phase.id]}
          </div>
        </div>
      </div>

      {/* ── TINTED BODY ── */}
      <div className="max-w-3xl mx-auto px-6 md:px-10 pt-4 pb-12 font-body">
        {/* nutrition focus tiles */}
        <div className="grid grid-cols-3" style={{ gap: 9 }}>
          {focus.map((f) => (
            <div
              key={f.label}
              className="text-center"
              style={{ background: t.labCard, border: `1px solid ${t.labBorder}`, borderRadius: 13, padding: '13px 9px' }}
            >
              <div className="font-display" style={{ fontSize: 17, color: t.accent }}>
                {f.label}
              </div>
              <div style={{ fontSize: 8.5, color: N.section, marginTop: 4 }}>{f.sub}</div>
            </div>
          ))}
        </div>

        {/* foods to prioritize (real phase.foods) */}
        <div className="uppercase" style={{ fontSize: 9, letterSpacing: '0.2em', color: N.section, margin: '22px 0 12px' }}>
          Foods to prioritize
        </div>
        <div className="flex flex-col" style={{ gap: 14 }}>
          {phase.foods.map((f, i) => (
            <div key={f.name} style={{ paddingBottom: 14, borderBottom: divider(i === phase.foods.length - 1) }}>
              <div className="font-display" style={{ fontSize: 15.5, color: N.title }}>
                {f.name}
              </div>
              <div style={{ fontSize: 10.5, color: N.section, marginTop: 2, fontWeight: 300, lineHeight: 1.5 }}>
                {f.reason}
              </div>
            </div>
          ))}
        </div>

        {/* phase supplements (real) */}
        <div className="uppercase" style={{ fontSize: 9, letterSpacing: '0.2em', color: N.section, margin: '22px 0 12px' }}>
          Phase supplements
        </div>
        <div className="flex flex-col" style={{ gap: 14 }}>
          {phaseSupplements.map((s, i) => (
            <div
              key={s.name}
              className="flex justify-between items-center"
              style={{ paddingBottom: 14, borderBottom: divider(i === phaseSupplements.length - 1) }}
            >
              <div className="pr-3">
                <div className="font-display" style={{ fontSize: 15.5, color: N.title }}>
                  {s.name}
                </div>
                <div style={{ fontSize: 10.5, color: N.section, marginTop: 2, fontWeight: 300 }}>
                  {s.purpose.split('—')[0].trim()}
                </div>
              </div>
              <div className="font-display" style={{ fontSize: 14, color: t.accent, whiteSpace: 'nowrap' }}>
                {s.dosage}
              </div>
            </div>
          ))}
        </div>

        {/* core blend (real, collapsible) */}
        <button
          onClick={() => setCoreOpen((o) => !o)}
          className="w-full flex justify-between items-center"
          style={{ marginTop: 22, background: t.labCard, border: `1px solid ${t.labBorder}`, borderRadius: 13, padding: '13px 15px' }}
        >
          <span style={{ fontSize: 10.5, color: N.title, fontWeight: 600 }}>Core blend · all phases</span>
          <span style={{ fontSize: 10, color: N.section }}>{coreOpen ? '▲' : '▼'}</span>
        </button>
        {coreOpen && (
          <div className="flex flex-col" style={{ gap: 14, marginTop: 14 }}>
            {coreBlend.map((s, i) => (
              <div
                key={s.name}
                className="flex justify-between items-center"
                style={{ paddingBottom: 14, borderBottom: divider(i === coreBlend.length - 1) }}
              >
                <div className="pr-3">
                  <div className="font-display" style={{ fontSize: 14.5, color: N.title }}>
                    {s.name}
                  </div>
                  <div style={{ fontSize: 10, color: N.section, marginTop: 2, fontWeight: 300 }}>
                    {s.purpose.split('—')[0].trim()}
                  </div>
                </div>
                <div className="font-display" style={{ fontSize: 13, color: t.accent, whiteSpace: 'nowrap' }}>
                  {s.dosage}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
