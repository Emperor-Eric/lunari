import type { FastifyPluginAsync } from 'fastify'
import { sendError } from '../lib/errors'
import { cycleDayAndPhase, loadEffectiveCycle, todayRange } from '../lib/cycleDay'

interface LogBody {
  symptoms?: string[]
  journalNote?: string
  mood?: number
  energyLevel?: number
  sleepHours?: number
  waterGlasses?: number
}

const logsRoutes: FastifyPluginAsync = async (fastify) => {
  // Upsert TODAY's single entry for the user, MERGING — only the fields present in
  // the body are written, so a quick { symptoms } tap doesn't wipe mood/sleep/etc.
  fastify.post<{ Body: LogBody }>(
    '/me/logs',
    { preHandler: [fastify.verifyAuth] },
    async (request, reply) => {
      const body = request.body ?? {}

      const eff = await loadEffectiveCycle(fastify.prisma, request.user.id)
      const { cycleDay, phase } = cycleDayAndPhase(eff)
      const { start, end } = todayRange()

      // Only one entry per calendar day — find today's row (loggedAt within today).
      const existing = await fastify.prisma.symptomLog.findFirst({
        where: { userId: request.user.id, loggedAt: { gte: start, lt: end } },
        orderBy: { loggedAt: 'desc' },
      })

      // Fields explicitly provided in the request (merge semantics).
      const provided = {
        ...(body.symptoms !== undefined && { symptoms: body.symptoms }),
        ...(body.journalNote !== undefined && { journalNote: body.journalNote }),
        ...(body.mood !== undefined && { mood: body.mood }),
        ...(body.energyLevel !== undefined && { energyLevel: body.energyLevel }),
        ...(body.sleepHours !== undefined && { sleepHours: body.sleepHours }),
        ...(body.waterGlasses !== undefined && { waterGlasses: body.waterGlasses }),
      }

      const log = existing
        ? await fastify.prisma.symptomLog.update({
            where: { id: existing.id },
            // Always refresh cycleDay/phase to today's; merge the provided fields.
            data: { cycleDay, phase: phase.id, ...provided },
          })
        : await fastify.prisma.symptomLog.create({
            data: {
              userId: request.user.id,
              cycleDay,
              phase: phase.id,
              symptoms: body.symptoms ?? [],
              journalNote: body.journalNote ?? '',
              ...(body.mood !== undefined && { mood: body.mood }),
              ...(body.energyLevel !== undefined && { energyLevel: body.energyLevel }),
              ...(body.sleepHours !== undefined && { sleepHours: body.sleepHours }),
              ...(body.waterGlasses !== undefined && { waterGlasses: body.waterGlasses }),
            },
          })

      // Touch lastActiveAt so the admin dashboard reflects this activity.
      await fastify.prisma.user
        .update({ where: { id: request.user.id }, data: { lastActiveAt: new Date() } })
        .catch(() => {})

      return reply.status(existing ? 200 : 201).send(log)
    }
  )

  // Today's entry for the user (or null) — used to prefill Today chips + the Log form.
  fastify.get('/me/logs/today', { preHandler: [fastify.verifyAuth] }, async (request, reply) => {
    const { start, end } = todayRange()
    const log = await fastify.prisma.symptomLog.findFirst({
      where: { userId: request.user.id, loggedAt: { gte: start, lt: end } },
      orderBy: { loggedAt: 'desc' },
    })
    return reply.send(log ?? null)
  })

  fastify.get<{
    Querystring: { page?: string; perPage?: string; from?: string; to?: string }
  }>(
    '/me/logs',
    { preHandler: [fastify.verifyAuth] },
    async (request, reply) => {
      const page = parseInt(request.query.page ?? '1', 10)
      const perPage = parseInt(request.query.perPage ?? '20', 10)
      const { from, to } = request.query

      const where = {
        userId: request.user.id,
        ...(from || to
          ? {
              loggedAt: {
                ...(from && { gte: new Date(from) }),
                ...(to && { lte: new Date(to) }),
              },
            }
          : {}),
      }

      const [data, total] = await Promise.all([
        fastify.prisma.symptomLog.findMany({
          where,
          orderBy: { loggedAt: 'desc' },
          skip: (page - 1) * perPage,
          take: perPage,
        }),
        fastify.prisma.symptomLog.count({ where }),
      ])

      return reply.send({ data, total, page, perPage })
    }
  )

  fastify.get<{ Params: { id: string } }>(
    '/me/logs/:id',
    { preHandler: [fastify.verifyAuth] },
    async (request, reply) => {
      const log = await fastify.prisma.symptomLog.findFirst({
        where: { id: request.params.id, userId: request.user.id },
      })
      if (!log) return sendError(reply, 404, 'Log not found')
      return reply.send(log)
    }
  )

  fastify.delete<{ Params: { id: string } }>(
    '/me/logs/:id',
    { preHandler: [fastify.verifyAuth] },
    async (request, reply) => {
      const log = await fastify.prisma.symptomLog.findFirst({
        where: { id: request.params.id, userId: request.user.id },
      })
      if (!log) return sendError(reply, 404, 'Log not found')

      await fastify.prisma.symptomLog.delete({ where: { id: request.params.id } })
      return reply.status(204).send()
    }
  )
}

export default logsRoutes
