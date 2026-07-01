import type { FastifyPluginAsync } from 'fastify'
import { getCycleRhythm, getEffectiveCycle, phasePositionForCycleDay } from '@lunari/phase-data'
import type {
  PhaseId,
  InsightsResponse,
  InsightsPhasePattern,
  SymptomTimingPattern,
  InsightsCorrelation,
  InsightsCycleTrend,
} from '@lunari/types'

// Phases in cycle order — patterns are always returned for all four.
const PHASES: PhaseId[] = ['menstrual', 'follicular', 'ovulatory', 'luteal']
const WINDOW_DAYS = 14

// ─── Pattern-intelligence thresholds (guard hard — noise stays locked) ─────────
const TIMING_MIN_ELIGIBLE_CYCLES = 3 // fair denominator size
const TIMING_MIN_RECUR_CYCLES = 3 // symptom must recur in >= this many cycles
const TIMING_MIN_RATIO = 0.6 // and in >= 60% of eligible cycles
const TIMING_MAX_PATTERNS = 6 // don't flood the card
const CORR_MIN_POINTS = 8 // paired data points needed
const CORR_MIN_RHO = 0.3 // |Spearman rho| to state a direction
const TREND_MIN_CYCLES = 3 // recent cycle lengths needed

// Non-none flow values become pseudo-symptoms so bleed intensity can show timing too.
const FLOW_LABEL: Record<string, string> = {
  spotting: 'Spotting',
  light: 'Light flow',
  medium: 'Medium flow',
  heavy: 'Heavy flow',
}

/** Calendar date (YYYY-MM-DD) of a stored value. */
function ymd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Whole-day number for a YYYY-MM-DD string (UTC epoch days) — for date arithmetic. */
function dayNumber(s: string): number {
  const [y, m, d] = s.split('-').map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000)
}

/** Mean rounded to 1 dp, or null when there's nothing to average. */
function avg(xs: number[]): number | null {
  if (xs.length === 0) return null
  return Math.round((xs.reduce((s, n) => s + n, 0) / xs.length) * 10) / 10
}

/** Fractional (tie-averaged) 1-based ranks — the basis for Spearman. */
function ranks(xs: number[]): number[] {
  const order = xs.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v)
  const out = new Array<number>(xs.length)
  let i = 0
  while (i < order.length) {
    let j = i
    while (j + 1 < order.length && order[j + 1].v === order[i].v) j++
    const rank = (i + j) / 2 + 1 // average rank across the tie group
    for (let k = i; k <= j; k++) out[order[k].i] = rank
    i = j + 1
  }
  return out
}

/** Spearman rank correlation of two equal-length series (Pearson on ranks). */
function spearman(xs: number[], ys: number[]): number {
  const rx = ranks(xs)
  const ry = ranks(ys)
  const n = rx.length
  const mx = rx.reduce((s, v) => s + v, 0) / n
  const my = ry.reduce((s, v) => s + v, 0) / n
  let num = 0
  let dx = 0
  let dy = 0
  for (let k = 0; k < n; k++) {
    const a = rx[k] - mx
    const b = ry[k] - my
    num += a * b
    dx += a * a
    dy += b * b
  }
  if (dx === 0 || dy === 0) return 0 // no variance → no correlation
  return num / Math.sqrt(dx * dy)
}

