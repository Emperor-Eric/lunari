'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, subDays } from 'date-fns'
import { getDayInCycle, getPhaseForDay, getPhaseById } from '@lunari/phase-data'
import { PhaseHero } from '@lunari/ui'
import type { PhaseId } from '@lunari/types'
import { apiPost } from '@/src/lib/api'
import {
  GoldButton,
  NAVY_GRADIENT,
  INK,
  MUTED,
  GOLD,
  BTN_TEXT,
} from '../auth/_components/AuthShell'

type Method = 'manual' | 'smart'

const Q1_OPTIONS: { label: string; phase: PhaseId }[] = [
  { label: 'Crampy and low energy', phase: 'menstrual' },
  { label: 'Energised and motivated', phase: 'follicular' },
  { label: 'Confident and social', phase: 'ovulatory' },
  { label: 'Tired and craving comfort', phase: 'luteal' },
]
const Q2_OPTIONS = [
  { label: '1–5 days ago', days: 3 },
  { label: '6–10 days ago', days: 8 },
  { label: '11–20 days ago', days: 15 },
  { label: '21+ days ago', days: 24 },
]
const Q3_OPTIONS = [
  { label: '3–4 days', len: 4 },
  { label: '5–6 days', len: 6 },
  { label: '7+ days', len: 7 },
]

// Dark pill — gold fill when active, translucent gold-bordered when not.
function pillStyle(active: boolean): React.CSSProperties {
  return active
    ? { background: GOLD, border: `1px solid ${GOLD}`, color: BTN_TEXT }
    : {
        background: 'rgba(245,235,214,0.06)',
        border: '1px solid rgba(201,168,76,0.35)',
        color: INK,
      }
}

