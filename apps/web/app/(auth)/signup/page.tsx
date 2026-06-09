'use client'
import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@lunari/utils'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

export default function SignupPage() {
  const router = useRouter()
  const { signUpWithEmail, signInWithGoogle, isLoading, error } = useAuth()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await signUpWithEmail(data.email, data.password)
      router.replace('/onboarding')
    } catch { /* error in store */ }
  }

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-brand-stone p-8 flex flex-col gap-5">
        <div className="text-center">
          <span className="font-display text-3xl text-brand-ink">lunari</span>
          <p className="font-body text-sm text-brand-ink-soft mt-2">Create your account</p>
        </div>

        <button
          onClick={signInWithGoogle}
          className="w-full py-3 rounded-xl border-2 border-brand-stone text-sm font-semibold text-brand-ink hover:bg-brand-cream transition-colors"
        >
          Continue with Google
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-brand-stone" />
          <span className="text-xs text-brand-ink-soft">or sign up with email</span>
          <div className="flex-1 h-px bg-brand-stone" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {[
            { name: 'email' as const, type: 'email', placeholder: 'Email address' },
            { name: 'password' as const, type: 'password', placeholder: 'Password' },
            { name: 'confirmPassword' as const, type: 'password', placeholder: 'Confirm password' },
          ].map((field) => (
            <div key={field.name}>
              <input
                {...register(field.name)}
                type={field.type}
                placeholder={field.placeholder}
                className="w-full rounded-xl border-2 border-brand-stone bg-brand-cream px-4 py-3 text-sm text-brand-ink placeholder-brand-ink-soft focus:outline-none focus:border-brand-gold"
              />
              {errors[field.name] && (
                <p className="text-xs text-phase-menstrual mt-1">{errors[field.name]?.message}</p>
              )}
            </div>
          ))}
          {error && <p className="text-xs text-phase-menstrual">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-brand-ink text-white text-sm font-semibold disabled:opacity-60"
          >
            {isLoading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-xs text-brand-ink-soft">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-brand-gold font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
