'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth, useUser } from '@lunari/utils'
import {
  AuthShell,
  GoldButton,
  OutlineButton,
  Field,
  darkInputClass,
  GOLD,
  MUTED,
} from '../_components/AuthShell'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const { signInWithEmail, signInWithGoogle, isLoading, error } = useAuth()
  const { fetchUser } = useUser()
  const [emailMode, setEmailMode] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      await signInWithEmail(data.email, data.password)
      await fetchUser()
      const { user } = useUser.getState()
      const destination = user?.onboardedAt ? '/tracker' : '/onboarding'
      // Hard navigation so the SSR middleware re-runs with the freshly written
      // session cookie. A soft router.push would bounce back to login because
      // the server render still sees no session cookie.
      window.location.assign(destination)
    } catch {
      /* error in store */
    }
  }

  return (
    <AuthShell>
      <GoldButton onClick={signInWithGoogle}>Continue with Google</GoldButton>

      {!emailMode ? (
        <OutlineButton onClick={() => setEmailMode(true)}>Continue with email</OutlineButton>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
          <Field error={errors.email?.message}>
            <input
              {...register('email')}
              type="email"
              placeholder="Email address"
              className={darkInputClass}
            />
          </Field>
          <Field error={errors.password?.message}>
            <input
              {...register('password')}
              type="password"
              placeholder="Password"
              className={darkInputClass}
            />
          </Field>

          <Link
            href="/auth/forgot-password"
            className="font-body text-xs text-right -mt-1"
            style={{ color: GOLD }}
          >
            Forgot password?
          </Link>

          {error && (
            <p className="font-body text-xs" style={{ color: '#E5A3A3' }}>
              {error}
            </p>
          )}

          <GoldButton type="submit" disabled={isLoading}>
            {isLoading ? 'Signing in…' : 'Sign in'}
          </GoldButton>
        </form>
      )}

      <p className="text-center font-body text-xs" style={{ color: MUTED }}>
        Don&apos;t have an account?{' '}
        <Link href="/auth/signup" className="font-medium" style={{ color: GOLD }}>
          Sign up
        </Link>
      </p>
    </AuthShell>
  )
}
