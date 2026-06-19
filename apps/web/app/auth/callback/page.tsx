'use client'
import { useEffect } from 'react'
import { getSupabaseClient, useAuth, useUser } from '@lunari/utils'

export default function AuthCallback() {
  const { setSession } = useAuth()
  const { fetchUser } = useUser()

  useEffect(() => {
    const supabase = getSupabaseClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        window.location.assign('/auth/login')
        return
      }
      setSession(session)
      // Route un-onboarded users to onboarding (mirrors the email/password flow)
      // rather than always landing on the tracker.
      await fetchUser()
      const { user } = useUser.getState()
      const destination = user?.onboardedAt ? '/tracker' : '/onboarding'
      // Hard navigation so middleware re-runs with the OAuth session cookie.
      window.location.assign(destination)
    })
  }, [setSession, fetchUser])

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center">
      <div className="text-center gap-3 flex flex-col items-center">
        <span className="font-display text-2xl text-brand-ink">lunari</span>
        <div className="w-6 h-6 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-brand-ink-soft">Signing you in…</p>
      </div>
    </div>
  )
}
