import { create } from 'zustand'
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'
import { getSupabaseClient } from '../supabase/client'

const API_URL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) ||
  (typeof process !== 'undefined' && process.env.EXPO_PUBLIC_API_URL) ||
  'http://localhost:3001/v1'

interface AuthState {
  session: Session | null
  supabaseUser: SupabaseUser | null
  isLoading: boolean
  error: string | null

  // Actions
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithApple: () => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
  setSession: (session: Session | null) => void
}

export const useAuth = create<AuthState>((set) => ({
  session: null,
  supabaseUser: null,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  setSession: (session) =>
    set({ session, supabaseUser: session?.user ?? null }),

  signUpWithEmail: async (email, password, name) => {
    set({ isLoading: true, error: null })
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error

      // Create user row in our DB
      if (data.session) {
        await fetch(`${API_URL}/auth/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${data.session.access_token}`,
          },
          body: JSON.stringify({ email, name: name ?? email.split('@')[0] }),
        })
      }

      set({ session: data.session, supabaseUser: data.user })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Sign up failed' })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  signInWithEmail: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      set({ session: data.session, supabaseUser: data.user })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Sign in failed' })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null })
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo:
            typeof window !== 'undefined'
              ? `${window.location.origin}/auth/callback`
              : 'lunari://auth/callback',
        },
      })
      if (error) throw error
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Google sign in failed' })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  signInWithApple: async () => {
    // Stub — implemented in Phase 5 with expo-apple-authentication
    set({ error: 'Apple sign in coming soon' })
  },

  signOut: async () => {
    set({ isLoading: true, error: null })
    try {
      const supabase = getSupabaseClient()
      await supabase.auth.signOut()
      set({ session: null, supabaseUser: null })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Sign out failed' })
    } finally {
      set({ isLoading: false })
    }
  },
}))
