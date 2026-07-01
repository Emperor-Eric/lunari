import type { Phase, PhaseId, CyclePrediction, PhaseRange } from '@lunari/types'
import { phases } from './phases'

export interface ContainerInfo {
  containerNumber: 1 | 2 | 3 | 4
  containerName: string
  phase: PhaseId
  phaseColor: string
  daysRemaining: number
  isLastDay: boolean
}

/** A phase's day window within a cycle (1-based, inclusive). */
export interface PhaseDayRange {
  phase: PhaseId
  startDay: number
  endDay: number
}

// ─── Pure date helpers (no date-fns dependency) ──────────────────────────────

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Parse "YYYY-MM-DD" as a LOCAL midnight date (avoids UTC off-by-one), or pass through a Date. */
function parseDate(input: string | Date): Date {
  if (input instanceof Date) {
    const d = new Date(input)
    d.setHours(0, 0, 0, 0)
    return d
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(input)
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  const d = new Date(input)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function diffDays(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / MS_PER_DAY)
}

function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ─── Proportional phase model ────────────────────────────────────────────────

/**
 * Computes the four phase day-windows for a cycle, scaled to the user's real
 * cycle + period length (luteal-anchored, medically standard):
 *
 *   • Menstrual  — day 1 .. periodLength
 *   • Luteal     — the last ~14 days (lutealLength = min(14, cycleLength - periodLength - 1))
 *   • Ovulation  — up to a 4-day window ending the day before luteal starts
 *   • Follicular — everything between menstrual and ovulation (stretches/shrinks with length)
 *
 * The returned ranges are contiguous and tile day 1..cycleLength with NO gaps or
 * overlaps. On very short cycles a middle phase may collapse to 0 days and is
 * omitted (coverage is still complete).
 */
export function getPhaseRanges(cycleLength = 28, periodLength = 5): PhaseDayRange[] {
  const L = Math.max(1, Math.round(cycleLength))
  const P = Math.min(Math.max(1, Math.round(periodLength)), L)

  const menEnd = P

  // Luteal ~14 days; leave a day for ovulation between menstrual and luteal when possible.
  const lutLen = Math.min(14, Math.max(1, L - P - 1))
  let lutStart = L - lutLen + 1
  if (lutStart <= menEnd) lutStart = menEnd + 1
  const hasLut = lutStart <= L

  // Ovulation: up to 4 days ending the day before luteal, never overlapping menstrual.
  const ovEnd = lutStart - 1
  const ovStart = Math.max(menEnd + 1, ovEnd - 3)
  const hasOv = ovEnd >= menEnd + 1 && ovEnd >= ovStart

  // Follicular: fills the gap between menstrual and ovulation (or luteal if no ovulation).
  const folStart = menEnd + 1
  const folEnd = (hasOv ? ovStart : lutStart) - 1
  const hasFol = folEnd >= folStart

  const ranges: PhaseDayRange[] = [{ phase: 'menstrual', startDay: 1, endDay: menEnd }]
  if (hasFol) ranges.push({ phase: 'follicular', startDay: folStart, endDay: folEnd })
  if (hasOv) ranges.push({ phase: 'ovulatory', startDay: ovStart, endDay: ovEnd })
  if (hasLut) ranges.push({ phase: 'luteal', startDay: lutStart, endDay: L })
  return ranges
}

export type PhaseHalf = 'early' | 'late'

/** Where a log sits within a phase. */
export interface PhasePosition {
  phase: PhaseId
  dayWithinPhase: number // 1-indexed, clamped to [1, phaseLength]
  phaseLength: number
  half: PhaseHalf
}

/**
 * The SINGLE source of the early/late rule: the first half of a phase (1-indexed
 * day <= ceil(phaseLength / 2)) is "early", the rest is "late". A 1-day phase is
 * "early". Inputs are clamped so out-of-range values never throw. Used by both the
 * micro-education selector and the Insights symptom-timing patterns.
 */
export function phaseHalf(dayWithinPhase: number, phaseLength: number): PhaseHalf {
  const len = Math.max(1, Math.round(phaseLength))
  const day = Math.min(Math.max(1, Math.round(dayWithinPhase)), len)
  return day <= Math.ceil(len / 2) ? 'early' : 'late'
}

/**
 * Maps a 1-based cycle day to its phase, position within that phase, and early/late
 * half — using the same proportional phase model (`getPhaseRanges`) as everything
 * else. Pure. Reused server-side to bucket historical logs by phase-half.
 */
export function phasePositionForCycleDay(
  cycleDay: number,
  cycleLength = 28,
  periodLength = 5
): PhasePosition {
  const L = Math.max(1, Math.round(cycleLength))
  const d = Math.min(Math.max(1, Math.round(cycleDay)), L)
  const ranges = getPhaseRanges(L, periodLength)
  const r = ranges.find((x) => d >= x.startDay && d <= x.endDay) ?? ranges[ranges.length - 1]
  const phaseLength = r.endDay - r.startDay + 1
  const dayWithinPhase = Math.min(Math.max(1, d - r.startDay + 1), phaseLength)
  return {
    phase: r.phase,
    dayWithinPhase,
    phaseLength,
    half: phaseHalf(dayWithinPhase, phaseLength),
  }
}

/**
 * Returns the Phase object for a given cycle day, using the proportional model.
 * Day is clamped into [1, cycleLength]. Defaults (28, 5) reproduce a standard cycle.
 */
export function getPhaseForDay(day: number, cycleLength = 28, periodLength = 5): Phase {
  const L = Math.max(1, Math.round(cycleLength))
  let d = Math.round(day)
  if (d < 1) d = 1
  if (d > L) d = L
  const ranges = getPhaseRanges(L, periodLength)
  const match = ranges.find((r) => d >= r.startDay && d <= r.endDay)
  return getPhaseById(match ? match.phase : 'luteal')
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
 * Returns the current day in the cycle (1-based) based on a cycle start date.
 * Wraps at cycleLength (default 28). Handles dates before the start date.
 *
 * @param cycleStartDate - ISO date string "YYYY-MM-DD"
 * @param today - optional ISO date string override (defaults to today)
 * @param cycleLength - cycle length in days (default 28)
 */
export function getDayInCycle(cycleStartDate: string, today?: string, cycleLength = 28): number {
  const L = Math.max(1, Math.round(cycleLength))
  const start = parseDate(cycleStartDate)
  const current = today ? parseDate(today) : parseDate(new Date())
  const total = diffDays(current, start)
  const cyclesPassed = Math.floor(total / L)
  return total - cyclesPassed * L + 1
}

/**
 * Returns container metadata for the given cycle day, using the proportional model.
 * daysRemaining / isLastDay are computed from the (real, scaled) phase window.
 */
export function getCurrentContainer(
  cycleDay: number,
  cycleLength = 28,
  periodLength = 5
): ContainerInfo {
  const L = Math.max(1, Math.round(cycleLength))
  let d = Math.round(cycleDay)
  if (d < 1) d = 1
  if (d > L) d = L
  const ranges = getPhaseRanges(L, periodLength)
  const match = ranges.find((r) => d >= r.startDay && d <= r.endDay) ?? ranges[ranges.length - 1]
  const phase = getPhaseById(match.phase)
  const daysRemaining = match.endDay - d
  return {
    containerNumber: phase.containerNumber,
    containerName: phase.name,
    phase: phase.id,
    phaseColor: phase.color,
    daysRemaining,
    isLastDay: daysRemaining === 0,
  }
}

// ─── Effective cycle (recalibration) ─────────────────────────────────────────

export interface CycleSettingsInput {
  startDate: string | Date
  cycleLength: number
  periodLength: number
}

export interface PeriodEventInput {
  startDate: string | Date
  endDate?: string | Date | null
}

export interface EffectiveCycle {
  /** ISO "YYYY-MM-DD" — the most recent logged period, else onboarding startDate. */
  anchorDate: string
  cycleLength: number
  /** Learned-average period length — used to PROJECT other/future cycles. */
  periodLength: number
  /**
   * The CURRENT cycle's menstrual length. If the anchor period has a logged end,
   * this is pinned to its actual length (so menstrual ends on the logged end);
   * otherwise it equals the learned `periodLength`.
   */
  currentPeriodLength: number
}

/**
 * Valid start-to-start gaps (whole days) between consecutive logged periods, ordered
 * oldest → newest and kept to the plausible [21, 45] range. The shared basis for both
 * the learned cycle length and the Insights "cycle rhythm" stats.
 */
export function cycleLengthGaps(periodEvents: PeriodEventInput[]): number[] {
  const dates = periodEvents
    .map((e) => parseDate(e.startDate))
    .sort((a, b) => a.getTime() - b.getTime())
  const gaps: number[] = []
  for (let i = 1; i < dates.length; i++) gaps.push(diffDays(dates[i], dates[i - 1]))
  return gaps.filter((g) => g >= 21 && g <= 45)
}

/**
 * Inclusive lengths (whole days) of ENDED logged periods (start + end logged), ordered
 * oldest → newest and kept to the plausible [2, 10] range. The shared basis for both the
 * learned period length and the Insights "period runs about N days" stat.
 */
export function endedPeriodLengths(periodEvents: PeriodEventInput[]): number[] {
  return periodEvents
    .filter((e) => e.endDate != null)
    .map((e) => ({ start: parseDate(e.startDate), end: parseDate(e.endDate as string | Date) }))
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .map((p) => diffDays(p.end, p.start) + 1)
    .filter((n) => n >= 2 && n <= 10)
}

/**
 * The SINGLE source of truth for predictions. Real logged period events override
 * the onboarding Cycle (which is never mutated):
 *   • anchorDate  = most recent period-event start; else cycleSettings.startDate.
 *   • cycleLength = LEARNED from the gaps between consecutive logged starts:
 *       keep gaps in [21, 45], use up to the 6 most recent, cycleLength = round(mean)
 *       clamped to [21, 45]; if no valid gap, fall back to cycleSettings.cycleLength.
 *   • periodLength = LEARNED from ENDED periods (start + end logged):
 *       length = endDate - startDate + 1 (inclusive); keep lengths in [2, 10], use up to
 *       the 6 most recent, periodLength = round(mean) clamped [2, 10]; else fall back to
 *       cycleSettings.periodLength.
 *   • currentPeriodLength = current-cycle menstrual length:
 *       - anchor period ENDED → pinned to its actual length (endDate - startDate + 1).
 *       - anchor period OPEN  → max(learned periodLength, days-since-start inclusive) so an
 *         ongoing period stays Menstrual through today; if it has run > 10 days (forgotten
 *         end), fall back to the learned periodLength.
 *       - no events → learned periodLength.
 *
 * @param fromDate "today" used only to extend an OPEN anchor period (defaults to now).
 */
export function getEffectiveCycle(
  settings: CycleSettingsInput,
  periodEvents: PeriodEventInput[] = [],
  fromDate: string | Date = new Date()
): EffectiveCycle {
  // Normalize + sort event start dates ascending (oldest → newest).
  const dates = periodEvents
    .map((e) => parseDate(e.startDate))
    .sort((a, b) => a.getTime() - b.getTime())

  const anchorDate = dates.length
    ? toISODate(dates[dates.length - 1])
    : toISODate(parseDate(settings.startDate))

  // cycleLength — learned from start-to-start gaps (up to 6 most recent valid).
  let cycleLength = settings.cycleLength
  const recentValid = cycleLengthGaps(periodEvents).slice(-6)
  if (recentValid.length >= 1) {
    const mean = recentValid.reduce((s, g) => s + g, 0) / recentValid.length
    cycleLength = Math.min(45, Math.max(21, Math.round(mean)))
  }

  // periodLength — learned-average from ended periods (inclusive day count). Used to
  // PROJECT future cycles.
  let periodLength = settings.periodLength
  const lengths = endedPeriodLengths(periodEvents).slice(-6)
  if (lengths.length >= 1) {
    const mean = lengths.reduce((s, n) => s + n, 0) / lengths.length
    periodLength = Math.min(10, Math.max(2, Math.round(mean)))
  }

  // currentPeriodLength — current cycle's menstrual length (see doc above).
  let currentPeriodLength = periodLength
  if (periodEvents.length) {
    const anchorEvt = [...periodEvents].sort(
      (a, b) => parseDate(b.startDate).getTime() - parseDate(a.startDate).getTime()
    )[0]
    if (anchorEvt) {
      const anchorStart = parseDate(anchorEvt.startDate)
      if (anchorEvt.endDate != null) {
        // Ended → pin menstrual to the actual logged end (inclusive).
        const len = diffDays(parseDate(anchorEvt.endDate), anchorStart) + 1
        currentPeriodLength = Math.max(1, Math.min(cycleLength, len))
      } else {
        // Open → keep menstrual through at least today (inclusive), capped at 10 days so
        // a forgotten/never-ended period doesn't lock Menstrual forever.
        const daysSinceStart = diffDays(parseDate(fromDate), anchorStart) + 1
        currentPeriodLength =
          daysSinceStart > 10
            ? periodLength
            : Math.min(cycleLength, Math.max(periodLength, daysSinceStart))
      }
    }
  }

  return { anchorDate, cycleLength, periodLength, currentPeriodLength }
}

// ─── Cycle rhythm (insights) ─────────────────────────────────────────────────

export interface CycleRhythm {
  /** True once there are >=2 logged starts producing >=1 plausible gap. */
  hasCycleData: boolean
  /** Rounded mean of recent cycle lengths, clamped [21,45]; null when insufficient. */
  avgCycleLength: number | null
  /** ± spread (days) of recent cycle lengths = round((max-min)/2); null when insufficient. */
  cycleVariation: number | null
  regularity: 'regular' | 'somewhat variable' | 'still settling' | null
  /** The recent cycle lengths themselves (up to 6, oldest → newest). */
  recentCycleLengths: number[]
  /** True once there is >=1 ended period. */
  hasPeriodData: boolean
  /** Rounded mean of recent period lengths, clamped [2,10]; null when insufficient. */
  avgPeriodLength: number | null
  recentPeriodLengths: number[]
}

/**
 * Body-literacy "cycle rhythm" stats from logged period events — reuses the exact
 * learned-length basis as `getEffectiveCycle` ([21,45] gaps, [2,10] ended lengths, up to
 * 6 most recent) and adds the spread/regularity the Insights view needs. Pure; no I/O.
 */
export function getCycleRhythm(periodEvents: PeriodEventInput[] = []): CycleRhythm {
  const recentCycleLengths = cycleLengthGaps(periodEvents).slice(-6)
  const hasCycleData = recentCycleLengths.length >= 1
  let avgCycleLength: number | null = null
  let cycleVariation: number | null = null
  let regularity: CycleRhythm['regularity'] = null
  if (hasCycleData) {
    const mean = recentCycleLengths.reduce((s, g) => s + g, 0) / recentCycleLengths.length
    avgCycleLength = Math.min(45, Math.max(21, Math.round(mean)))
    const min = Math.min(...recentCycleLengths)
    const max = Math.max(...recentCycleLengths)
    cycleVariation = Math.round((max - min) / 2)
    const spread = max - min
    regularity =
      recentCycleLengths.length < 2
        ? 'still settling' // a single gap can't show variability yet
        : spread <= 3
          ? 'regular'
          : spread <= 7
            ? 'somewhat variable'
            : 'still settling'
  }

  const recentPeriodLengths = endedPeriodLengths(periodEvents).slice(-6)
  const hasPeriodData = recentPeriodLengths.length >= 1
  let avgPeriodLength: number | null = null
  if (hasPeriodData) {
    const mean = recentPeriodLengths.reduce((s, n) => s + n, 0) / recentPeriodLengths.length
    avgPeriodLength = Math.min(10, Math.max(2, Math.round(mean)))
  }

  return {
    hasCycleData,
    avgCycleLength,
    cycleVariation,
    regularity,
    recentCycleLengths,
    hasPeriodData,
    avgPeriodLength,
    recentPeriodLengths,
  }
}

// ─── Prediction ──────────────────────────────────────────────────────────────

export interface CyclePredictionInput {
  startDate: string | Date
  cycleLength?: number
  periodLength?: number
}

/**
 * Predicts the current day/phase, the next period start, and each phase's date
 * range for the CURRENT cycle — all from the user's real cycle settings, using
 * the proportional phase model. Pure + dependency-free; reusable on web, mobile,
 * and the API. All dates are emitted as "YYYY-MM-DD" strings.
 */
export function getCyclePrediction(
  input: CyclePredictionInput,
  fromDate: string | Date = new Date()
): CyclePrediction {
  const cycleLength = Math.max(1, Math.round(input.cycleLength ?? 28))
  const periodLength = Math.min(Math.max(1, Math.round(input.periodLength ?? 5)), cycleLength)

  const start = parseDate(input.startDate)
  const from = parseDate(fromDate)

  const total = diffDays(from, start)
  const cyclesPassed = Math.floor(total / cycleLength)
  const currentCycleStart = addDays(start, cyclesPassed * cycleLength)
  const currentDay = total - cyclesPassed * cycleLength + 1
  const nextPeriodStart = addDays(currentCycleStart, cycleLength)

  const ranges = getPhaseRanges(cycleLength, periodLength)
  const currentPhase: PhaseId =
    ranges.find((r) => currentDay >= r.startDay && currentDay <= r.endDay)?.phase ?? 'luteal'

  const phaseRanges: PhaseRange[] = ranges.map((r) => ({
    phase: r.phase,
    startDay: r.startDay,
    endDay: r.endDay,
    startDate: toISODate(addDays(currentCycleStart, r.startDay - 1)),
    endDate: toISODate(addDays(currentCycleStart, r.endDay - 1)),
  }))

  return {
    currentDay,
    currentPhase,
    nextPeriodStart: toISODate(nextPeriodStart),
    cycleLength,
    periodLength,
    phaseRanges,
  }
}
