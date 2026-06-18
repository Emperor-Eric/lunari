import type { FastifyPluginAsync } from 'fastify'
import { getCycleRhythm } from '@lunari/phase-data'
import type { PhaseId, InsightsResponse, InsightsPhasePattern } from '@lunari/types'

// Phases in cycle order — patterns are always returned for all four.
const PHASES: PhaseId[] = ['menstrual', 'follicular', 'ovulatory', 'luteal']
const WINDOW_DAYS = 14

/** Calendar date (YYYY-MM-DD) of a stored value. */
function ymd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Mean rounded to 1 dp, or null when there's nothing to average. */
function avg(xs: number[]): number | null {
  if (xs.length === 0) return null
  return Math.round((xs.reduce((s, n) => s + n, 0) / xs.length) * 10) / 10
}

const insightsRoutes: FastifyPluginAsync = async (fastify) => {
  // Aggregates the user's logged data into body-literacy patterns. Read-only; it never
  // touches the recalibration engine or the period/log write flows.
  fastify.get('/me/insights', { preHandler: [fastify.verifyAuth] }, async (request, reply) => {
    const userId = request.user.id

    const [events, logs] = await Promise.all([
      fastify.prisma.periodEvent.findMany({
        where: { userId },
        orderBy: { startDate: 'asc' },
        select: { startDate: true, endDate: true },
      }),
      fastify.prisma.symptomLog.findMany({
        where: { userId },
        select: { phase: true, symptoms: true, mood: true, energyLevel: true, loggedAt: true },
      }),
    ])

    // ─── A) CYCLE RHYTHM — reuse the learned-length math from phase-data ───────────
    const rhythm = getCycleRhythm(
      events.map((e) => ({
        startDate: ymd(e.startDate),
        endDate: e.endDate ? ymd(e.endDate) : null,
      }))
    )

    // ─── B) BY-PHASE PATTERNS — group symptom logs by phase ───────────────────────
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
    }

    return reply.send(response)
  })
}

export default insightsRoutes
