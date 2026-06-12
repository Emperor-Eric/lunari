'use client'
import React from 'react'
import { getPhaseForDay } from '@lunari/phase-data'
import { phases as phaseTheme, phaseKeyFor } from '@lunari/design-tokens'
import type { PhaseId } from '@lunari/types'
import { useCycleContext } from '../cycle-context'

// Phase-level Move metadata — phase-data has no move-intensity/why fields, so these
// are sensible per-phase defaults. Ovulation matches the design reference exactly.
const INTENSITY: Record<PhaseId, { bars: number; value: string }> = {
  menstrual: { bars: 1, value: 'Low · restorative' },
  follicular: { bars: 4, value: 'Building · push harder' },
  ovulatory: { bars: 5, value: 'Peak · highest output' },
  luteal: { bars: 3, value: 'Moderate · winding down' },
}
const MOVE_TAGLINE: Record<PhaseId, string> = {
  menstrual: 'rest and restore — keep it gentle',
  follicular: 'energy is rising — start building',
  ovulatory: 'your strongest days — go for it',
  luteal: 'ease off — steady and supportive',
}
const MOVE_WHY: Record<PhaseId, string> = {
  menstrual: 'low energy and higher injury risk — prioritise rest, mobility, and gentle walks.',
  follicular: 'rising estrogen boosts strength and recovery — a great window to build.',
  ovulatory: 'peak estrogen and testosterone make this your highest-output window.',
  luteal: 'progesterone rises and energy dips — favour moderate, steady sessions over max efforts.',
}

// Fixed Lab neutrals — phase-independent (labBg is light on all four phases).
const N = {
  label: '#8A8275',
  section: '#A99E88',
  title: '#2C2825',
  text: '#6A655D',
  barOff: '#E5DDCD',
}

export default function WorkoutsPage() {
  const { cycleData } = useCycleContext()
  const day = cycleData?.day ?? 1
  const phase = cycleData ? getPhaseForDay(cycleData.day) : getPhaseForDay(1)
  const t = phaseTheme[phaseKeyFor(phase.id)]
  const intensity = INTENSITY[phase.id]

  return (
    <div className="min-h-screen" style={{ backgroundColor: t.labBg }}>
      {/* ── HEADER BAND (phase gradient) ── */}
      <div className="relative overflow-hidden" style={{ background: t.header, color: t.headerText }}>
        {/* gold orbit arc bleeding off the top-right */}
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
            Move
          </h1>
          <div className="font-body" style={{ fontSize: 12, marginTop: 4, fontWeight: 300, color: t.headerText, opacity: 0.72 }}>
            {MOVE_TAGLINE[phase.id]}
          </div>
        </div>
      </div>

      {/* ── TINTED BODY ── */}
      <div className="max-w-3xl mx-auto px-6 md:px-10 pt-4 pb-12 font-body">
        {/* intensity card */}
        <div style={{ background: t.labCard, border: `1px solid ${t.labBorder}`, borderRadius: 15, padding: '15px 17px' }}>
          <div style={{ fontSize: 10.5, color: N.label, fontWeight: 500 }}>Intensity target today</div>
          <div className="flex" style={{ gap: 5, marginTop: 9 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex-1"
                style={{ height: 6, borderRadius: 3, background: i < intensity.bars ? t.accent : N.barOff }}
              />
            ))}
          </div>
          <div style={{ fontSize: 9.5, color: t.accent, marginTop: 8, fontWeight: 600 }}>{intensity.value}</div>
        </div>

        {/* recommended sessions */}
        <div className="uppercase" style={{ fontSize: 9, letterSpacing: '0.2em', color: N.section, margin: '22px 0 12px' }}>
          Recommended sessions
        </div>
        <div className="flex flex-col" style={{ gap: 14 }}>
          {phase.workouts.map((w, i) => {
            const sub = w.description.split(/[—.]/)[0].trim()
            const last = i === phase.workouts.length - 1
            return (
              <div
                key={w.title}
                className="flex justify-between items-center"
                style={{ paddingBottom: 14, borderBottom: last ? 'none' : `1px solid ${t.labBorder}` }}
              >
                <div>
                  <div className="font-display" style={{ fontSize: 16.5, color: N.title }}>
                    {w.title}
                  </div>
                  <div style={{ fontSize: 10.5, color: N.section, marginTop: 2, fontWeight: 300 }}>{sub}</div>
                </div>
                <div style={{ fontSize: 10.5, color: N.text, fontWeight: 500, whiteSpace: 'nowrap' }}>{w.duration}</div>
              </div>
            )
          })}
        </div>

        {/* why note */}
        <div
          style={{ marginTop: 16, fontSize: 10.5, color: N.text, lineHeight: 1.6, fontWeight: 300, background: t.labWhy, borderRadius: 12, padding: '13px 15px' }}
        >
          <span style={{ color: t.accent, fontWeight: 600 }}>Why ·</span> {MOVE_WHY[phase.id]}
        </div>
      </div>
    </div>
  )
}
