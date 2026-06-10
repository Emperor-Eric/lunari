'use client'
import React, { useState } from 'react'
import { getSupabaseClient } from '@lunari/utils'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const supabase = getSupabaseClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError
      // Hard navigation so middleware re-runs with the new session cookie.
      window.location.assign('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white rounded-2xl border border-brand-stone p-8 flex flex-col gap-5"
      >
        <div className="text-center">
          <span className="font-display text-3xl text-brand-ink">lunari</span>
          <p className="text-sm text-brand-ink-soft mt-2">Admin dashboard</p>
        </div>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-lg border-2 border-brand-stone bg-brand-cream px-4 py-3 text-sm text-brand-ink focus:outline-none focus:border-brand-gold"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-lg border-2 border-brand-stone bg-brand-cream px-4 py-3 text-sm text-brand-ink focus:outline-none focus:border-brand-gold"
        />

        {error && <p className="text-xs text-phase-menstrual">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-brand-ink text-white text-sm font-semibold disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
