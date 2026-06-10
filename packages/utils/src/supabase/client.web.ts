import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

/**
 * Web Supabase client (Next.js).
 * Uses @supabase/ssr createBrowserClient with cookie-based session storage.
 * This file must NEVER import expo / react-native code — it is the bundle
 * the web app loads.
 */
export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  _client = createBrowserClient(url, anonKey)
  return _client
}
