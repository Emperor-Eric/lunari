'use client'
import React, { useState } from 'react'
import { getPhaseForDay, getAllPhases } from '@lunari/phase-data'
import { phases as phaseTheme, phaseKeyFor, palette } from '@lunari/design-tokens'
import type { PhaseId } from '@lunari/types'
import { useCycleContext } from './cycle-context'

// Short progress labels per phase.
const SHORT: Record<PhaseId, string> = {
  menstrual: 'MENS',
  follicular: 'FOLL',
  ovulatory: 'OVUL',
  luteal: 'LUT',
}

// Perceived luminance — light phases (Ovulation) take dark text + dark-gold
// linework; dark phases (Menstrual/Luteal/Follicular) take light text + bright gold.
function isLightHex(hex: string): boolean {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return 0.299 * r + 0.587 * g + 0.114 * b > 150
}

export default function TrackerToday() {
  const { cycleData } = useCycleContext()
  const allPhases = getAllPhases()
  const phase = cycleData ? getPhaseForDay(cycleData.day) : getPhaseForDay(1)
  const t = phaseTheme[phaseKeyFor(phase.id)]
  const day = cycleData?.day ?? 1
  const containerNumber = cycleData?.containerNumber ?? 1

  const [quickSymptoms, setQuickSymptoms] = useState<string[]>([])
  const toggleSymptom = (s: string) =>
    setQuickSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))

  // ── Derive the reference's CSS custom properties from our tokens ──
  const light = isLightHex(t.phase)
  const gold = light ? palette.goldOnLight : palette.gold // --gold
  const ink = t.floodText // --ink (primary text on flood)
  const sub = t.floodSub // --sub (muted)
  const cardwash = light ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.10)' // --cardwash
  const cardbd = light ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.20)' // --cardbd / --ringtrack
  const chipIdleBd = light ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.30)' // --chip-idle-bd
  const chipOnText = light ? '#F8E2A8' : t.accent // --chip-on-text
  const halo = 'rgba(201,168,76,0.40)' // --halo (brand-gold glow)

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  // Per-phase progress fill: 100% if the day is past it, partial if in it, else 0.
  const segFill = (p: (typeof allPhases)[number]): number => {
    if (day > p.cycleDays.end) return 100
    if (day < p.cycleDays.start) return 0
    const span = p.cycleDays.end - p.cycleDays.start + 1
    return Math.round(((day - p.cycleDays.start + 1) / span) * 100)
  }

  const supps = phase.supplements.slice(8, 11) // phase-specific focus actives

  return (
    // CONTINUOUS FLOOD — one phase wash fills the whole main area, full-bleed.
    <div className="min-h-screen" style={{ background: t.flood, color: ink }}>
      <div className="max-w-md mx-auto px-6 pt-8 pb-14 font-body">
        {/* ── Top bar: date / Today / seal ── */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="uppercase" style={{ fontSize: 9.5, letterSpacing: '0.24em', color: sub }}>
              {dateLabel}
            </div>
            <div className="font-display" style={{ fontSize: 24, lineHeight: 1, marginTop: 3, color: ink }}>
              Today
            </div>
          </div>
          {/* TODO: use seal-ink.png on LIGHT phases once we have a transparent ink seal. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/seal-gold.png" alt="" className="object-contain" style={{ width: 34, height: 34 }} />
        </div>

        {/* ── HERO ── */}
        <div className="relative text-center" style={{ paddingTop: 6 }}>
          {/* gold orbit rings */}
          <div
            className="absolute left-1/2 rounded-full"
            style={{ top: -6, width: 230, height: 230, transform: 'translateX(-50%)', border: `1px solid ${gold}`, opacity: 0.18 }}
          />
          <div
            className="absolute left-1/2 rounded-full"
            style={{ top: 24, width: 160, height: 160, transform: 'translateX(-50%)', border: `1px solid ${gold}`, opacity: 0.14 }}
          />
          {/* Goddess seal. TODO: seal-ink on light phases. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/seal-gold.png"
            alt="lunari seal"
            className="relative block object-contain"
            style={{ width: 84, height: 84, margin: '6px auto 14px' }}
          />

          <div
            className="relative uppercase"
            style={{ fontSize: 9.5, letterSpacing: '0.32em', color: gold, fontWeight: 600 }}
          >
            Phase {String(containerNumber).padStart(2, '0')} / 04 · Day {day}
          </div>
          <h1 className="relative font-display" style={{ fontSize: 52, lineHeight: 1, marginTop: 12, color: ink }}>
            {phase.name}
          </h1>
          <div
            className="relative uppercase"
            style={{ fontSize: 13, letterSpacing: '0.28em', color: sub, marginTop: 12 }}
          >
            {t.vibe}
          </div>
          <p
            className="relative"
            style={{ fontSize: 12, color: ink, opacity: 0.82, marginTop: 12, fontWeight: 300 }}
          >
            {phase.tagline}
          </p>

          {/* progress segments */}
          <div className="relative flex" style={{ gap: 6, marginTop: 20 }}>
            {allPhases.map((p) => (
              <div key={p.id} className="flex-1 overflow-hidden" style={{ height: 4, borderRadius: 4, background: cardbd }}>
                <div style={{ height: '100%', width: `${segFill(p)}%`, background: gold }} />
              </div>
            ))}
          </div>
          <div className="relative flex justify-between" style={{ marginTop: 9, fontSize: 8, letterSpacing: '0.12em' }}>
            {allPhases.map((p) => {
              const active = p.id === phase.id
              return (
                <span key={p.id} style={{ color: active ? gold : sub, fontWeight: active ? 700 : 400 }}>
                  {SHORT[p.id]}
                </span>
              )
            })}
          </div>
        </div>

        {/* ── Phase rail ── */}
        <div className="uppercase" style={{ fontSize: 9, letterSpacing: '0.22em', color: sub, margin: '22px 0 10px' }}>
          Your four phases · tap to explore
        </div>
        <div className="grid grid-cols-4" style={{ gap: 8 }}>
          {allPhases.map((p) => {
            const active = p.id === phase.id
            const dot = phaseTheme[phaseKeyFor(p.id)].phase
            return (
              <div
                key={p.id}
                className="text-center"
                style={{
                  borderRadius: 13,
                  padding: '11px 6px',
                  border: `1px solid ${active ? gold : cardbd}`,
                  background: active ? cardwash : 'transparent',
                }}
              >
                <div
                  className="mx-auto rounded-full"
                  style={{ width: 13, height: 13, background: dot, boxShadow: active ? `0 0 0 3px ${halo}` : 'none' }}
                />
                <div className="font-display" style={{ fontSize: 12, marginTop: 8, color: ink }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 8, color: sub, marginTop: 1 }}>
                  D{p.cycleDays.start}–{p.cycleDays.end}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Feeling chips ── */}
        <div className="uppercase" style={{ fontSize: 9, letterSpacing: '0.22em', color: sub, margin: '20px 0 10px' }}>
          How are you feeling?
        </div>
        <div className="flex flex-wrap" style={{ gap: 7 }}>
          {phase.symptoms.slice(0, 5).map((s) => {
            const on = quickSymptoms.includes(s)
            return (
              <button
                key={s}
                onClick={() => toggleSymptom(s)}
                style={{
                  fontSize: 11,
                  padding: '7px 13px',
                  borderRadius: 20,
                  background: on ? ink : 'transparent',
                  color: on ? chipOnText : ink,
                  border: `1px solid ${on ? 'transparent' : chipIdleBd}`,
                }}
              >
                {s}
              </button>
            )
          })}
        </div>

        {/* ── Supplement focus ── */}
        <div className="flex justify-between items-baseline" style={{ margin: '22px 0 10px' }}>
          <span className="uppercase" style={{ fontSize: 9, letterSpacing: '0.22em', color: sub }}>
            Today&rsquo;s supplement focus
          </span>
          <span style={{ fontSize: 9, color: gold, letterSpacing: '0.08em' }}>{supps.length} actives</span>
        </div>
        <div className="flex flex-col" style={{ gap: 9 }}>
          {supps.map((s) => {
            const note = s.purpose.split('—')[0].trim()
            return (
              <div
                key={s.name}
                className="flex justify-between items-center"
                style={{ padding: '13px 15px', borderRadius: 14, background: cardwash, border: `1px solid ${cardbd}` }}
              >
                <div className="flex items-center" style={{ gap: 12 }}>
                  <span
                    className="flex items-center justify-center rounded-full"
                    style={{ width: 21, height: 21, background: gold, color: t.phase, fontSize: 11 }}
                  >
                    ✓
                  </span>
                  <div>
                    <div className="font-display" style={{ fontSize: 14.5, color: ink }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: 9.5, color: sub, marginTop: 2, fontWeight: 300 }}>{note}</div>
                  </div>
                </div>
                <div className="font-display" style={{ fontSize: 15, color: gold }}>
                  {s.dosage}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
