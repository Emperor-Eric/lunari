import { create } from 'zustand'
import type { User } from '@lunari/types'
import { useAuth } from './useAuth'

const API_URL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) ||
  (typeof process !== 'undefined' && process.env.EXPO_PUBLIC_API_URL) ||
  'http://localhost:3001/v1'

interface UserState {
  user: User | null
  isLoading: boolean
  error: string | null
  fetchUser: () => Promise<void>
  updateUser: (patch: Partial<User>) => Promise<void>
  clearUser: () => void
}

export const useUser = create<UserState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  clearUser: () => set({ user: null }),

  fetchUser: async () => {
    const { session } = useAuth.getState()
    if (!session) return

    set({ isLoading: true, error: null })
    try {
      const res = await fetch(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) throw new Error(`Failed to fetch user (${res.status})`)
      const user: User = await res.json()
      set({ user })
    } catch (err) {
      // Don't swallow — a silent failure here is what hid the missing-user-row bug.
      console.error('useUser.fetchUser failed', err)
      set({ error: err instanceof Error ? err.message : 'Failed to fetch user' })
    } finally {
      set({ isLoading: false })
    }
  },

  updateUser: async (patch) => {
    const { session } = useAuth.getState()
    if (!session) return

    set({ isLoading: true, error: null })
    try {
      const res = await fetch(`${API_URL}/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error('Failed to update user')
      const user: User = await res.json()
      set({ user })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to update user' })
    } finally {
      set({ isLoading: false })
    }
  },
}))
