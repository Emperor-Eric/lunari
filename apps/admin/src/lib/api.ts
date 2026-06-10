import { getSupabaseClient } from '@lunari/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/v1'

async function getAccessToken(): Promise<string | null> {
  const supabase = getSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

/** Low-level authenticated fetch against the admin API. */
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

export async function apiGet<T = unknown>(path: string): Promise<T> {
  const res = await apiFetch(path, { method: 'GET' })
  if (!res.ok) throw await toError(res)
  return res.json() as Promise<T>
}

export async function apiPost<T = unknown>(path: string, body?: unknown): Promise<T> {
  const res = await apiFetch(path, {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw await toError(res)
  return res.json() as Promise<T>
}

export async function apiPatch<T = unknown>(path: string, body?: unknown): Promise<T> {
  const res = await apiFetch(path, {
    method: 'PATCH',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw await toError(res)
  return res.json() as Promise<T>
}

/**
 * Hits a CSV export endpoint with the bearer token, then triggers a browser
 * file download from the returned blob.
 */
export async function downloadCsv(path: string, filename: string): Promise<void> {
  const res = await apiFetch(path, { method: 'GET' })
  if (!res.ok) throw await toError(res)
  const blob = await res.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}
