import type { FastifyPluginAsync } from 'fastify'
import { differenceInDays } from 'date-fns'
import { getPhaseForDay, getCurrentContainer } from '@lunari/phase-data'
import { sendError } from '../lib/errors'

const cycleRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: { startDate: string; cycleLength?: number; periodLength?: number } }>(
    '/me/cycle',
    { preHandler: [fastify.verifyAuth] },
    async (request, reply) => {
      const { startDate, cycleLength = 28, periodLength = 5 } = request.body ?? {}
      if (!startDate) return sendError(reply, 400, 'startDate is required')

      const cycle = await fastify.prisma.cycle.upsert({
        where: { userId: request.user.id },
        create: {
          userId: request.user.id,
          startDate: new Date(startDate),
          cycleLength,
          periodLength,
        },
        update: {
          startDate: new Date(startDate),
          cycleLength,
          periodLength,
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

  // Raw cycle settings — the inputs to client-side prediction + calendar.
  fastify.get('/me/cycle', { preHandler: [fastify.verifyAuth] }, async (request, reply) => {
    const cycle = await fastify.prisma.cycle.findFirst({
      where: { userId: request.user.id },
      orderBy: { createdAt: 'desc' },
    })
    if (!cycle) return sendError(reply, 404, 'No cycle found. Complete onboarding first.')

    return reply.send({
      startDate: cycle.startDate.toISOString().slice(0, 10),
      cycleLength: cycle.cycleLength,
      periodLength: cycle.periodLength,
    })
  })

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
    const day = ((diffDays % cycle.cycleLength) + cycle.cycleLength) % cycle.cycleLength + 1

    // Proportional phase model — accurate for any cycle/period length.
    const phase = getPhaseForDay(day, cycle.cycleLength, cycle.periodLength)
    const container = getCurrentContainer(day, cycle.cycleLength, cycle.periodLength)

    return reply.send({
      day,
      phase: phase.id,
      phaseName: phase.name,
      phaseColor: phase.color,
      containerNumber: container.containerNumber,
      daysRemainingInPhase: container.daysRemaining,
      isLastDayOfPhase: container.isLastDay,
      isLastDayOfCycle: day === cycle.cycleLength,
      cycleLength: cycle.cycleLength,
      periodLength: cycle.periodLength,
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
      const phase = getPhaseForDay(day, cycle.cycleLength, cycle.periodLength)
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
