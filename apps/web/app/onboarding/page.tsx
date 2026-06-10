'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, subDays } from 'date-fns'
import { getDayInCycle, getPhaseForDay, getPhaseById } from '@lunari/phase-data'
import { PhaseHero } from '@lunari/ui'
import { useAuth } from '@lunari/utils'
import type { PhaseId } from '@lunari/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/v1'

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

export default function OnboardingPage() {
  const router = useRouter()
  const { session } = useAuth()

  const [method, setMethod] = useState<Method>('manual')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Manual path
  const [daysAgo, setDaysAgo] = useState(14)
  const [cycleLength, setCycleLength] = useState(28)

  // Smart path
  const [q, setQ] = useState(0)
  const [smartPhase, setSmartPhase] = useState<PhaseId | null>(null)
  const [smartDaysAgo, setSmartDaysAgo] = useState<number | null>(null)
  const [smartConfirmed, setSmartConfirmed] = useState(false)

  const manualStart = format(subDays(new Date(), daysAgo), 'yyyy-MM-dd')
  const manualDay = getDayInCycle(manualStart, undefined, cycleLength)
  const manualPhase = getPhaseForDay(manualDay)

  const submit = async (startDate: string, length: number) => {
    if (!session) {
      setError('You must be signed in.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/me/cycle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ startDate, cycleLength: length }),
      })
      if (!res.ok) throw new Error('Failed to save cycle')
      router.push('/tracker')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const DAY_OPTIONS = [1, 7, 14, 21, 28]

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-md flex flex-col gap-8">
        {/* Header */}
        <div className="text-center">
          <span className="font-display text-3xl text-brand-ink">lunari</span>
          <h1 className="font-display text-2xl text-brand-ink mt-6">Let&apos;s set up your cycle</h1>
        </div>

        {/* Method toggle */}
        <div className="flex bg-brand-stone rounded-full p-1">
          {(['manual', 'smart'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className="flex-1 py-2.5 rounded-full text-sm font-medium transition-all"
              style={{
                backgroundColor: method === m ? '#FFFFFF' : 'transparent',
                color: method === m ? '#2C2825' : '#6B6460',
              }}
            >
              {m === 'manual' ? 'I know my dates' : 'Help me figure it out'}
            </button>
          ))}
        </div>

        {/* Manual path */}
        {method === 'manual' && (
          <div className="flex flex-col gap-6">
            <div>
              <label className="text-sm font-semibold text-brand-ink">
                When did your last period start?
              </label>
              <div className="flex flex-wrap gap-2 mt-3">
                {DAY_OPTIONS.map((d) => {
                  const active = d === daysAgo
                  return (
                    <button
                      key={d}
                      onClick={() => setDaysAgo(d)}
                      className="px-3.5 py-2 rounded-full border-2 text-sm font-medium transition-all"
                      style={{
                        backgroundColor: active ? '#2C2825' : '#FFFFFF',
                        borderColor: active ? '#2C2825' : '#E8E2D6',
                        color: active ? '#FFFFFF' : '#2C2825',
                      }}
                    >
                      {d === 1 ? 'Yesterday' : `${d}d ago`}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-brand-ink">
                How long is your cycle? — {cycleLength} days
              </label>
              <input
                type="range"
                min={21}
                max={35}
                step={1}
                value={cycleLength}
                onChange={(e) => setCycleLength(Number(e.target.value))}
                className="w-full mt-3 accent-brand-gold cursor-pointer"
              />
              <div className="flex justify-between">
                <span className="text-xs text-brand-ink-soft">21</span>
                <span className="text-xs text-brand-ink-soft">35</span>
              </div>
            </div>

            <div>
              <p className="text-sm text-brand-ink-soft mb-3">Your estimated phase</p>
              <PhaseHero phase={manualPhase} cycleDay={manualDay} />
            </div>

            {error && <p className="text-xs text-phase-menstrual">{error}</p>}

            <button
              onClick={() => submit(manualStart, cycleLength)}
              disabled={saving}
              className="w-full py-4 rounded-xl bg-brand-ink text-white text-sm font-semibold disabled:opacity-60"
            >
              {saving ? 'Setting up…' : 'This looks right →'}
            </button>
          </div>
        )}

        {/* Smart path */}
        {method === 'smart' && !smartConfirmed && (
          <div className="flex flex-col gap-4">
            {q === 0 && (
              <>
                <h2 className="text-sm font-semibold text-brand-ink">How are you feeling right now?</h2>
                {Q1_OPTIONS.map((o) => (
                  <button
                    key={o.phase}
                    onClick={() => { setSmartPhase(o.phase); setQ(1) }}
                    className="w-full text-left bg-white rounded-xl border-2 border-brand-stone p-4 text-sm text-brand-ink hover:border-brand-gold transition-colors"
                  >
                    {o.label}
                  </button>
                ))}
              </>
            )}
            {q === 1 && (
              <>
                <h2 className="text-sm font-semibold text-brand-ink">How long ago did your last period start?</h2>
                {Q2_OPTIONS.map((o) => (
                  <button
                    key={o.days}
                    onClick={() => { setSmartDaysAgo(o.days); setQ(2) }}
                    className="w-full text-left bg-white rounded-xl border-2 border-brand-stone p-4 text-sm text-brand-ink hover:border-brand-gold transition-colors"
                  >
                    {o.label}
                  </button>
                ))}
              </>
            )}
            {q === 2 && (
              <>
                <h2 className="text-sm font-semibold text-brand-ink">How long does your period usually last?</h2>
                {Q3_OPTIONS.map((o) => (
                  <button
                    key={o.len}
                    onClick={() => setSmartConfirmed(true)}
                    className="w-full text-left bg-white rounded-xl border-2 border-brand-stone p-4 text-sm text-brand-ink hover:border-brand-gold transition-colors"
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
              cycleDay={getDayInCycle(format(subDays(new Date(), smartDaysAgo ?? 14), 'yyyy-MM-dd'))}
            />
            <h2 className="font-display text-xl text-brand-ink text-center">
              Looks like you&apos;re in your {getPhaseById(smartPhase).name} phase
            </h2>
            {error && <p className="text-xs text-phase-menstrual">{error}</p>}
            <button
              onClick={() => submit(format(subDays(new Date(), smartDaysAgo ?? 14), 'yyyy-MM-dd'), 28)}
              disabled={saving}
              className="w-full py-4 rounded-xl bg-brand-ink text-white text-sm font-semibold disabled:opacity-60"
            >
              {saving ? 'Setting up…' : 'That sounds right →'}
            </button>
            <button
              onClick={() => { setMethod('manual'); setSmartConfirmed(false); setQ(0) }}
              className="text-sm text-brand-ink-soft underline text-center"
            >
              Let me enter manually
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
