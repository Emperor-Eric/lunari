'use client'
import React from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth, useUser } from '@lunari/utils'
import { AuthShell, Divider, Field, inputClass } from '../_components/AuthShell'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const { signInWithEmail, signInWithGoogle, isLoading, error } = useAuth()
  const { fetchUser } = useUser()

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
    <AuthShell subtitle="Sign in to return to your sanctuary.">
      <button
        onClick={signInWithGoogle}
        className="w-full py-3 rounded-xl border border-brand-stone font-body text-sm font-semibold text-brand-ink hover:bg-brand-cream transition-colors"
      >
        Continue with Google
      </button>

      <Divider label="or" />

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field error={errors.email?.message}>
          <input
            {...register('email')}
            type="email"
            placeholder="Email address"
            className={inputClass}
          />
        </Field>
        <Field error={errors.password?.message}>
          <input
            {...register('password')}
            type="password"
            placeholder="Password"
            className={inputClass}
          />
        </Field>

        <Link
          href="/auth/forgot-password"
          className="font-body text-xs text-brand-gold text-right -mt-1"
        >
          Forgot password?
        </Link>

        {error && <p className="font-body text-xs text-phase-menstrual">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 rounded-xl bg-brand-ink font-body text-sm font-semibold text-brand-cream disabled:opacity-60 transition-opacity"
        >
          {isLoading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="text-center font-body text-xs text-brand-ink-soft">
        Don&apos;t have an account?{' '}
        <Link href="/auth/signup" className="text-brand-gold font-medium">
          Sign up
        </Link>
      </p>
    </AuthShell>
  )
}
