'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@lunari/utils'
import { useAuth } from '@lunari/utils'

export default function AuthCallback() {
  const router = useRouter()
  const { setSession } = useAuth()

  useEffect(() => {
    const supabase = getSupabaseClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session)
        router.replace('/tracker')
      } else {
        router.replace('/auth/login')
      }
    })
  }, [router, setSession])

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
