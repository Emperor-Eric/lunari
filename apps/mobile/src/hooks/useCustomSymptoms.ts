import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@lunari/utils'
import type { CustomSymptom } from '@lunari/types'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/v1'

/**
 * The user's custom-symptom palette. Daily logs still store the plain label string in
 * SymptomLog.symptoms (same as built-ins) — this only manages the chip definitions.
 */
export function useCustomSymptoms() {
  const { session } = useAuth()
  const [items, setItems] = useState<CustomSymptom[]>([])

  const headers = useCallback(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    }),
    [session]
  )

  const refresh = useCallback(() => {
    if (!session) return
    fetch(`${API_URL}/me/custom-symptoms`, { headers: headers() })
      .then((r) => (r.ok ? r.json() : []))
      .then((d: CustomSymptom[]) => setItems(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [session, headers])

  useEffect(() => {
    refresh()
  }, [refresh])

  const add = useCallback(
    async (label: string): Promise<CustomSymptom> => {
      const r = await fetch(`${API_URL}/me/custom-symptoms`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ label }),
      })
      if (!r.ok) throw new Error('add failed')
      const created: CustomSymptom = await r.json()
      setItems((prev) => [...prev, created])
      return created
    },
    [headers]
  )

  const update = useCallback(
    async (id: string, patch: { label?: string; archived?: boolean }): Promise<CustomSymptom> => {
      const r = await fetch(`${API_URL}/me/custom-symptoms/${id}`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify(patch),
      })
      if (!r.ok) throw new Error('update failed')
      const updated: CustomSymptom = await r.json()
      setItems((prev) => prev.map((c) => (c.id === id ? updated : c)))
      return updated
    },
    [headers]
  )

  const remove = useCallback(
    async (id: string) => {
      const r = await fetch(`${API_URL}/me/custom-symptoms/${id}`, {
        method: 'DELETE',
        headers: headers(),
      })
      if (!r.ok && r.status !== 204) throw new Error('delete failed')
      setItems((prev) => prev.filter((c) => c.id !== id))
    },
    [headers]
  )

  const active = items.filter((c) => !c.archived)
  return { items, active, refresh, add, update, remove }
}
