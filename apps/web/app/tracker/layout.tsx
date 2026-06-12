'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { TodayCycleResponse } from '@lunari/types'
import { getPhaseForDay } from '@lunari/phase-data'
import { apiFetch } from '@/src/lib/api'
import { CycleContext } from './cycle-context'

const SHOP_ENABLED = process.env.NEXT_PUBLIC_SHOP_ENABLED === 'true'

const NAV_LINKS = [
  { href: '/tracker', label: 'Today', emoji: '🌙' },
  { href: '/tracker/workouts', label: 'Move', emoji: '🏋️' },
  { href: '/tracker/nutrition', label: 'Fuel', emoji: '🌿' },
  { href: '/tracker/log', label: 'Log', emoji: '✍️' },
  // Shop is gated behind NEXT_PUBLIC_SHOP_ENABLED (off until the kit ships)
  ...(SHOP_ENABLED ? [{ href: '/tracker/shop', label: 'Shop', emoji: '🛍️' }] : []),
  { href: '/tracker/profile', label: 'Me', emoji: '👤' },
]

export default function TrackerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [cycleData, setCycleData] = useState<TodayCycleResponse | null>(null)

  useEffect(() => {
    // apiFetch attaches the bearer token from the session cookie, so this works
    // on a fresh page load without depending on the in-memory auth store.
    apiFetch('/me/cycle/today')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        // No cycle set yet → the user hasn't finished onboarding
        if (!data) {
          router.replace('/onboarding')
          return
        }
        setCycleData(data)
      })
      .catch(() => {
        /* network error — leave cycleData null, page shows default phase */
      })
  }, [router])

  const phase = cycleData ? getPhaseForDay(cycleData.day) : getPhaseForDay(1)

  return (
    <CycleContext.Provider value={{ cycleData }}>
      <div className="min-h-screen bg-brand-cream flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-[220px] flex-col border-r border-brand-stone bg-white p-6 gap-8 fixed h-full">
          {/* Ink wordmark — sidebar is on a light background.
              Asset: apps/web/public/brand/wordmark-ink.png */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/wordmark-ink.png" alt="lunari" className="w-[110px] h-auto" />
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: active ? phase.lightColor : 'transparent',
                    color: active ? phase.color : '#6B6460',
                  }}
                >
                  <span>{link.emoji}</span>
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 md:ml-[220px] pb-20 md:pb-0">
          {children}
        </main>

        {/* Mobile bottom tab bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-brand-stone flex z-10">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex-1 flex flex-col items-center py-3 gap-0.5"
                style={{ color: active ? phase.color : '#6B6460' }}
              >
                <span className="text-xl">{link.emoji}</span>
                <span className="text-[10px] font-medium">{link.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </CycleContext.Provider>
  )
}
