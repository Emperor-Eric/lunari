'use client'
import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getPhaseForDay,
  getAllPhases,
  getPhaseById,
  getPhaseRanges,
  getCyclePrediction,
  FLOW_OPTIONS,
} from '@lunari/phase-data'
import { phases as phaseTheme, phaseKeyFor, palette } from '@lunari/design-tokens'
import type { PhaseId, CycleSettings, SymptomLog, FlowValue } from '@lunari/types'
import { Toast } from '@lunari/ui'
import { apiGet, apiPost } from '@/src/lib/api'
import { NextUpCard } from './_components/NextUpCard'
import { LogPeriodCard } from './_components/LogPeriodCard'

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
  const router = useRouter()
  const allPhases = getAllPhases()

  // Effective cycle settings (recalibrated server-side from logged periods). One fetch;
  // re-fetched after a period is logged so the whole screen recalibrates.
  const [settings, setSettings] = useState<CycleSettings | null>(null)
  const loadSettings = useCallback(() => {
    apiGet<CycleSettings>('/me/cycle')
      .then(setSettings)
      .catch(() => setSettings(null))
  }, [])
  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // The user's REAL position — derived from the effective cycle via the shared helper.
  const prediction = settings ? getCyclePrediction(settings) : null
  const day = prediction?.currentDay ?? 1
  const currentPhase = prediction ? getPhaseById(prediction.currentPhase) : getPhaseForDay(1)

  // Which phase the screen is themed/previewing. null = follow the real current phase.
  const [viewedPhaseId, setViewedPhaseId] = useState<PhaseId | null>(null)
  // A rail tap previews another phase, but a preview is transient: reset to follow the
  // real current phase whenever it changes (e.g. after logging a period recalibrates).
  useEffect(() => {
    setViewedPhaseId(null)
  }, [currentPhase.id])
  const viewedPhase = viewedPhaseId ? getPhaseById(viewedPhaseId) : currentPhase
  const previewing = viewedPhaseId !== null && viewedPhaseId !== currentPhase.id

  const t = phaseTheme[phaseKeyFor(viewedPhase.id)]

  // "How are you feeling?" chips — persisted to today's single log entry.
  const [quickSymptoms, setQuickSymptoms] = useState<string[]>([])
  const [quickFlow, setQuickFlow] = useState<FlowValue | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // Prefill chips from today's saved entry so they survive refresh.
  useEffect(() => {
    apiGet<SymptomLog | null>('/me/logs/today')
      .then((log) => {
        if (log?.symptoms) setQuickSymptoms(log.symptoms)
        if (log?.flow) setQuickFlow(log.flow)
      })
      .catch(() => {})
  }, [])

  // Quick flow pick (menstrual days only) — a merge save, like the feeling chips.
  const saveFlow = (value: FlowValue) => {
    const prev = quickFlow
    setQuickFlow(value)
    apiPost('/me/logs', { flow: value })
      .then(() => {
        setToast({ msg: 'Saved ✓', type: 'success' })
        setTimeout(() => setToast(null), 1200)
      })
      .catch(() => {
        setQuickFlow(prev)
        setToast({ msg: "Couldn't save — try again", type: 'error' })
        setTimeout(() => setToast(null), 2500)
      })
  }

  // Tapping a chip IS the save: optimistic toggle, then persist (merge keeps other fields).
  const toggleSymptom = (s: string) => {
    const prev = quickSymptoms
    const next = prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    setQuickSymptoms(next)
    apiPost('/me/logs', { symptoms: next })
      .then(() => {
        setToast({ msg: 'Saved ✓', type: 'success' })
        setTimeout(() => setToast(null), 1200)
      })
      .catch(() => {
        setQuickSymptoms(prev) // revert on failure
        setToast({ msg: "Couldn't save — try again", type: 'error' })
        setTimeout(() => setToast(null), 2500)
      })
  }

  // ── Derive the reference's theme values from the VIEWED phase's tokens ──
  const light = isLightHex(t.phase)
  const gold = light ? palette.goldOnLight : palette.gold
  const ink = t.floodText
  const sub = t.floodSub
  const cardwash = light ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.10)'
  const cardbd = light ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.20)'
  const chipIdleBd = light ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.30)'
  const chipOnText = light ? '#F8E2A8' : t.accent
  const halo = 'rgba(201,168,76,0.40)'

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  // Progress fill per phase — always reflects the REAL current day.
  const segFill = (p: (typeof allPhases)[number]): number => {
    if (day > p.cycleDays.end) return 100
    if (day < p.cycleDays.start) return 0
    const span = p.cycleDays.end - p.cycleDays.start + 1
    return Math.round(((day - p.cycleDays.start + 1) / span) * 100)
  }

  const supps = viewedPhase.supplements.slice(8, 11) // viewed phase's focus actives

  // Phase day-ranges scaled to the user's real cycle — the SAME source the calendar
  // uses (getPhaseRanges). Falls back to the static model before settings load.
  const dynRanges = settings ? getPhaseRanges(settings.cycleLength, settings.periodLength) : null
  const railLabel = (p: (typeof allPhases)[number]): string => {
    const r = dynRanges?.find((x) => x.phase === p.id)
    const start = r ? r.startDay : p.cycleDays.start
    const end = r ? r.endDay : p.cycleDays.end
    return start === end ? `D${start}` : `D${start}–${end}`
  }

  return (
    // CONTINUOUS FLOOD — re-washes to whichever phase is being viewed.
    <div className="min-h-screen" style={{ background: t.flood, color: ink }}>
      <div className="max-w-4xl mx-auto px-6 md:px-10 pt-8 pb-14 font-body">
        {/* ── Top bar: date / Today / seal ── */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <div
              className="uppercase"
              style={{ fontSize: 9.5, letterSpacing: '0.24em', color: sub }}
            >
              {dateLabel}
            </div>
            <div
              className="font-display"
              style={{ fontSize: 24, lineHeight: 1, marginTop: 3, color: ink }}
            >
              Today
            </div>
          </div>
          {/* TODO: use seal-ink.png on LIGHT phases once we have a transparent ink seal. */}
          <img
            src="/brand/seal-gold.png"
            alt=""
            className="object-contain"
            style={{ width: 34, height: 34 }}
          />
        </div>

        {/* ── HERO (themed to the viewed phase) ── */}
        <div className="relative text-center max-w-lg mx-auto" style={{ paddingTop: 6 }}>
          {/* gold orbit rings */}
          <div
            className="absolute left-1/2 rounded-full"
            style={{
              top: -6,
              width: 230,
              height: 230,
              transform: 'translateX(-50%)',
              border: `1px solid ${gold}`,
              opacity: 0.18,
            }}
          />
          <div
            className="absolute left-1/2 rounded-full"
            style={{
              top: 24,
              width: 160,
              height: 160,
              transform: 'translateX(-50%)',
              border: `1px solid ${gold}`,
              opacity: 0.14,
            }}
          />
          {/* Goddess seal. TODO: seal-ink on light phases. */}
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
            Phase {String(viewedPhase.containerNumber).padStart(2, '0')} / 04 · Day {day}
          </div>
          <h1
            className="relative font-display text-[52px] lg:text-[64px]"
            style={{ lineHeight: 1, marginTop: 12, color: ink }}
          >
            {t.label}
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
            {viewedPhase.tagline}
          </p>

          {/* progress segments — reflect the REAL current day */}
          <div className="relative flex" style={{ gap: 6, marginTop: 20 }}>
            {allPhases.map((p) => (
              <div
                key={p.id}
                className="flex-1 overflow-hidden"
                style={{ height: 4, borderRadius: 4, background: cardbd }}
              >
                <div style={{ height: '100%', width: `${segFill(p)}%`, background: gold }} />
              </div>
            ))}
          </div>
          <div
            className="relative flex justify-between"
            style={{ marginTop: 9, fontSize: 8, letterSpacing: '0.12em' }}
          >
            {allPhases.map((p) => {
              const isNow = p.id === currentPhase.id
              return (
                <span
                  key={p.id}
                  style={{ color: isNow ? gold : sub, fontWeight: isNow ? 700 : 400 }}
                >
                  {SHORT[p.id]}
                </span>
              )
            })}
          </div>
        </div>

        {/* ── Preview banner (only when viewing a non-current phase) ── */}
        {previewing && (
          <div
            className="flex items-center justify-between gap-3 mx-auto max-w-lg"
            style={{
              marginTop: 16,
              padding: '9px 16px',
              borderRadius: 999,
              background: cardwash,
              border: `1px solid ${cardbd}`,
            }}
          >
            <span style={{ fontSize: 11, color: ink }}>
              Previewing <strong>{t.label}</strong> · You&rsquo;re in{' '}
              {phaseTheme[phaseKeyFor(currentPhase.id)].label} today
            </span>
            <button
              onClick={() => setViewedPhaseId(null)}
              style={{ fontSize: 11, color: gold, fontWeight: 600, whiteSpace: 'nowrap' }}
            >
              Back to today
            </button>
          </div>
        )}

        {/* ── Log period — prominent top entry point (button + inline confirm) ── */}
        <div className="text-center" style={{ marginTop: 18 }}>
          <LogPeriodCard surface={{ ink, sub, gold, cardwash, cardbd }} onChange={loadSettings} />
        </div>

        {/* ── Phase rail (tap to preview) ── */}
        <div
          className="uppercase"
          style={{ fontSize: 9, letterSpacing: '0.22em', color: sub, margin: '22px 0 10px' }}
        >
          Your four phases · tap to explore
        </div>
        <div className="grid grid-cols-4" style={{ gap: 8 }}>
          {allPhases.map((p) => {
            const active = p.id === viewedPhase.id
            const isNow = p.id === currentPhase.id
            const pt = phaseTheme[phaseKeyFor(p.id)]
            return (
              <button
                key={p.id}
                onClick={() => setViewedPhaseId(p.id)}
                className="text-center"
                style={{
                  borderRadius: 13,
                  padding: '11px 6px',
                  border: `1px solid ${active ? gold : cardbd}`,
                  background: active ? cardwash : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <div
                  className="mx-auto rounded-full"
                  style={{
                    width: 13,
                    height: 13,
                    background: pt.phase,
                    boxShadow: active ? `0 0 0 3px ${halo}` : 'none',
                  }}
                />
                <div className="font-display" style={{ fontSize: 12, marginTop: 8, color: ink }}>
                  {pt.label}
                </div>
                <div style={{ fontSize: 8, color: sub, marginTop: 1 }}>{railLabel(p)}</div>
                {isNow && (
                  <div
                    style={{
                      fontSize: 7.5,
                      letterSpacing: '0.16em',
                      color: gold,
                      marginTop: 3,
                      fontWeight: 700,
                    }}
                  >
                    NOW
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* ── Feeling chips (viewed phase's symptoms) ── */}
        <div
          className="uppercase"
          style={{ fontSize: 9, letterSpacing: '0.22em', color: sub, margin: '20px 0 10px' }}
        >
          How are you feeling?
        </div>
        <div className="flex flex-wrap" style={{ gap: 7 }}>
          {viewedPhase.symptoms.slice(0, 5).map((s) => {
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

        {/* ── Quick flow (menstrual days only) ── */}
        {currentPhase.id === 'menstrual' && (
          <>
            <div
              className="uppercase"
              style={{ fontSize: 9, letterSpacing: '0.22em', color: sub, margin: '18px 0 10px' }}
            >
              Today&apos;s flow
            </div>
            <div className="flex flex-wrap" style={{ gap: 7 }}>
              {FLOW_OPTIONS.map((o) => {
                const on = quickFlow === o.value
                return (
                  <button
                    key={o.value}
                    onClick={() => saveFlow(o.value)}
                    style={{
                      fontSize: 11,
                      padding: '7px 13px',
                      borderRadius: 20,
                      background: on ? ink : 'transparent',
                      color: on ? chipOnText : ink,
                      border: `1px solid ${on ? 'transparent' : chipIdleBd}`,
                    }}
                  >
                    {o.label}
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* ── Predictions: Next up summary (taps through to the calendar) ── */}
        <div
          className="uppercase"
          style={{ fontSize: 9, letterSpacing: '0.22em', color: sub, margin: '22px 0 10px' }}
        >
          Looking ahead
        </div>
        <NextUpCard
          settings={settings}
          surface={{ ink, sub, gold, cardwash, cardbd }}
          onOpen={() => router.push('/tracker/calendar')}
        />

        {/* ── Supplement focus (viewed phase's actives) ── */}
        <div className="flex justify-between items-baseline" style={{ margin: '22px 0 10px' }}>
          <span className="uppercase" style={{ fontSize: 9, letterSpacing: '0.22em', color: sub }}>
            Today&rsquo;s supplement focus
          </span>
          <span style={{ fontSize: 9, color: gold, letterSpacing: '0.08em' }}>
            {supps.length} actives
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 9 }}>
          {supps.map((s) => {
            const note = s.purpose.split('—')[0].trim()
            return (
              <div
                key={s.name}
                className="flex justify-between items-center"
                style={{
                  padding: '13px 15px',
                  borderRadius: 14,
                  background: cardwash,
                  border: `1px solid ${cardbd}`,
                }}
              >
                <div className="flex items-center" style={{ gap: 12 }}>
                  <span
                    className="flex items-center justify-center rounded-full"
                    style={{
                      width: 21,
                      height: 21,
                      background: gold,
                      color: t.phase,
                      fontSize: 11,
                    }}
                  >
                    ✓
                  </span>
                  <div>
                    <div className="font-display" style={{ fontSize: 14.5, color: ink }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: 9.5, color: sub, marginTop: 2, fontWeight: 300 }}>
                      {note}
                    </div>
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
      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  )
}
