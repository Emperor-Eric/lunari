'use client'
import React, { useEffect, useState } from 'react'
import { useAuth } from '@lunari/utils'
import type { User, UserReferralCode } from '@lunari/types'
import { apiGet, apiPost, apiDelete } from '@/src/lib/api'

export default function ProfilePage() {
  const { signOut } = useAuth()

  const [user, setUser] = useState<User | null>(null)

  // Referral code state
  const [savedCode, setSavedCode] = useState<string | null>(null)
  const [codeInput, setCodeInput] = useState('')
  const [applying, setApplying] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  useEffect(() => {
    apiGet<User>('/me')
      .then(setUser)
      .catch(() => {})
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

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??'

  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
      <h1 className="font-display text-3xl text-brand-ink">Profile</h1>

      {/* Account */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-brand-gold flex items-center justify-center">
          <span className="font-display text-2xl text-white">{initials}</span>
        </div>
        <div>
          <p className="text-base font-semibold text-brand-ink">{user?.name ?? 'Loading…'}</p>
          <p className="text-sm text-brand-ink-soft">{user?.email ?? ''}</p>
        </div>
      </div>

      {/* Referral code */}
      <div className="bg-white rounded-2xl border border-brand-stone p-5 flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold text-brand-ink">Referral code</h2>
          <p className="text-sm text-brand-ink-soft">
            Got a code from a creator? Add it to your account.
          </p>
        </div>

        {savedCode ? (
          <div className="flex items-center justify-between">
            <span className="text-sm text-brand-ink">
              Your code: <strong>{savedCode}</strong>
            </span>
            <button
              onClick={removeCode}
              className="text-sm text-phase-menstrual font-semibold"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="e.g. GYMGIRL20"
              className="flex-1 rounded-xl border-2 border-brand-stone bg-brand-cream px-4 py-2.5 text-sm text-brand-ink placeholder-brand-ink-soft focus:outline-none focus:border-brand-gold uppercase"
            />
            <button
              onClick={applyCode}
              disabled={applying}
              className="px-5 py-2.5 rounded-xl bg-brand-ink text-white text-sm font-semibold disabled:opacity-60"
            >
              {applying ? '…' : 'Apply'}
            </button>
          </div>
        )}

        {feedback && (
          <div
            className={`rounded-xl p-3 text-sm font-medium ${
              feedback.type === 'success'
                ? 'bg-phase-follicular-light text-phase-follicular'
                : 'bg-phase-menstrual-light text-phase-menstrual'
            }`}
          >
            {feedback.msg}
          </div>
        )}
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="self-start px-6 py-3 rounded-xl border-2 border-phase-menstrual text-phase-menstrual text-sm font-semibold"
      >
        Sign out
      </button>
    </div>
  )
}
