// Re-export the Supabase client via the platform-aware subpath so the bundler
// resolves client.web.ts (web) or client.native.ts (react-native) — never both.
export { getSupabaseClient } from '@lunari/utils/supabase/client'
export { useAuth } from './auth/useAuth'
export { useUser } from './auth/useUser'
