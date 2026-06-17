import type { PeriodEvent } from '@lunari/types'

// Single source of truth for the period-logging rules, shared by the Today button
// (LogPeriodCard) and the Calendar so they can never diverge.

export const OPEN_PERIOD_WINDOW_DAYS = 12 // a start with no end within this many days = "open"
export const MAX_LOGGED_RUN_DAYS = 10 // cap an open period's logged marker so a forgotten end doesn't run forever

const MS = 86400000

function parseYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function toYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

/** Absolute whole-day distance between two YYYY-MM-DD dates. */
export function daysBetweenYmd(a: string, b: string): number {
  return Math.abs(Math.round((parseYmd(a).getTime() - parseYmd(b).getTime()) / MS))
}
function addDaysYmd(s: string, n: number): string {
  const d = parseYmd(s)
  d.setDate(d.getDate() + n)
  return toYmd(d)
}

type Ev = Pick<PeriodEvent, 'id' | 'startDate' | 'endDate'>

/** Most recent OPEN period (start, no end) within the open window. `events` newest-first. */
export function getOpenPeriod<T extends Ev>(events: T[], today: string): T | null {
  return events.find((e) => !e.endDate && daysBetweenYmd(today, e.startDate) <= OPEN_PERIOD_WINDOW_DAYS) ?? null
}

/** Inclusive [start..end] of a logged period; an open period runs start..today (capped). */
function eventRange(e: Ev, today: string): { start: string; end: string } {
  if (e.endDate) return { start: e.startDate, end: e.endDate }
  const run = Math.min(daysBetweenYmd(today, e.startDate) + 1, MAX_LOGGED_RUN_DAYS)
  return { start: e.startDate, end: addDaysYmd(e.startDate, run - 1) }
}

/** Set of YYYY-MM-DD days that belong to a logged period (drives the solid marker). */
export function loggedPeriodDays(events: Ev[], today: string): Set<string> {
  const set = new Set<string>()
  for (const e of events) {
    const { start, end } = eventRange(e, today)
    let d = start
    for (let i = 0; d <= end && i < 60; i++) {
      set.add(d)
      d = addDaysYmd(d, 1)
    }
  }
  return set
}

/** Whether logging a START on `date` should trip the <10-day "log anyway?" guard. */
export function needsStartGuard(events: Ev[], date: string): boolean {
  const mostRecent = events[0]
  return mostRecent ? daysBetweenYmd(date, mostRecent.startDate) < 10 : false
}

export type CalendarTap =
  | { kind: 'none' } // future / nothing actionable
  | { kind: 'start'; date: string; guard: boolean } // POST a start (guard → confirm <10-day)
  | { kind: 'end'; id: string; date: string } // PATCH endDate on the open period
  | { kind: 'remove'; id: string } // DELETE the event
  | { kind: 'clearEnd'; id: string } // PATCH endDate=null (reopen)

/**
 * Context-aware decision for tapping a calendar date — mirrors the Today button.
 * `events` must be newest-first (as GET /me/period-events returns).
 */
export function resolveCalendarTap(events: Ev[], today: string, date: string): CalendarTap {
  if (date > today) return { kind: 'none' }

  const open = getOpenPeriod(events, today)
  const owner = events.find((e) => {
    const { start, end } = eventRange(e, today)
    return date >= start && date <= end
  })

  if (open) {
    if (date === open.startDate) return { kind: 'remove', id: open.id } // undo the open start
    if (date > open.startDate && (!owner || owner.id === open.id)) {
      return { kind: 'end', id: open.id, date } // mark ended here
    }
    if (owner && owner.id !== open.id) {
      return owner.endDate === date ? { kind: 'clearEnd', id: owner.id } : { kind: 'remove', id: owner.id }
    }
    return { kind: 'none' } // before the open start & not logged → nothing while a period is open
  }

  if (owner) {
    return owner.endDate === date ? { kind: 'clearEnd', id: owner.id } : { kind: 'remove', id: owner.id }
  }
  return { kind: 'start', date, guard: needsStartGuard(events, date) }
}
