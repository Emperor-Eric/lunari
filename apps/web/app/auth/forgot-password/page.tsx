'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { getSupabaseClient } from '@lunari/utils'
import { AuthShell, inputClass } from '../_components/AuthShell'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    try {
      // Mirrors the mobile forgot-password flow — Supabase emails a reset link.
      const supabase = getSupabaseClient()
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo:
          typeof window !== 'undefined' ? `${window.location.origin}/auth/login` : undefined,
      })
      if (err) throw err
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthShell subtitle="Check your inbox.">
        <p className="text-center font-body text-sm text-brand-ink-soft leading-relaxed">
          We sent a reset link to <span className="text-brand-ink font-medium">{email}</span>.
          Follow the link in that email to choose a new password.
        </p>
        <Link
          href="/auth/login"
          className="block w-full text-center py-3.5 rounded-xl bg-brand-ink font-body text-sm font-semibold text-brand-cream"
        >
          Back to sign in
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell subtitle="Reset your password.">
      <form onSubmit={handleReset} className="flex flex-col gap-4">
        <p className="text-center font-body text-sm text-brand-ink-soft -mt-1">
          Enter your email and we&apos;ll send you a reset link.
        </p>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email address"
          className={inputClass}
        />
        {error && <p className="font-body text-xs text-phase-menstrual">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-brand-ink font-body text-sm font-semibold text-brand-cream disabled:opacity-60 transition-opacity"
        >
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <p className="text-center font-body text-xs text-brand-ink-soft">
        Remembered it?{' '}
        <Link href="/auth/login" className="text-brand-gold font-medium">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
