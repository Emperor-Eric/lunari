import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

/**
 * Returns a singleton Supabase browser client.
 * Uses NEXT_PUBLIC_* vars for web, EXPO_PUBLIC_* for mobile.
 * Call this from client components / React Native screens only.
 */
export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client

  // Support both Next.js and Expo env var prefixes
  const url =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL) ||
    (typeof process !== 'undefined' && process.env.EXPO_PUBLIC_SUPABASE_URL) ||
    ''

  const anonKey =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    (typeof process !== 'undefined' && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) ||
    ''

  _client = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: typeof window !== 'undefined',
    },
  })

  return _client
}

/**
 * Creates a React Native client backed by expo-secure-store.
 * Import and call this in mobile app init — do not call on web.
 */
export async function createMobileClient() {
  // Dynamic import so web bundles don't pull in expo-secure-store
  const SecureStore = await import('expo-secure-store')

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''

  return createClient(url, anonKey, {
    auth: {
      storage: {
        getItem: (key: string) => SecureStore.getItemAsync(key),
        setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
        removeItem: (key: string) => SecureStore.deleteItemAsync(key),
      },
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  })
}
