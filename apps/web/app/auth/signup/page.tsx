'use client'
import React from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth, useUser } from '@lunari/utils'
import { AuthShell, Divider, Field, inputClass } from '../_components/AuthShell'

const schema = z
  .object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'At least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
type FormData = z.infer<typeof schema>

export default function SignupPage() {
  const { signUpWithEmail, signInWithGoogle, isLoading, error } = useAuth()
  const { fetchUser } = useUser()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      await signUpWithEmail(data.email, data.password)
      // New accounts are never onboarded, but check onboardedAt to be safe
      await fetchUser()
      const { user } = useUser.getState()
      const destination = user?.onboardedAt ? '/tracker' : '/onboarding'
      // Hard navigation (not router.push) so the request hits the server fresh
      // and the SSR middleware reads the Supabase session cookie that
      // setSession() just wrote. A soft client navigation would re-run
      // middleware against a stale render with no cookie and bounce to login.
      window.location.assign(destination)
    } catch {
      /* error in store */
    }
  }

  const fields = [
    { name: 'email' as const, type: 'email', placeholder: 'Email address' },
    { name: 'password' as const, type: 'password', placeholder: 'Password' },
    { name: 'confirmPassword' as const, type: 'password', placeholder: 'Confirm password' },
  ]

  return (
    <AuthShell subtitle="Create your account to begin.">
      <button
        onClick={signInWithGoogle}
        className="w-full py-3 rounded-xl border border-brand-stone font-body text-sm font-semibold text-brand-ink hover:bg-brand-cream transition-colors"
      >
        Continue with Google
      </button>

      <Divider label="or sign up with email" />

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {fields.map((field) => (
          <Field key={field.name} error={errors[field.name]?.message}>
            <input
              {...register(field.name)}
              type={field.type}
              placeholder={field.placeholder}
              className={inputClass}
            />
          </Field>
        ))}

        {error && <p className="font-body text-xs text-phase-menstrual">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 rounded-xl bg-brand-ink font-body text-sm font-semibold text-brand-cream disabled:opacity-60 transition-opacity"
        >
          {isLoading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-center font-body text-xs text-brand-ink-soft">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-brand-gold font-medium">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
