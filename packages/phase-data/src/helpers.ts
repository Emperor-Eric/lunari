import type { Phase, PhaseId } from '@lunari/types'
import { phases } from './phases'

/**
 * Returns the Phase object for a given cycle day (1–28).
 * Falls back to the luteal phase if day is out of range.
 */
export function getPhaseForDay(day: number): Phase {
  const phase = phases.find((p) => day >= p.cycleDays.start && day <= p.cycleDays.end)
  if (!phase) {
    // Day out of bounds — return luteal as safe fallback
    return phases.find((p) => p.id === 'luteal') as Phase
  }
  return phase
}

/**
 * Returns the Phase object for a given PhaseId.
 * Throws if the id doesn't match any phase.
 */
export function getPhaseById(id: PhaseId): Phase {
  const phase = phases.find((p) => p.id === id)
  if (!phase) {
    throw new Error(`Phase not found: ${id}`)
  }
  return phase
}

/**
 * Returns all 4 phases in cycle order.
 */
export function getAllPhases(): Phase[] {
  return phases
}

/**
 * Returns the current day in the cycle (1–28) based on a cycle start date.
 * Wraps at cycleLength (default 28).
 *
 * @param cycleStartDate - ISO date string "YYYY-MM-DD"
 * @param today - optional ISO date string override (defaults to today)
 * @param cycleLength - cycle length in days (default 28)
 */
export function getDayInCycle(
  cycleStartDate: string,
  today?: string,
  cycleLength = 28
): number {
  const start = new Date(cycleStartDate)
  const current = today ? new Date(today) : new Date()

  // Strip time component for accurate day diff
  start.setHours(0, 0, 0, 0)
  current.setHours(0, 0, 0, 0)

  const diffMs = current.getTime() - start.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  // Wrap within cycle length, returning 1-based day
  return (diffDays % cycleLength) + 1
}
