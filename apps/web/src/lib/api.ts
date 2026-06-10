import { getSupabaseClient } from '@lunari/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/v1'

/**
 * Reads the current access token straight from the browser Supabase client,
 * which is backed by the session cookie. This is the source of truth — unlike
 * the useAuth Zustand store, it survives full page reloads (hard navigations).
 */
async function getAccessToken(): Promise<string | null> {
  const supabase = getSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

/**
 * Low-level authenticated fetch. Attaches the Supabase bearer token and JSON
 * content-type, then calls the Fastify API at NEXT_PUBLIC_API_URL. Returns the
 * raw Response so callers can branch on status (e.g. 404 → onboarding).
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken()
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> | undefined),
    },
  })
}

async function toError(res: Response): Promise<Error> {
  try {
    const data = await res.json()
    return new Error(data?.error ?? `Request failed (${res.status})`)
  } catch {
    return new Error(`Request failed (${res.status})`)
  }
}

/** GET and parse JSON, throwing on a non-2xx response. */
export async function apiGet<T = unknown>(path: string): Promise<T> {
  const res = await apiFetch(path, { method: 'GET' })
  if (!res.ok) throw await toError(res)
  return res.json() as Promise<T>
}

/** POST a JSON body and parse JSON, throwing on a non-2xx response. */
export async function apiPost<T = unknown>(path: string, body?: unknown): Promise<T> {
  const res = await apiFetch(path, {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw await toError(res)
  return res.json() as Promise<T>
}

/** PATCH a JSON body and parse JSON, throwing on a non-2xx response. */
export async function apiPatch<T = unknown>(path: string, body?: unknown): Promise<T> {
  const res = await apiFetch(path, {
    method: 'PATCH',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw await toError(res)
  return res.json() as Promise<T>
}

/** DELETE, throwing on a non-2xx response. Tolerates 204 No Content. */
export async function apiDelete<T = unknown>(path: string): Promise<T | null> {
  const res = await apiFetch(path, { method: 'DELETE' })
  if (!res.ok) throw await toError(res)
  if (res.status === 204) return null
  return res.json() as Promise<T>
}
