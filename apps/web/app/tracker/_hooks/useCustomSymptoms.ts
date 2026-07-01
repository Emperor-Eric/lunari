'use client'
import { useCallback, useEffect, useState } from 'react'
import type { CustomSymptom } from '@lunari/types'
import { apiGet, apiPost, apiPatch, apiDelete } from '@/src/lib/api'

/**
 * The user's custom-symptom palette. Daily logs still store the plain label string in
 * SymptomLog.symptoms (same as built-ins) — this only manages the chip definitions.
 */
export function useCustomSymptoms() {
  const [items, setItems] = useState<CustomSymptom[]>([])

  const refresh = useCallback(() => {
    apiGet<CustomSymptom[]>('/me/custom-symptoms')
      .then(setItems)
      .catch((err) => console.error('custom-symptoms: load failed', err))
  }, [])
  useEffect(() => {
    refresh()
  }, [refresh])

  const add = useCallback(async (label: string): Promise<CustomSymptom> => {
    const created = await apiPost<CustomSymptom>('/me/custom-symptoms', { label })
    setItems((prev) => [...prev, created])
    return created
  }, [])

  const update = useCallback(async (id: string, patch: { label?: string; archived?: boolean }) => {
    const updated = await apiPatch<CustomSymptom>(`/me/custom-symptoms/${id}`, patch)
    setItems((prev) => prev.map((c) => (c.id === id ? updated : c)))
    return updated
  }, [])

  const remove = useCallback(async (id: string) => {
    await apiDelete(`/me/custom-symptoms/${id}`)
    setItems((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const active = items.filter((c) => !c.archived)

  return { items, active, refresh, add, update, remove }
}
