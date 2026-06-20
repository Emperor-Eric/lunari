'use client'
import React from 'react'
import Link from 'next/link'
import { getPhaseById, getPhaseForDay } from '@lunari/phase-data'
import { phases as phaseTheme, phaseKeyFor } from '@lunari/design-tokens'
import { useCycleContext } from '../cycle-context'

// Planned integrations — placeholder only, no connection logic yet.
const INTEGRATIONS = [
  { name: 'Apple Health', detail: 'Sync cycle, sleep and activity from your iPhone' },
  { name: 'Google Fit / Health Connect', detail: 'Sync activity and health data on Android' },
  { name: 'Oura', detail: 'Bring in sleep, readiness and temperature trends' },
]

const N = { section: '#A99E88', text: '#2C2825', sub: '#8A8275' }

export default function ConnectedAppsPage() {
  const { cycleData } = useCycleContext()
  const phase = cycleData ? getPhaseById(cycleData.phase) : getPhaseForDay(1)
  const t = phaseTheme[phaseKeyFor(phase.id)]

  return (
    <div className="min-h-screen" style={{ backgroundColor: t.labBg }}>
      {/* ── HEADER BAND (phase gradient) ── */}
      <div
        className="relative overflow-hidden"
        style={{ background: t.header, color: t.headerText }}
      >
        <svg
          className="absolute pointer-events-none"
          style={{ right: -34, top: -22, width: 130, height: 130 }}
          viewBox="0 0 130 130"
          fill="none"
          aria-hidden
        >
          <circle
            cx="65"
            cy="65"
            r="64"
            stroke={t.headerLabel}
            strokeOpacity="0.25"
            strokeWidth="1"
          />
        </svg>
        <div
          className="relative max-w-2xl mx-auto px-6 md:px-10"
          style={{ paddingTop: 18, paddingBottom: 24 }}
        >
          <Link
            href="/tracker/profile"
            className="font-body"
            style={{ fontSize: 11, color: t.headerLabel }}
          >
            ← Me
          </Link>
          <h1 className="font-display" style={{ fontSize: 30, marginTop: 12, color: t.headerText }}>
            Connected apps
          </h1>
          <div
            className="font-body"
            style={{
              fontSize: 12,
              marginTop: 4,
              fontWeight: 300,
              color: t.headerText,
              opacity: 0.72,
            }}
          >
            sync lunari with your other health apps
          </div>
        </div>
      </div>

      {/* ── TINTED BODY ── */}
      <div className="max-w-2xl mx-auto px-6 md:px-10 pt-6 pb-12 font-body">
        <p style={{ fontSize: 13, color: N.text, fontWeight: 300, lineHeight: 1.6 }}>
          Connecting other apps will let lunari read your sleep, activity and health signals to
          sharpen your phase predictions. These integrations aren&apos;t available yet —
          they&apos;re on the way.
        </p>

        <div
          className="uppercase"
          style={{ fontSize: 9, letterSpacing: '0.2em', color: N.section, margin: '24px 0 11px' }}
        >
          Planned integrations
        </div>

        <div className="flex flex-col" style={{ gap: 10 }}>
          {INTEGRATIONS.map((app) => (
            <div
              key={app.name}
              className="flex items-center justify-between"
              style={{
                background: t.labCard,
                border: `1px solid ${t.labBorder}`,
                borderRadius: 13,
                padding: '14px 16px',
                opacity: 0.75,
              }}
            >
              <div style={{ paddingRight: 12 }}>
                <div className="font-display" style={{ fontSize: 15.5, color: N.text }}>
                  {app.name}
                </div>
                <div style={{ fontSize: 11, color: N.sub, fontWeight: 300, marginTop: 2 }}>
                  {app.detail}
                </div>
              </div>
              <span
                className="uppercase"
                style={{
                  fontSize: 8.5,
                  letterSpacing: '0.12em',
                  color: N.section,
                  border: `1px solid ${t.labBorder}`,
                  borderRadius: 999,
                  padding: '4px 9px',
                  whiteSpace: 'nowrap',
                }}
              >
                Coming soon
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
