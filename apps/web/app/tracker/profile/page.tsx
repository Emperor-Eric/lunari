'use client'
import React, { useEffect, useState } from 'react'
import { useAuth } from '@lunari/utils'
import { getPhaseForDay, getPhaseById, getPhaseRanges } from '@lunari/phase-data'
import { phases as phaseTheme, phaseKeyFor } from '@lunari/design-tokens'
import type { User, UserReferralCode } from '@lunari/types'
import { apiGet, apiPost, apiDelete } from '@/src/lib/api'
import { useCycleContext } from '../cycle-context'

// Referral entry turns on with the shop — a code only matters once there's a product.
const SHOP_ENABLED = process.env.NEXT_PUBLIC_SHOP_ENABLED === 'true'

// Static settings rows — no destination screens exist yet (flagged: not wired).
const SETTINGS = ['Notifications', 'Phase predictions', 'Connected apps', 'Privacy & data']

// Cycle order for the mini phase rail (matches phase-data day ranges).
const PHASE_ORDER = ['menstrual', 'follicular', 'ovulation', 'luteal'] as const

// Fixed Lab neutrals — phase-independent (labBg is light on all four phases).
const N = { section: '#A99E88', text: '#2C2825', chev: '#CDC2AD' }

export default function ProfilePage() {
  const { signOut } = useAuth()
  const { cycleData } = useCycleContext()

  const [user, setUser] = useState<User | null>(null)

  // Referral code state (gated behind SHOP_ENABLED)
  const [savedCode, setSavedCode] = useState<string | null>(null)
  const [codeInput, setCodeInput] = useState('')
  const [applying, setApplying] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  useEffect(() => {
    apiGet<User>('/me')
      .then(setUser)
      .catch(() => {})
    if (!SHOP_ENABLED) return
    apiGet<UserReferralCode>('/me/referral-code')
      .then((data) => setSavedCode(data.code ?? null))
      .catch(() => {})
  }, [])

  const applyCode = async () => {
    const code = codeInput.trim()
    if (!code) return
    setApplying(true)
    setFeedback(null)
    try {
      const data = await apiPost<{ code: string }>('/me/referral-code', { code })
      setSavedCode(data.code)
      setCodeInput('')
      setFeedback({ type: 'success', msg: `Code ${data.code} added to your account` })
    } catch {
      setFeedback({ type: 'error', msg: "That code wasn't found." })
    } finally {
      setApplying(false)
    }
  }

  const removeCode = async () => {
    try {
      await apiDelete('/me/referral-code')
      setSavedCode(null)
      setFeedback(null)
    } catch {
      /* ignore */
    }
  }

  const handleSignOut = async () => {
    await signOut()
    window.location.assign('/auth/login')
  }

  // Theme follows the current phase (authoritative phase id from the API).
  const day = cycleData?.day ?? 1
  const phase = cycleData ? getPhaseById(cycleData.phase) : getPhaseForDay(1)
  const t = phaseTheme[phaseKeyFor(phase.id)]
  const activeKey = phaseKeyFor(phase.id)

  // Real per-user cycle stats.
  const cycleDays = cycleData?.cycleLength ?? 28
  const periodDays = cycleData?.periodLength ?? 5

  // "Where you are" — derived from the real proportional phase windows.
  const ranges = getPhaseRanges(cycleDays, periodDays)
  const currentRange =
    ranges.find((r) => r.phase === phase.id) ?? { startDay: 1, endDay: cycleDays }
  const dayOfPhase = day - currentRange.startDay + 1
  const phaseLength = currentRange.endDay - currentRange.startDay + 1
  const daysUntilNext = currentRange.endDay - day
  const currentIndex = PHASE_ORDER.indexOf(activeKey as (typeof PHASE_ORDER)[number])
  const nextLabel = phaseTheme[PHASE_ORDER[(currentIndex + 1) % PHASE_ORDER.length]].label

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '··'
  const memberSince = user?.createdAt ? new Date(user.createdAt).getFullYear() : null

  return (
    <div className="min-h-screen" style={{ backgroundColor: t.labBg }}>
      {/* ── HEADER BAND (avatar + name, orbit bottom-right) ── */}
      <div className="relative overflow-hidden" style={{ background: t.header, color: t.headerText }}>
        <div
          className="absolute pointer-events-none"
          style={{ right: -30, bottom: -44, width: 130, height: 130, borderRadius: '50%', border: `1px solid ${t.headerLabel}`, opacity: 0.25 }}
          aria-hidden
        />
        <div className="relative max-w-xl mx-auto px-6 md:px-10" style={{ paddingTop: 18, paddingBottom: 22 }}>
          <div className="flex items-center" style={{ gap: 14, marginTop: 6 }}>
            <div
              className="font-display flex items-center justify-center"
              style={{ width: 54, height: 54, borderRadius: '50%', border: `1px solid ${t.headerLabel}`, color: t.headerLabel, fontSize: 22, flex: '0 0 auto' }}
            >
              {initials}
            </div>
            <div>
              <div className="font-display" style={{ fontSize: 21, color: t.headerText }}>
                {user?.name ?? 'Loading…'}
              </div>
              <div className="font-body" style={{ fontSize: 10.5, fontWeight: 300, color: t.headerLabel, marginTop: 1 }}>
                {memberSince ? `member since ${memberSince}` : user?.email ?? ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TINTED BODY ── */}
      <div className="max-w-xl mx-auto px-6 md:px-10 pt-4 pb-10 font-body">
        {/* Cycle stats */}
        <div className="uppercase" style={{ fontSize: 9, letterSpacing: '0.2em', color: N.section, margin: '0 0 11px' }}>
          Cycle
        </div>
        <div className="flex" style={{ gap: 9 }}>
          <StatCard value={cycleDays} caption="cycle days" t={t} />
          <StatCard value={periodDays} caption="period days" t={t} />
          <StatCard value={day} caption="today" today t={t} />
        </div>

        {/* Where you are — non-product cycle summary (real data only) */}
        <div className="uppercase" style={{ fontSize: 9, letterSpacing: '0.2em', color: N.section, margin: '20px 0 11px' }}>
          Where you are
        </div>
        <div style={{ background: t.labCard, border: `1px solid ${t.labBorder}`, borderRadius: 15, padding: 16 }}>
          <div className="flex items-baseline justify-between">
            <div className="font-display" style={{ fontSize: 19, color: t.accent }}>
              {t.label}
            </div>
            <div className="font-display" style={{ fontSize: 15, color: N.text }}>
              Day {dayOfPhase}{' '}
              <span className="font-body" style={{ fontSize: 11, color: N.section }}>
                of {phaseLength}
              </span>
            </div>
          </div>
          <div className="font-body" style={{ fontSize: 11, color: N.section, marginTop: 2 }}>
            {t.vibe}
          </div>

          {/* mini phase rail */}
          <div className="flex" style={{ gap: 5, marginTop: 14 }}>
            {PHASE_ORDER.map((key) => (
              <div
                key={key}
                className="flex-1"
                style={{ height: 6, borderRadius: 3, background: phaseTheme[key].phase, opacity: key === activeKey ? 1 : 0.28 }}
              />
            ))}
          </div>

          <div className="font-body" style={{ fontSize: 10.5, color: N.section, marginTop: 10 }}>
            Phase {currentIndex + 1} of {PHASE_ORDER.length}
            {daysUntilNext > 0
              ? ` · ${daysUntilNext} ${daysUntilNext === 1 ? 'day' : 'days'} until ${nextLabel}`
              : ' · last day of this phase'}
          </div>
        </div>

        {/* Settings (static — no destination screens yet) */}
        <div className="uppercase" style={{ fontSize: 9, letterSpacing: '0.2em', color: N.section, margin: '20px 0 11px' }}>
          Settings
        </div>
        <div className="flex flex-col">
          {SETTINGS.map((label, i) => (
            <div
              key={label}
              className="flex justify-between items-center"
              style={{ padding: '14px 0', borderBottom: i === SETTINGS.length - 1 ? 'none' : `1px solid ${t.labBorder}`, fontFamily: 'var(--font-display, serif)', fontSize: 15.5, color: N.text }}
            >
              <span className="font-display">{label}</span>
              <span className="font-body" style={{ color: N.chev }}>›</span>
            </div>
          ))}
        </div>

        {/* Referral code — gated behind SHOP_ENABLED (off pre-launch) */}
        {SHOP_ENABLED && (
          <>
            <div className="uppercase" style={{ fontSize: 9, letterSpacing: '0.2em', color: N.section, margin: '20px 0 11px' }}>
              Referral code
            </div>
            <div style={{ background: t.labCard, border: `1px solid ${t.labBorder}`, borderRadius: 13, padding: 16 }}>
              {savedCode ? (
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 13, color: N.text }}>
                    Your code: <strong>{savedCode}</strong>
                  </span>
                  <button onClick={removeCode} style={{ fontSize: 13, color: t.accent, fontWeight: 600 }}>
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex" style={{ gap: 8 }}>
                  <input
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    placeholder="e.g. GYMGIRL20"
                    className="flex-1 uppercase"
                    style={{ background: t.labBg, border: `1px solid ${t.labBorder}`, borderRadius: 11, padding: '10px 14px', fontSize: 13, color: N.text, outline: 'none' }}
                  />
                  <button
                    onClick={applyCode}
                    disabled={applying}
                    style={{ background: t.accent, color: t.headerText, borderRadius: 11, padding: '0 20px', fontSize: 13, fontWeight: 600, opacity: applying ? 0.6 : 1 }}
                  >
                    {applying ? '…' : 'Apply'}
                  </button>
                </div>
              )}
              {feedback && (
                <div
                  style={{ marginTop: 12, borderRadius: 11, padding: 12, fontSize: 13, fontWeight: 500, background: feedback.type === 'success' ? t.labWhy : '#F5E8EA', color: feedback.type === 'success' ? t.accent : '#7A1E2E' }}
                >
                  {feedback.msg}
                </div>
              )}
            </div>
          </>
        )}

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          style={{ marginTop: 18, fontSize: 11.5, color: t.accent, fontWeight: 600 }}
        >
          Sign out
        </button>
      </div>
    </div>
  )
}

function StatCard({
  value,
  caption,
  today,
  t,
}: {
  value: number
  caption: string
  today?: boolean
  t: (typeof phaseTheme)[keyof typeof phaseTheme]
}) {
  return (
    <div
      className="flex-1 text-center"
      style={{
        background: today ? t.accent : t.labCard,
        border: `1px solid ${today ? 'transparent' : t.labBorder}`,
        borderRadius: 13,
        padding: 14,
      }}
    >
      <div className="font-display" style={{ fontSize: 23, color: today ? t.headerText : '#2C2825' }}>
        {value}
      </div>
      <div style={{ fontSize: 8.5, marginTop: 2, color: today ? t.headerText : '#A99E88', opacity: today ? 0.8 : 1 }}>
        {caption}
      </div>
    </div>
  )
}
