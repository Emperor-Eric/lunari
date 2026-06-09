import type { FastifyPluginAsync } from 'fastify'
import { differenceInDays, parseISO } from 'date-fns'
import { getPhaseForDay, getCurrentContainer } from '@lunari/phase-data'
import { sendError } from '../lib/errors'

const cycleRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: { startDate: string; cycleLength?: number } }>(
    '/me/cycle',
    { preHandler: [fastify.verifyAuth] },
    async (request, reply) => {
      const { startDate, cycleLength = 28 } = request.body ?? {}
      if (!startDate) return sendError(reply, 400, 'startDate is required')

      const cycle = await fastify.prisma.cycle.upsert({
        where: { userId: request.user.id },
        create: {
          userId: request.user.id,
          startDate: new Date(startDate),
          cycleLength,
        },
        update: {
          startDate: new Date(startDate),
          cycleLength,
        },
      })

      // Mark user as onboarded if not yet
      await fastify.prisma.user.updateMany({
        where: { id: request.user.id, onboardedAt: null },
        data: { onboardedAt: new Date() },
      })

      return reply.status(201).send(cycle)
    }
  )

  fastify.get('/me/cycle/today', { preHandler: [fastify.verifyAuth] }, async (request, reply) => {
    const cycle = await fastify.prisma.cycle.findFirst({
      where: { userId: request.user.id },
      orderBy: { createdAt: 'desc' },
    })
    if (!cycle) return sendError(reply, 404, 'No cycle found. Complete onboarding first.')

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const start = new Date(cycle.startDate)
    start.setHours(0, 0, 0, 0)

    const diffDays = differenceInDays(today, start)
    const day = (diffDays % cycle.cycleLength) + 1

    const phase = getPhaseForDay(day)
    const container = getCurrentContainer(day)

    return reply.send({
      day,
      phase: phase.id,
      phaseName: phase.name,
      phaseColor: phase.color,
      containerNumber: container.containerNumber,
      daysRemainingInPhase: container.daysRemaining,
      isLastDayOfPhase: container.isLastDay,
      isLastDayOfCycle: day === cycle.cycleLength,
    })
  })

  fastify.get('/me/cycle/calendar', { preHandler: [fastify.verifyAuth] }, async (request, reply) => {
    const cycle = await fastify.prisma.cycle.findFirst({
      where: { userId: request.user.id },
      orderBy: { createdAt: 'desc' },
    })
    if (!cycle) return sendError(reply, 404, 'No cycle found')

    const logs = await fastify.prisma.symptomLog.findMany({
      where: { userId: request.user.id },
      select: { cycleDay: true },
    })
    const logDays = new Set(logs.map((l: { cycleDay: number }) => l.cycleDay))

    const calendar = Array.from({ length: cycle.cycleLength }, (_, i) => {
      const day = i + 1
      const phase = getPhaseForDay(day)
      return {
        day,
        phase: phase.id,
        phaseColor: phase.color,
        hasLog: logDays.has(day),
      }
    })

    return reply.send(calendar)
  })
}

export default cycleRoutes

// Add unique constraint for upsert (Prisma workaround — schema updated separately)
declare module '@prisma/client' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Prisma {
    interface CycleWhereUniqueInput {
      userId?: string
    }
  }
}
