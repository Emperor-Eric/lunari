import { create } from 'zustand'
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'
import { getSupabaseClient } from '@lunari/utils/supabase/client'

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

  setSession: (session) => set({ session, supabaseUser: session?.user ?? null }),

  signUpWithEmail: async (email, password, name) => {
    set({ isLoading: true, error: null })
    try {
      // The API is authoritative for signup: it creates the auth user (service
      // role), inserts the users-table row, and returns a real session.
      // Send the full payload the route's Zod schema expects.
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: name ?? email.split('@')[0] }),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error ?? 'Sign up failed')
      }

      // Hydrate the SDK with the returned session so cookies/storage are set
      // and the user is authenticated for subsequent requests.
      const supabase = getSupabaseClient()
      if (json.session?.access_token && json.session?.refresh_token) {
        await supabase.auth.setSession({
          access_token: json.session.access_token,
          refresh_token: json.session.refresh_token,
        })
      }

      set({ session: json.session ?? null, supabaseUser: json.user ?? null })
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
