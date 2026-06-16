import { differenceInDays } from 'date-fns'
import { getPhaseForDay, getEffectiveCycle } from '@lunari/phase-data'
import type { EffectiveCycle } from '@lunari/phase-data'
import type { Phase } from '@lunari/types'
import type { PrismaClient } from '@prisma/client'

/** Calendar date (YYYY-MM-DD) of a stored @db.Date value. */
function ymd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Parse "YYYY-MM-DD" as LOCAL midnight. */
function parseLocalYMD(s: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  const d = new Date(s)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Local-midnight bounds of "today" — the SAME day notion `/me/cycle/today` uses.
 * Used to key one symptom-log entry per calendar day.
 */
export function todayRange(now: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start, end }
}

/**
 * Loads the user's onboarding Cycle + logged period events and returns the
 * EFFECTIVE cycle (recalibrated) — the single thing predictions read. Null when
 * the user has no cycle yet. The Cycle row is never mutated.
 */
export async function loadEffectiveCycle(
  prisma: PrismaClient,
  userId: string
): Promise<EffectiveCycle | null> {
  const cycle = await prisma.cycle.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
  if (!cycle) return null

  const events = await prisma.periodEvent.findMany({
    where: { userId },
    orderBy: { startDate: 'desc' },
  })

  return getEffectiveCycle(
    { startDate: ymd(cycle.startDate), cycleLength: cycle.cycleLength, periodLength: cycle.periodLength },
    events.map((e) => ({ startDate: ymd(e.startDate), endDate: e.endDate ? ymd(e.endDate) : null }))
  )
}

/**
 * Current cycle day (1-based) + phase from the EFFECTIVE cycle. Falls back to
 * day 1 / menstrual when there's no cycle yet.
 */
export function cycleDayAndPhase(
  eff: EffectiveCycle | null,
  now: Date = new Date()
): { cycleDay: number; phase: Phase } {
  if (!eff) return { cycleDay: 1, phase: getPhaseForDay(1) }

  const today = todayRange(now).start
  const start = parseLocalYMD(eff.anchorDate)
  const len = eff.cycleLength
  const cycleDay = (((differenceInDays(today, start) % len) + len) % len) + 1
  // Current cycle → pinned menstrual length (actual logged end when present).
  const phase = getPhaseForDay(cycleDay, eff.cycleLength, eff.currentPeriodLength)
  return { cycleDay, phase }
}