export default function OnboardingPage() {
  const router = useRouter()

  const [method, setMethod] = useState<Method>('manual')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Manual path
  const [daysAgo, setDaysAgo] = useState(14)
  const [cycleLength, setCycleLength] = useState(28)
  const [periodLength, setPeriodLength] = useState(5)

  // Smart path
  const [q, setQ] = useState(0)
  const [smartPhase, setSmartPhase] = useState<PhaseId | null>(null)
  const [smartDaysAgo, setSmartDaysAgo] = useState<number | null>(null)
  const [smartPeriodLength, setSmartPeriodLength] = useState(5)
  const [smartConfirmed, setSmartConfirmed] = useState(false)

  const manualStart = format(subDays(new Date(), daysAgo), 'yyyy-MM-dd')
  const manualDay = getDayInCycle(manualStart, undefined, cycleLength)
  const manualPhase = getPhaseForDay(manualDay, cycleLength, periodLength)

  const submit = async (startDate: string, length: number, period: number) => {
    setSaving(true)
    setError('')
    try {
      // apiPost reads the bearer token from the Supabase session cookie and
      // throws on a non-2xx response.
      await apiPost('/me/cycle', { startDate, cycleLength: length, periodLength: period })
      router.push('/tracker')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const PERIOD_OPTIONS = [3, 4, 5, 6, 7, 8]
  const DAY_OPTIONS = [1, 7, 14, 21, 28]

  const questionCardClass =
    'w-full text-left rounded-xl p-4 text-sm bg-[rgba(245,235,214,0.06)] border border-[rgba(201,168,76,0.35)] hover:border-[#C9A84C] transition-colors'

  return (
    <div
      className="min-h-screen flex flex-col items-center px-6 py-10"
      style={{ background: NAVY_GRADIENT }}
    >
      <div className="w-full max-w-md flex flex-col gap-8">
        {/* Header — small gold wordmark for continuity with login */}
        <div className="text-center flex flex-col items-center gap-4">
          <img
            src="/brand/wordmark-gold.png"
            alt="lunari"
            width={132}
            height={36}
            style={{ width: 132, height: 'auto' }}
          />
          <h1 className="font-display text-2xl" style={{ color: INK }}>
            Let&apos;s set up your cycle
          </h1>
        </div>

        {/* Method toggle */}
        <div
          className="flex rounded-full p-1"
          style={{
            background: 'rgba(245,235,214,0.06)',
            border: '1px solid rgba(201,168,76,0.25)',
          }}
        >
          {(['manual', 'smart'] as const).map((m) => {
            const active = method === m
            return (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className="flex-1 py-2.5 rounded-full font-body text-sm font-medium transition-all"
                style={{
                  background: active ? GOLD : 'transparent',
                  color: active ? BTN_TEXT : MUTED,
                }}
              >
                {m === 'manual' ? 'I know my dates' : 'Help me figure it out'}
              </button>
            )
          })}
        </div>

        {/* Manual path */}
        {method === 'manual' && (
          <div className="flex flex-col gap-6">
            <div>
              <label className="font-body text-sm font-semibold" style={{ color: INK }}>
                When did your last period start?
              </label>
              <div className="flex flex-wrap gap-2 mt-3">
                {DAY_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDaysAgo(d)}
                    className="px-3.5 py-2 rounded-full font-body text-sm font-medium transition-all"
                    style={pillStyle(d === daysAgo)}
                  >
                    {d === 1 ? 'Yesterday' : `${d}d ago`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-body text-sm font-semibold" style={{ color: INK }}>
                How long is your cycle? — {cycleLength} days
              </label>
              <input
                type="range"
                min={21}
                max={35}
                step={1}
                value={cycleLength}
                onChange={(e) => setCycleLength(Number(e.target.value))}
                className="w-full mt-3 cursor-pointer accent-[#C9A84C]"
              />
              <div className="flex justify-between">
                <span className="font-body text-xs" style={{ color: MUTED }}>
                  21
                </span>
                <span className="font-body text-xs" style={{ color: MUTED }}>
                  35
                </span>
              </div>
            </div>

            <div>
              <label className="font-body text-sm font-semibold" style={{ color: INK }}>
                How long does your period last? — {periodLength} days
              </label>
              <div className="flex flex-wrap gap-2 mt-3">
                {PERIOD_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setPeriodLength(d)}
                    className="px-3.5 py-2 rounded-full font-body text-sm font-medium transition-all"
                    style={pillStyle(d === periodLength)}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="font-body text-sm mb-3" style={{ color: MUTED }}>
                Your estimated phase
              </p>
              <PhaseHero phase={manualPhase} cycleDay={manualDay} />
            </div>

            {error && (
              <p className="font-body text-xs" style={{ color: '#E5A3A3' }}>
                {error}
              </p>
            )}

            <GoldButton
              onClick={() => submit(manualStart, cycleLength, periodLength)}
              disabled={saving}
            >
              {saving ? 'Setting up…' : 'This looks right →'}
            </GoldButton>
          </div>
        )}

        {/* Smart path */}
        {method === 'smart' && !smartConfirmed && (
          <div className="flex flex-col gap-4">
            {q === 0 && (
              <>
                <h2 className="font-body text-sm font-semibold" style={{ color: INK }}>
                  How are you feeling right now?
                </h2>
                {Q1_OPTIONS.map((o) => (
                  <button
                    key={o.phase}
                    onClick={() => {
                      setSmartPhase(o.phase)
                      setQ(1)
                    }}
                    className={questionCardClass}
                    style={{ color: INK }}
                  >
                    {o.label}
                  </button>
                ))}
              </>
            )}
            {q === 1 && (
              <>
                <h2 className="font-body text-sm font-semibold" style={{ color: INK }}>
                  How long ago did your last period start?
                </h2>
                {Q2_OPTIONS.map((o) => (
                  <button
                    key={o.days}
                    onClick={() => {
                      setSmartDaysAgo(o.days)
                      setQ(2)
                    }}
                    className={questionCardClass}
                    style={{ color: INK }}
                  >
                    {o.label}
                  </button>
                ))}
              </>
            )}
            {q === 2 && (
              <>
                <h2 className="font-body text-sm font-semibold" style={{ color: INK }}>
                  How long does your period usually last?
                </h2>
                {Q3_OPTIONS.map((o) => (
                  <button
                    key={o.len}
                    onClick={() => {
                      setSmartPeriodLength(o.len)
                      setSmartConfirmed(true)
                    }}
                    className={questionCardClass}
                    style={{ color: INK }}
                  >
                    {o.label}
                  </button>
                ))}
              </>
            )}
          </div>
        )}

        {/* Smart confirmation */}
        {method === 'smart' && smartConfirmed && smartPhase && (
          <div className="flex flex-col gap-5">
            <PhaseHero
              phase={getPhaseById(smartPhase)}
              cycleDay={getDayInCycle(
                format(subDays(new Date(), smartDaysAgo ?? 14), 'yyyy-MM-dd')
              )}
            />
            <h2 className="font-display text-xl text-center" style={{ color: INK }}>
              Looks like you&apos;re in your {getPhaseById(smartPhase).name} phase
            </h2>
            {error && (
              <p className="font-body text-xs" style={{ color: '#E5A3A3' }}>
                {error}
              </p>
            )}
            <GoldButton
              onClick={() =>
                submit(
                  format(subDays(new Date(), smartDaysAgo ?? 14), 'yyyy-MM-dd'),
                  28,
                  smartPeriodLength
                )
              }
              disabled={saving}
            >
              {saving ? 'Setting up…' : 'That sounds right →'}
            </GoldButton>
            <button
              onClick={() => {
                setMethod('manual')
                setSmartConfirmed(false)
                setQ(0)
              }}
              className="font-body text-sm underline text-center"
              style={{ color: GOLD }}
            >
              Let me enter manually
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
