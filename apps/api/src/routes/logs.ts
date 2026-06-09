import type { FastifyPluginAsync } from 'fastify'
import { differenceInDays } from 'date-fns'
import { getPhaseForDay } from '@lunari/phase-data'
import { sendError } from '../lib/errors'

interface LogBody {
  symptoms?: string[]
  journalNote?: string
  mood?: number
  energyLevel?: number
  sleepHours?: number
  waterGlasses?: number
}

const logsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: LogBody }>(
    '/me/logs',
    { preHandler: [fastify.verifyAuth] },
    async (request, reply) => {
      const { symptoms = [], journalNote = '', mood, energyLevel, sleepHours, waterGlasses } =
        request.body ?? {}

      // Derive cycle day from latest cycle
      const cycle = await fastify.prisma.cycle.findFirst({
        where: { userId: request.user.id },
        orderBy: { createdAt: 'desc' },
      })

      let cycleDay = 1
      if (cycle) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const start = new Date(cycle.startDate)
        start.setHours(0, 0, 0, 0)
        cycleDay = (differenceInDays(today, start) % cycle.cycleLength) + 1
      }

      const phase = getPhaseForDay(cycleDay)

      const log = await fastify.prisma.symptomLog.create({
        data: {
          userId: request.user.id,
          cycleDay,
          phase: phase.id,
          symptoms,
          journalNote,
          ...(mood !== undefined && { mood }),
          ...(energyLevel !== undefined && { energyLevel }),
          ...(sleepHours !== undefined && { sleepHours }),
          ...(waterGlasses !== undefined && { waterGlasses }),
        },
      })

      return reply.status(201).send(log)
    }
  )

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