const insightsRoutes: FastifyPluginAsync = async (fastify) => {
  // Aggregates the user's logged data into body-literacy patterns. Read-only; it never
  // touches the recalibration engine or the period/log write flows.
  fastify.get('/me/insights', { preHandler: [fastify.verifyAuth] }, async (request, reply) => {
    const userId = request.user.id

    const [events, logs, cycle] = await Promise.all([
      fastify.prisma.periodEvent.findMany({
        where: { userId },
        orderBy: { startDate: 'asc' },
        select: { startDate: true, endDate: true },
      }),
      fastify.prisma.symptomLog.findMany({
        where: { userId },
        select: {
          phase: true,
          symptoms: true,
          mood: true,
          energyLevel: true,
          sleepHours: true,
          flow: true,
          loggedAt: true,
        },
      }),
      fastify.prisma.cycle.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    ])

    const eventInputs = events.map((e) => ({
      startDate: ymd(e.startDate),
      endDate: e.endDate ? ymd(e.endDate) : null,
    }))

    // ─── A) CYCLE RHYTHM — reuse the learned-length math from phase-data ───────────
    const rhythm = getCycleRhythm(eventInputs)

    // ─── B) BY-PHASE PATTERNS — group symptom logs by (stored) phase ──────────────
    const phasePatterns: InsightsPhasePattern[] = PHASES.map((phase) => {
      const phaseLogs = logs.filter((l) => l.phase === phase)

      const counts: Record<string, number> = {}
      for (const l of phaseLogs) for (const s of l.symptoms) counts[s] = (counts[s] ?? 0) + 1
      const topSymptoms = Object.entries(counts)
        .map(([symptom, count]) => ({ symptom, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)

      const moods = phaseLogs.map((l) => l.mood).filter((m): m is number => m != null)
      const energies = phaseLogs.map((l) => l.energyLevel).filter((e): e is number => e != null)

      return {
        phase,
        enough: phaseLogs.length >= 1,
        logCount: phaseLogs.length,
        topSymptoms,
        avgMood: avg(moods),
        avgEnergy: avg(energies),
      }
    })

    // Highest/lowest phase for a metric — only when >=2 phases have data AND they differ,
    // so the UI can say "energy peaks in X, dips in Y" without a false contrast.
    const peakDip = (
      key: 'avgMood' | 'avgEnergy'
    ): { peak: PhaseId | null; dip: PhaseId | null } => {
      const withData = phasePatterns.filter((p) => p[key] != null)
      if (withData.length < 2) return { peak: null, dip: null }
      const sorted = [...withData].sort((a, b) => (b[key] as number) - (a[key] as number))
      const top = sorted[0]
      const bottom = sorted[sorted.length - 1]
      if (top[key] === bottom[key]) return { peak: null, dip: null }
      return { peak: top.phase, dip: bottom.phase }
    }
    const energy = peakDip('avgEnergy')
    const mood = peakDip('avgMood')

    // ─── C) CONSISTENCY — distinct days logged in the last 14 ──────────────────────
    const cutoff = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000)
    const recentDays = new Set(logs.filter((l) => l.loggedAt >= cutoff).map((l) => ymd(l.loggedAt)))

    // ─── D) SYMPTOM TIMING — reconstruct cycles from period DATES (not the stored ──
    //        phase snapshot), bucket each log into a cycle + phase-half, then keep only
    //        symptoms that recur in >=60% of eligible cycles (min 3).
    const symptomTiming = computeSymptomTiming(events, logs, cycle, eventInputs)

    // ─── E) CORRELATIONS — energy↔sleep and mood↔sleep only (no fishing grid) ─────
    const correlations: InsightsCorrelation[] = [
      correlate('energy_sleep', logs, (l) => l.energyLevel),
      correlate('mood_sleep', logs, (l) => l.mood),
    ]

    // ─── F) CYCLE TREND — direction of the recent (already-filtered) cycle lengths ─
    const cycleTrend = computeCycleTrend(rhythm.recentCycleLengths, rhythm.cycleVariation)

    const response: InsightsResponse = {
      cycleRhythm: {
        enough: rhythm.hasCycleData,
        avgCycleLength: rhythm.avgCycleLength,
        cycleVariation: rhythm.cycleVariation,
        regularity: rhythm.regularity,
        recentCycleLengths: rhythm.recentCycleLengths,
        hasPeriodLength: rhythm.hasPeriodData,
        avgPeriodLength: rhythm.avgPeriodLength,
      },
      phasePatterns,
      energyPeak: energy.peak,
      energyDip: energy.dip,
      moodPeak: mood.peak,
      moodDip: mood.dip,
      consistency: { daysLogged: recentDays.size, windowDays: WINDOW_DAYS },
      symptomTiming,
      correlations,
      cycleTrend,
    }

    return reply.send(response)
  })
}

// ── helpers below operate on the fetched rows; all pure, no I/O ────────────────

type LogRow = {
  phase: string
  symptoms: string[]
  mood: number | null
  energyLevel: number | null
  sleepHours: unknown // Prisma Decimal | null
  flow: string | null
  loggedAt: Date
}
type EventRow = { startDate: Date; endDate: Date | null }
type CycleRow = { startDate: Date; cycleLength: number; periodLength: number } | null
type EventInput = { startDate: string; endDate: string | null }

function computeSymptomTiming(
  events: EventRow[],
  logs: LogRow[],
  cycle: CycleRow,
  eventInputs: EventInput[]
): SymptomTimingPattern[] {
  if (!cycle || events.length === 0) return []

  // Effective (recalibrated) geometry — reuses getEffectiveCycle; engine untouched.
  const eff = getEffectiveCycle(
    {
      startDate: cycle.startDate.toISOString().slice(0, 10),
      cycleLength: cycle.cycleLength,
      periodLength: cycle.periodLength,
    },
    eventInputs
  )

  // Cycle boundaries from the sorted period starts (each start opens a cycle; last is open).
  const starts = events.map((e) => dayNumber(e.startDate.toISOString().slice(0, 10)))

  // eligible: "phase|half" -> Set(cycleIndex with >=1 log in that phase-half)
  // recurred: "phase|half|symptom" -> Set(cycleIndex where that symptom appeared there)
  const eligible = new Map<string, Set<number>>()
  const recurred = new Map<string, Set<number>>()
  const add = (m: Map<string, Set<number>>, key: string, idx: number) => {
    let set = m.get(key)
    if (!set) m.set(key, (set = new Set()))
    set.add(idx)
  }

  for (const log of logs) {
    const logDay = dayNumber(log.loggedAt.toISOString().slice(0, 10))
    // Find the cycle this log falls in: last start <= logDay. Pre-first-period logs skip.
    let idx = -1
    for (let i = 0; i < starts.length; i++) {
      if (starts[i] <= logDay) idx = i
      else break
    }
    if (idx < 0) continue

    const cycleDay = logDay - starts[idx] + 1
    const pos = phasePositionForCycleDay(cycleDay, eff.cycleLength, eff.periodLength)
    const ph = `${pos.phase}|${pos.half}`
    add(eligible, ph, idx)

    const labels = [...log.symptoms]
    if (log.flow && FLOW_LABEL[log.flow]) labels.push(FLOW_LABEL[log.flow])
    for (const label of labels) add(recurred, `${ph}|${label}`, idx)
  }

  const out: SymptomTimingPattern[] = []
  for (const [key, cyclesSet] of recurred) {
    const [phase, half, symptom] = key.split('|') as [PhaseId, 'early' | 'late', string]
    const ofCycles = eligible.get(`${phase}|${half}`)?.size ?? 0
    const cycles = cyclesSet.size
    if (
      ofCycles >= TIMING_MIN_ELIGIBLE_CYCLES &&
      cycles >= TIMING_MIN_RECUR_CYCLES &&
      cycles / ofCycles >= TIMING_MIN_RATIO
    ) {
      out.push({ symptom, phase, half, cycles, ofCycles })
    }
  }

  // Strongest first: more recurrences, then higher ratio.
  out.sort((a, b) => b.cycles - a.cycles || b.cycles / b.ofCycles - a.cycles / a.ofCycles)
  return out.slice(0, TIMING_MAX_PATTERNS)
}

function correlate(
  pair: InsightsCorrelation['pair'],
  logs: LogRow[],
  metric: (l: LogRow) => number | null
): InsightsCorrelation {
  // Paired points = same-day logs with BOTH the metric and sleep present.
  const xs: number[] = [] // metric
  const ys: number[] = [] // sleep hours
  for (const l of logs) {
    const m = metric(l)
    const sleep = l.sleepHours == null ? null : Number(l.sleepHours)
    if (m == null || sleep == null || Number.isNaN(sleep)) continue
    xs.push(m)
    ys.push(sleep)
  }
  const n = xs.length
  if (n < CORR_MIN_POINTS) return { pair, enough: false, direction: null, strength: null, n }

  const rho = spearman(ys, xs) // corr(sleep, metric); sign is symmetric
  const strength = Math.round(rho * 100) / 100

  // Tertile sanity: mean metric in the high-sleep third vs the low-sleep third must
  // agree with rho's sign before we state a direction.
  const bySleep = xs.map((m, i) => ({ m, s: ys[i] })).sort((a, b) => a.s - b.s)
  const third = Math.max(1, Math.floor(n / 3))
  const lowMean = avg(bySleep.slice(0, third).map((p) => p.m)) ?? 0
  const highMean = avg(bySleep.slice(-third).map((p) => p.m)) ?? 0
  const consistent = Math.sign(highMean - lowMean) === Math.sign(rho)

  const direction = Math.abs(rho) >= CORR_MIN_RHO && consistent ? (rho > 0 ? 'up' : 'down') : null
  return { pair, enough: true, direction, strength, n }
}

function computeCycleTrend(lengths: number[], cycleVariation: number | null): InsightsCycleTrend {
  if (lengths.length < TREND_MIN_CYCLES) {
    return { enough: false, direction: null, lengths }
  }
  const net = lengths[lengths.length - 1] - lengths[0] // oldest -> newest
  const variation = cycleVariation ?? 0
  // Only call it a trend when the net move clears normal cycle-to-cycle variability.
  const direction = Math.abs(net) > variation ? (net > 0 ? 'lengthening' : 'shortening') : 'steady'
  return { enough: true, direction, lengths }
}

export default insightsRoutes
