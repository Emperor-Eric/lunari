import type { FastifyPluginAsync } from 'fastify'
import { getDayInCycle, getPhaseForDay } from '@lunari/phase-data'
import type { PhaseId } from '@lunari/types'
import { verifyAdmin } from '../../middleware/admin'
import { sendError } from '../../lib/errors'
import { sendCsv } from '../../lib/csv'

const REVENUE_STATUSES = ['paid', 'fulfilled']

// ─── date helpers ─────────────────────────────────────────────────────────────
function ymd(d: Date): string {
  return d.toISOString().slice(0, 10)
}
function ym(d: Date): string {
  return d.toISOString().slice(0, 7)
}
function startOfMonth(): Date {
  const d = new Date()
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
}
/** Last n calendar days as YYYY-MM-DD, oldest → newest (inclusive of today). */
function lastNDays(n: number): string[] {
  const out: string[] = []
  const today = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setUTCDate(d.getUTCDate() - i)
    out.push(ymd(d))
  }
  return out
}
/** Last n months as YYYY-MM, oldest → newest (inclusive of current month). */
function lastNMonths(n: number): string[] {
  const out: string[] = []
  const today = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i, 1))
    out.push(ym(d))
  }
  return out
}

const adminAnalyticsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.verifyAuth)
  fastify.addHook('preHandler', verifyAdmin)

  // ─── revenue ────────────────────────────────────────────────────────────────
  async function computeRevenue() {
    const revenueWhere = { status: { in: REVENUE_STATUSES } }

    const [agg, monthAgg, orders] = await Promise.all([
      fastify.prisma.order.aggregate({
        where: revenueWhere,
        _sum: { totalCents: true },
        _count: true,
      }),
      fastify.prisma.order.aggregate({
        where: { ...revenueWhere, createdAt: { gte: startOfMonth() } },
        _sum: { totalCents: true },
      }),
      fastify.prisma.order.findMany({
        where: {
          ...revenueWhere,
          createdAt: { gte: new Date(Date.now() - 366 * 24 * 60 * 60 * 1000) },
        },
        select: { totalCents: true, createdAt: true },
      }),
    ])

    const totalRevenue = agg._sum.totalCents ?? 0
    const orderCount = agg._count
    const monthRevenue = monthAgg._sum.totalCents ?? 0
    const avgOrderValue = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0

    const dayBuckets: Record<string, number> = Object.fromEntries(lastNDays(30).map((d) => [d, 0]))
    const monthBuckets: Record<string, number> = Object.fromEntries(
      lastNMonths(12).map((m) => [m, 0])
    )
    for (const o of orders) {
      const d = ymd(o.createdAt)
      const m = ym(o.createdAt)
      if (d in dayBuckets) dayBuckets[d] += o.totalCents
      if (m in monthBuckets) monthBuckets[m] += o.totalCents
    }

    return {
      totalRevenue,
      monthRevenue,
      avgOrderValue,
      dailyRevenue: Object.entries(dayBuckets).map(([date, amount]) => ({ date, amount })),
      monthlyRevenue: Object.entries(monthBuckets).map(([month, amount]) => ({ month, amount })),
    }
  }

  // ─── users ──────────────────────────────────────────────────────────────────
  async function computeUsers() {
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [totalUsers, newUsersMonth, activeUsers, signups] = await Promise.all([
      fastify.prisma.user.count(),
      fastify.prisma.user.count({ where: { createdAt: { gte: startOfMonth() } } }),
      fastify.prisma.user.findMany({
        where: { lastActiveAt: { gte: since30 } },
        select: { lastActiveAt: true },
      }),
      fastify.prisma.user.findMany({
        where: { createdAt: { gte: since30 } },
        select: { createdAt: true },
      }),
    ])

    const activeBuckets: Record<string, number> = Object.fromEntries(
      lastNDays(30).map((d) => [d, 0])
    )
    for (const u of activeUsers) {
      if (!u.lastActiveAt) continue
      const d = ymd(u.lastActiveAt)
      if (d in activeBuckets) activeBuckets[d] += 1
    }

    const signupBuckets: Record<string, number> = Object.fromEntries(
      lastNDays(30).map((d) => [d, 0])
    )
    for (const u of signups) {
      const d = ymd(u.createdAt)
      if (d in signupBuckets) signupBuckets[d] += 1
    }

    // 7-day DAU average from the last 7 active-day buckets
    const last7 = lastNDays(7)
    const dau7Sum = last7.reduce((sum, d) => sum + (activeBuckets[d] ?? 0), 0)
    const dau7dayAvg = Math.round(dau7Sum / 7)

    return {
      totalUsers,
      newUsersMonth,
      dau7dayAvg,
      dailyActiveUsers: Object.entries(activeBuckets).map(([date, count]) => ({ date, count })),
      dailySignups: Object.entries(signupBuckets).map(([date, count]) => ({ date, count })),
    }
  }

  // ─── symptoms (anonymised) ────────────────────────────────────────────────────
  async function computeSymptoms() {
    const [cycles, logs] = await Promise.all([
      fastify.prisma.cycle.findMany({ select: { startDate: true, cycleLength: true, periodLength: true } }),
      fastify.prisma.symptomLog.findMany({ select: { symptoms: true } }),
    ])

    const phaseDistribution: Record<PhaseId, number> = {
      menstrual: 0,
      follicular: 0,
      ovulatory: 0,
      luteal: 0,
    }
    for (const c of cycles) {
      const day = getDayInCycle(ymd(c.startDate), undefined, c.cycleLength)
      phaseDistribution[getPhaseForDay(day, c.cycleLength, c.periodLength).id] += 1
    }

    const counts: Record<string, number> = {}
    for (const log of logs) {
      for (const s of log.symptoms) {
        counts[s] = (counts[s] ?? 0) + 1
      }
    }
    const topSymptoms = Object.entries(counts)
      .map(([symptom, count]) => ({ symptom, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return { phaseDistribution, topSymptoms }
  }

  fastify.get('/admin/analytics/revenue', async (_request, reply) => {
    return reply.send(await computeRevenue())
  })

  fastify.get('/admin/analytics/users', async (_request, reply) => {
    return reply.send(await computeUsers())
  })

  fastify.get('/admin/analytics/symptoms', async (_request, reply) => {
    return reply.send(await computeSymptoms())
  })

  fastify.get<{ Querystring: { type?: string } }>(
    '/admin/analytics/export',
    async (request, reply) => {
      const type = request.query.type ?? 'revenue'

      if (type === 'revenue') {
        const { dailyRevenue } = await computeRevenue()
        return sendCsv(reply, 'lunari-revenue.csv', dailyRevenue, ['date', 'amount'])
      }
      if (type === 'users') {
        const { dailyActiveUsers, dailySignups } = await computeUsers()
        const signupByDate: Record<string, number> = Object.fromEntries(
          dailySignups.map((s) => [s.date, s.count])
        )
        const rows = dailyActiveUsers.map((a) => ({
          date: a.date,
          activeUsers: a.count,
          signups: signupByDate[a.date] ?? 0,
        }))
        return sendCsv(reply, 'lunari-users.csv', rows, ['date', 'activeUsers', 'signups'])
      }
      if (type === 'symptoms') {
        const { topSymptoms } = await computeSymptoms()
        return sendCsv(reply, 'lunari-symptoms.csv', topSymptoms, ['symptom', 'count'])
      }

      return sendError(reply, 400, 'Invalid export type. Use revenue | users | symptoms.')
    }
  )
}

export default adminAnalyticsRoutes
