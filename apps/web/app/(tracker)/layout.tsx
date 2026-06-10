'use client'
import React, { createContext, useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@lunari/utils'
import type { TodayCycleResponse } from '@lunari/types'
import { getPhaseForDay } from '@lunari/phase-data'

const CycleContext = createContext<{ cycleData: TodayCycleResponse | null }>({ cycleData: null })
export const useCycleContext = () => useContext(CycleContext)

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/v1'

const NAV_LINKS = [
  { href: '/tracker', label: 'Today', emoji: '🌙' },
  { href: '/tracker/workouts', label: 'Move', emoji: '🏋️' },
  { href: '/tracker/nutrition', label: 'Fuel', emoji: '🌿' },
  { href: '/tracker/log', label: 'Log', emoji: '✍️' },
]

export default function TrackerLayout({ children }: { children: React.ReactNode }) {
  const { session } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [cycleData, setCycleData] = useState<TodayCycleResponse | null>(null)

  useEffect(() => {
    if (!session) return
    fetch(`${API_URL}/me/cycle/today`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        // No cycle set yet → the user hasn't finished onboarding
        if (!data) {
          router.replace('/onboarding')
          return
        }
        setCycleData(data)
      })
  }, [session, router])

  const phase = cycleData ? getPhaseForDay(cycleData.day) : getPhaseForDay(1)

  return (
    <CycleContext.Provider value={{ cycleData }}>
      <div className="min-h-screen bg-brand-cream flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-[220px] flex-col border-r border-brand-stone bg-white p-6 gap-8 fixed h-full">
          <span className="font-display text-2xl text-brand-ink">lunari</span>
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
