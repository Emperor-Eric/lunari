'use client'
import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth, useUser } from '@lunari/utils'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const { signInWithEmail, signInWithGoogle, isLoading, error } = useAuth()
  const { fetchUser } = useUser()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await signInWithEmail(data.email, data.password)
      await fetchUser()
      const { user } = useUser.getState()
      router.replace(user?.onboardedAt ? '/tracker' : '/onboarding')
    } catch { /* error in store */ }
  }

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-brand-stone p-8 flex flex-col gap-5">
        <div className="text-center">
          <span className="font-display text-3xl text-brand-ink">lunari</span>
          <p className="font-body text-sm text-brand-ink-soft mt-2">Welcome back</p>
        </div>

        <button
          onClick={signInWithGoogle}
          className="w-full py-3 rounded-xl border-2 border-brand-stone text-sm font-semibold text-brand-ink hover:bg-brand-cream transition-colors"
        >
          Continue with Google
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-brand-stone" />
          <span className="text-xs text-brand-ink-soft">or</span>
          <div className="flex-1 h-px bg-brand-stone" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <input
              {...register('email')}
              type="email"
              placeholder="Email address"
              className="w-full rounded-xl border-2 border-brand-stone bg-brand-cream px-4 py-3 text-sm text-brand-ink placeholder-brand-ink-soft focus:outline-none focus:border-brand-gold"
            />
            {errors.email && <p className="text-xs text-phase-menstrual mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <input
              {...register('password')}
              type="password"
              placeholder="Password"
              className="w-full rounded-xl border-2 border-brand-stone bg-brand-cream px-4 py-3 text-sm text-brand-ink placeholder-brand-ink-soft focus:outline-none focus:border-brand-gold"
            />
            {errors.password && <p className="text-xs text-phase-menstrual mt-1">{errors.password.message}</p>}
          </div>
          <Link href="/auth/forgot-password" className="text-xs text-brand-gold text-right -mt-2">
            Forgot password?
          </Link>
          {error && <p className="text-xs text-phase-menstrual">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-brand-ink text-white text-sm font-semibold disabled:opacity-60 transition-opacity"
          >
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs text-brand-ink-soft">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-brand-gold font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
