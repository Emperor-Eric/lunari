import { differenceInDays } from 'date-fns'
import { getPhaseForDay } from '@lunari/phase-data'
import type { Phase } from '@lunari/types'

export interface CycleLike {
  startDate: Date
  cycleLength: number
  periodLength: number
}

/**
 * Local-midnight bounds of "today" — the SAME day notion `/me/cycle/today` uses
 * (server local date). Used to key one log entry per calendar day.
 */
export function todayRange(now: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start, end }
}

/**
 * Current cycle day (1-based) + phase for a user's cycle, computed exactly the way
 * `/me/cycle/today` does. Falls back to day 1 / menstrual when there's no cycle yet.
 */
export function cycleDayAndPhase(
  cycle: CycleLike | null,
  now: Date = new Date()
): { cycleDay: number; phase: Phase } {
  if (!cycle) return { cycleDay: 1, phase: getPhaseForDay(1) }

  const today = todayRange(now).start
  const start = new Date(cycle.startDate)
  start.setHours(0, 0, 0, 0)

  const len = cycle.cycleLength
  const cycleDay = (((differenceInDays(today, start) % len) + len) % len) + 1
  const phase = getPhaseForDay(cycleDay, cycle.cycleLength, cycle.periodLength)
  return { cycleDay, phase }
}
