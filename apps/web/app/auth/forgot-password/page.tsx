'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { getSupabaseClient } from '@lunari/utils'
import {
  AuthShell,
  GoldButton,
  darkInputClass,
  GOLD,
  MUTED,
  INK,
  BTN_TEXT,
} from '../_components/AuthShell'

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
        <p className="text-center font-body text-sm leading-relaxed" style={{ color: MUTED }}>
          We sent a reset link to <span style={{ color: INK }}>{email}</span>. Follow the link in
          that email to choose a new password.
        </p>
        <Link
          href="/auth/login"
          className="block w-full text-center py-3.5 rounded-xl font-body text-sm font-semibold mt-1"
          style={{ background: GOLD, color: BTN_TEXT }}
        >
          Back to sign in
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell subtitle="Reset your password.">
      <form onSubmit={handleReset} className="flex flex-col gap-3.5">
        <p className="text-center font-body text-sm -mt-1" style={{ color: MUTED }}>
          Enter your email and we&apos;ll send you a reset link.
        </p>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email address"
          className={darkInputClass}
        />
        {error && (
          <p className="font-body text-xs" style={{ color: '#E5A3A3' }}>
            {error}
          </p>
        )}
        <GoldButton type="submit" disabled={loading}>
          {loading ? 'Sending…' : 'Send reset link'}
        </GoldButton>
      </form>

      <p className="text-center font-body text-xs" style={{ color: MUTED }}>
        Remembered it?{' '}
        <Link href="/auth/login" className="font-medium" style={{ color: GOLD }}>
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
