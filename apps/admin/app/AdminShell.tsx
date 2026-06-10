'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getSupabaseClient } from '@lunari/utils'

const NAV_LINKS = [
  { href: '/', label: 'Overview', icon: '📊' },
  { href: '/orders', label: 'Orders', icon: '📦' },
  { href: '/analytics', label: 'Analytics', icon: '📈' },
  { href: '/influencers', label: 'Influencers', icon: '🤝' },
  { href: '/users', label: 'Users', icon: '👥' },
  { href: '/notifications', label: 'Notifications', icon: '🔔' },
]

type AuthState =
  | { status: 'loading' }
  | { status: 'denied'; email: string }
  | { status: 'admin'; email: string }

async function signOut() {
  await getSupabaseClient().auth.signOut()
  window.location.assign('/login')
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [auth, setAuth] = useState<AuthState>({ status: 'loading' })

  const isLogin = pathname === '/login'

  useEffect(() => {
    if (isLogin) return
    const supabase = getSupabaseClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        // Middleware will redirect, but guard anyway.
        window.location.assign('/login')
        return
      }
      const role = (user.app_metadata as { role?: string } | undefined)?.role
      const email = user.email ?? ''
      setAuth(role === 'admin' ? { status: 'admin', email } : { status: 'denied', email })
    })
  }, [isLogin])

  // Login page renders bare (no chrome).
  if (isLogin) return <>{children}</>

  if (auth.status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream">
        <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (auth.status === 'denied') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-cream gap-4 p-6 text-center">
        <span className="font-display text-3xl text-brand-ink">lunari</span>
        <h1 className="text-xl font-semibold text-brand-ink">Access denied</h1>
        <p className="text-sm text-brand-ink-soft max-w-sm">
          {auth.email} isn&apos;t an admin. If this is a mistake, ask an existing admin to grant
          you access.
        </p>
        <button
          onClick={signOut}
          className="px-5 py-2.5 rounded-lg border border-brand-stone bg-white text-sm font-medium text-brand-ink hover:bg-brand-cream"
        >
          Sign out
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-brand-cream">
      {/* Sidebar */}
      <aside className="fixed h-full w-[240px] bg-white border-r border-brand-stone p-6 flex flex-col gap-8">
        <span className="font-display text-2xl text-brand-ink">lunari</span>
        <nav className="flex flex-col gap-1">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: active ? '#F5F0E8' : 'transparent',
                  color: active ? '#2C2825' : '#6B6460',
                }}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 ml-[240px] flex flex-col">
        <header className="h-14 bg-white border-b border-brand-stone flex items-center justify-end gap-4 px-6">
          <span className="text-sm text-brand-ink-soft">{auth.email}</span>
          <button
            onClick={signOut}
            className="text-sm font-medium text-brand-ink hover:text-brand-gold"
          >
            Sign out
          </button>
        </header>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}
