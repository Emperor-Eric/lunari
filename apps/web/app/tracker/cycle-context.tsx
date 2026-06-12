'use client'
import { createContext, useContext } from 'react'
import type { TodayCycleResponse } from '@lunari/types'

// The cycle context lives here (not in layout.tsx) because Next.js App Router
// layout files may only export a default component + a fixed set of named
// exports (metadata, etc.). Exporting a hook from layout.tsx breaks Next's
// generated route types. The provider value is still set by the tracker layout.
export const CycleContext = createContext<{ cycleData: TodayCycleResponse | null }>({
  cycleData: null,
})

export const useCycleContext = () => useContext(CycleContext)
