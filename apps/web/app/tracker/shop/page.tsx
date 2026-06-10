'use client'
import React, { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'
import { ContainerRow } from '@lunari/ui'
import { getPhaseForDay } from '@lunari/phase-data'
import { buildShopifyUrl } from '@lunari/utils'
import type { UserReferralCode } from '@lunari/types'
import { apiGet, apiPost } from '@/src/lib/api'
import { useCycleContext } from '../layout'

const SHOP_ENABLED = process.env.NEXT_PUBLIC_SHOP_ENABLED === 'true'
const KIT_URL = process.env.NEXT_PUBLIC_SHOPIFY_PRODUCT_KIT_URL || 'https://herlunari.myshopify.com/products/30-day-kit'
const SUB_URL = process.env.NEXT_PUBLIC_SHOPIFY_PRODUCT_SUB_URL || 'https://herlunari.myshopify.com/products/monthly-subscription'

export default function ShopPage() {
  const { cycleData } = useCycleContext()
  const phase = cycleData ? getPhaseForDay(cycleData.day) : getPhaseForDay(1)

  const [savedCode, setSavedCode] = useState<string | null>(null)
  const [codeInput, setCodeInput] = useState('')
  const [applying, setApplying] = useState(false)
  const [editing, setEditing] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  useEffect(() => {
    apiGet<UserReferralCode>('/me/referral-code')
      .then((data) => setSavedCode(data.code ?? null))
      .catch(() => {})
  }, [])

  // Shop is hidden pre-launch — a manual visit to /tracker/shop bounces home.
  // Placed after hooks so hook order stays stable (rules-of-hooks safe).
  if (!SHOP_ENABLED) redirect('/tracker')

  const openShopify = (baseUrl: string) => {
    window.open(buildShopifyUrl(baseUrl, savedCode), '_blank', 'noopener,noreferrer')
  }

  const applyCode = async () => {
    const code = codeInput.trim()
    if (!code) return
    setApplying(true)
    setFeedback(null)
    try {
      const data = await apiPost<{ code: string }>('/me/referral-code', { code })
      setSavedCode(data.code)
      setEditing(false)
      setCodeInput('')
      setFeedback({
        type: 'success',
        msg: `Code ${data.code} applied — 10% discount added at checkout`,
      })
    } catch {
      setFeedback({ type: 'error', msg: "That code wasn't found." })
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 flex flex-col gap-6">
      <h1 className="font-display text-3xl text-brand-gold">lunari shop</h1>

      {/* Two-column: container card (left) + referral (right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current container card */}
        <div
          className="rounded-2xl border-l-4 p-5 flex flex-col gap-4"
          style={{ backgroundColor: phase.lightColor, borderLeftColor: phase.color }}
        >
          <div>
            <p className="text-sm text-brand-ink-soft mb-3">
              You&apos;re on Container {cycleData?.containerNumber ?? 1} of 4 — {phase.name} phase
            </p>
            <ContainerRow phase={phase} currentDay={cycleData?.day ?? 1} />
          </div>
          <button
            onClick={() => openShopify(KIT_URL)}
            className="self-start px-6 py-3 rounded-xl text-white text-sm font-semibold"
            style={{ backgroundColor: phase.color }}
          >
            Shop the Lunari kit →
          </button>
        </div>

        {/* Referral code */}
        <div className="bg-white rounded-2xl border border-brand-stone p-5 flex flex-col gap-3">
          <h2 className="text-base font-semibold text-brand-ink">Have a referral code?</h2>

          {savedCode && !editing ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-brand-ink">Your referral code: <strong>{savedCode}</strong></span>
              <button
                onClick={() => { setEditing(true); setFeedback(null) }}
                className="text-sm text-brand-gold font-semibold"
              >
                Change
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
      </div>

      {/* Product cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-brand-stone p-5 flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <span className="text-lg font-bold text-brand-ink">30-Day Kit</span>
            <span className="font-mono text-lg text-brand-ink">$75</span>
          </div>
          <p className="text-sm text-brand-ink-soft">One box. Four phases. Thirty days.</p>
          <p className="text-xs text-brand-ink-soft">One-time purchase</p>
          <button
            onClick={() => openShopify(KIT_URL)}
            className="mt-2 py-3 rounded-xl bg-brand-ink text-white text-sm font-semibold"
          >
            Shop now
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-brand-stone p-5 flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1.5">
              <span className="text-lg font-bold text-brand-ink">Monthly Subscription</span>
              <span className="self-start bg-brand-gold text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                Save $7/month
              </span>
            </div>
            <span className="font-mono text-lg text-brand-ink">$68/mo</span>
          </div>
          <p className="text-sm text-brand-ink-soft">Never run out. Cancel anytime.</p>
          <button
            onClick={() => openShopify(SUB_URL)}
            className="mt-2 py-3 rounded-xl bg-brand-ink text-white text-sm font-semibold"
          >
            Shop now
          </button>
        </div>
      </div>

      {/* Footer */}
      <p className="text-xs text-brand-ink-soft leading-relaxed">
        Purchases are completed securely through our Shopify store. Your cycle data stays
        private in this app.
      </p>
    </div>
  )
}
