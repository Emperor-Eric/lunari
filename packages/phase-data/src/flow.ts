import type { FlowValue } from '@lunari/types'

// Daily flow-intensity options in ascending order — the single source shared by the
// Log form, the Today quick surface, the API validation, and the calendar marker.
export const FLOW_OPTIONS: { value: FlowValue; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'spotting', label: 'Spotting' },
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'heavy', label: 'Heavy' },
]

/** 0..4 intensity index (none = 0 … heavy = 4). null/unknown → 0. Drives the UI cue. */
export function flowIntensity(flow: FlowValue | null | undefined): number {
  if (!flow) return 0
  const i = FLOW_OPTIONS.findIndex((o) => o.value === flow)
  return i < 0 ? 0 : i
}

/** Runtime guard for the API — accept only known flow values. */
export function isFlowValue(v: unknown): v is FlowValue {
  return typeof v === 'string' && FLOW_OPTIONS.some((o) => o.value === v)
}
