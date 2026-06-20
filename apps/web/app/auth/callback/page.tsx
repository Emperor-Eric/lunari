'use client'
import { useEffect } from 'react'
import { getSupabaseClient, useAuth, useUser } from '@lunari/utils'
import { NAVY_GRADIENT, INK, GOLD } from '../_components/AuthShell'

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
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: NAVY_GRADIENT }}
    >
      <div className="text-center gap-3 flex flex-col items-center">
        <img
          src="/brand/seal-gold.png"
          alt=""
          width={64}
          height={64}
          style={{ width: 64, height: 64 }}
        />
        <div
          className="w-6 h-6 rounded-full animate-spin"
          style={{ border: `2px solid ${GOLD}`, borderTopColor: 'transparent' }}
        />
        <p className="font-body text-sm" style={{ color: INK }}>
          Signing you in…
        </p>
      </div>
    </div>
  )
}
