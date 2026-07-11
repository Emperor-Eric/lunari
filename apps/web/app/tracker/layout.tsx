'use client'
import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Moon, Dumbbell, Pencil, User, ShoppingBag } from 'lucide-react'
import type { TodayCycleResponse } from '@lunari/types'
import { sidebar } from '@lunari/design-tokens'
import { apiFetch } from '@/src/lib/api'
import { FuelIcon } from '@/src/components/FuelIcon'
import { CycleContext } from './cycle-context'

const SHOP_ENABLED = process.env.NEXT_PUBLIC_SHOP_ENABLED === 'true'

type IconType = (props: { size?: number; color?: string; strokeWidth?: number }) => React.ReactNode

const NAV_LINKS: { href: string; label: string; Icon: IconType }[] = [
  { href: '/tracker', label: 'Today', Icon: Moon },
  { href: '/tracker/workouts', label: 'Move', Icon: Dumbbell },
  { href: '/tracker/nutrition', label: 'Fuel', Icon: FuelIcon },
  { href: '/tracker/log', label: 'Log', Icon: Pencil },
  // Shop is gated behind NEXT_PUBLIC_SHOP_ENABLED (off until the kit ships)
  ...(SHOP_ENABLED
    ? [{ href: '/tracker/shop', label: 'Shop', Icon: ShoppingBag as IconType }]
    : []),
  { href: '/tracker/profile', label: 'Me', Icon: User },
]

export default function TrackerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [cycleData, setCycleData] = useState<TodayCycleResponse | null>(null)

  // apiFetch attaches the bearer token from the session cookie, so this works
  // on a fresh page load without depending on the in-memory auth store.
  // Exposed via context as `refresh` so editing cycle settings recalibrates live.
  const refresh = useCallback(() => {
    apiFetch('/me/cycle/today')
      .then(async (r) => {
        // Only a true 404 means "no cycle yet" → onboarding. A 401/500/etc. must NOT
        // bounce an onboarded user there, and must not fail silently: consumers of this
        // context fall back to the default (menstrual) phase until refresh succeeds.
        if (r.status === 404) {
          router.replace('/onboarding')
          return
        }
        if (!r.ok) {
          console.error(
            `tracker layout: GET /me/cycle/today failed (${r.status}) — context consumers show the default phase until refresh`
          )
          return
        }
        setCycleData(await r.json())
      })
      .catch((err) => {
        console.error(
          'tracker layout: GET /me/cycle/today network error — context consumers show the default phase until refresh',
          err
        )
      })
  }, [router])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <CycleContext.Provider value={{ cycleData, refresh }}>
      <div className="min-h-screen bg-brand-cream flex">
        {/* Desktop sidebar — stone rail (token-driven, not the phase flood) */}
        <aside
          className="hidden md:flex w-[220px] flex-col border-r border-brand-stone p-6 gap-8 fixed h-full"
          style={{ backgroundColor: sidebar.surface }}
        >
          <span
            className="font-display lowercase text-[26px] tracking-[0.04em]"
            style={{ color: sidebar.wordmark }}
          >
            lunari
          </span>
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map(({ href, label, Icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: active ? sidebar.activePill : 'transparent',
                    color: active ? sidebar.activeInk : sidebar.ink,
                  }}
                >
                  <Icon
                    size={18}
                    strokeWidth={1.5}
                    color={active ? sidebar.activeIcon : sidebar.ink}
                  />
                  {label}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 md:ml-[220px] pb-20 md:pb-0">{children}</main>

        {/* Narrow-viewport bottom tab bar (web) */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 border-t border-brand-stone flex z-10"
          style={{ backgroundColor: sidebar.surface }}
        >
          {NAV_LINKS.map(({ href, label, Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center py-3 gap-0.5"
                style={{ color: active ? sidebar.activeInk : sidebar.ink }}
              >
                <Icon
                  size={22}
                  strokeWidth={1.5}
                  color={active ? sidebar.activeIcon : sidebar.ink}
                />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </CycleContext.Provider>
  )
}
