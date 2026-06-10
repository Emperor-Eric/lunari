import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

let _client: SupabaseClient | null = null

/**
 * React Native Supabase client (Expo).
 * Backed by expo-secure-store for encrypted session persistence.
 * This file is only ever resolved by the "react-native" export condition,
 * so the top-level expo-secure-store import never reaches the web bundle.
 */
export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''

  _client = createClient(url, anonKey, {
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

  return _client
}
