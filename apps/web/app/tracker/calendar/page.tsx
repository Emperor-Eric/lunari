'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { getPhaseById, getPhaseForDay } from '@lunari/phase-data'
import { phases as phaseTheme, phaseKeyFor } from '@lunari/design-tokens'
import type { CycleSettings } from '@lunari/types'
import { apiGet } from '@/src/lib/api'
import { useCycleContext } from '../cycle-context'
import { CycleCalendar } from '../_components/CycleCalendar'

export default function CalendarPage() {
  const { cycleData } = useCycleContext()
  const day = cycleData?.day ?? 1
  const phase = cycleData ? getPhaseById(cycleData.phase) : getPhaseForDay(1)
  const t = phaseTheme[phaseKeyFor(phase.id)]

  const [settings, setSettings] = useState<CycleSettings | null>(null)
  useEffect(() => {
    apiGet<CycleSettings>('/me/cycle')
      .then(setSettings)
      .catch(() => setSettings(null))
  }, [])

  // Light Lab surface so the phase colours read clearly (NOT the dark flood).
  const surface = { ink: '#2C2825', sub: '#A99E88', gold: t.accent, cardwash: t.labCard, cardbd: t.labBorder }

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
        <div className="relative max-w-2xl mx-auto px-6 md:px-10" style={{ paddingTop: 18, paddingBottom: 24 }}>
          <Link href="/tracker" className="font-body" style={{ fontSize: 11, color: t.headerLabel }}>
            ← Today
          </Link>
          <div className="font-body uppercase" style={{ fontSize: 9, letterSpacing: '0.24em', color: t.headerLabel, fontWeight: 600, marginTop: 12 }}>
            {t.label} · Day {day}
          </div>
          <h1 className="font-display" style={{ fontSize: 30, marginTop: 5, color: t.headerText }}>
            Calendar
          </h1>
          <div className="font-body" style={{ fontSize: 12, marginTop: 4, fontWeight: 300, color: t.headerText, opacity: 0.72 }}>
            your estimated phases, month by month
          </div>
        </div>
      </div>

      {/* ── TINTED BODY ── */}
      <div className="max-w-2xl mx-auto px-6 md:px-10 pt-5 pb-12">
        <CycleCalendar settings={settings} surface={surface} />
      </div>
    </div>
  )
}
