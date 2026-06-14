import type { FastifyPluginAsync } from 'fastify'
import { sendError } from '../lib/errors'

/** Calendar date (YYYY-MM-DD) of a stored @db.Date value. */
function ymd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function todayYmd(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

interface EventRow {
  id: string
  userId: string
  startDate: Date
  createdAt: Date
}

const serialize = (e: EventRow) => ({
  id: e.id,
  userId: e.userId,
  startDate: ymd(e.startDate),
  createdAt: e.createdAt.toISOString(),
})

const periodEventRoutes: FastifyPluginAsync = async (fastify) => {
  // Log a real bleed start. Rejects future dates; dedupes same-day entries.
  fastify.post<{ Body: { startDate?: string } }>(
    '/me/period-events',
    { preHandler: [fastify.verifyAuth] },
    async (request, reply) => {
      const raw = (request.body?.startDate ?? '').slice(0, 10)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        return sendError(reply, 400, 'startDate (YYYY-MM-DD) is required')
      }
      if (raw > todayYmd()) {
        return sendError(reply, 400, 'startDate cannot be in the future')
      }

      const date = new Date(raw) // @db.Date — midnight UTC

      // Dedupe: one event per calendar date.
      const existing = await fastify.prisma.periodEvent.findFirst({
        where: { userId: request.user.id, startDate: date },
      })
      if (existing) return reply.status(200).send(serialize(existing))

      const event = await fastify.prisma.periodEvent.create({
        data: { userId: request.user.id, startDate: date },
      })

      await fastify.prisma.user
        .update({ where: { id: request.user.id }, data: { lastActiveAt: new Date() } })
        .catch(() => {})

      return reply.status(201).send(serialize(event))
    }
  )

  // List logged starts, most recent first.
  fastify.get('/me/period-events', { preHandler: [fastify.verifyAuth] }, async (request, reply) => {
    const events = await fastify.prisma.periodEvent.findMany({
      where: { userId: request.user.id },
      orderBy: { startDate: 'desc' },
    })
    return reply.send(events.map(serialize))
  })

  // Delete a logged start (undo / correction).
  fastify.delete<{ Params: { id: string } }>(
    '/me/period-events/:id',
    { preHandler: [fastify.verifyAuth] },
    async (request, reply) => {
      const event = await fastify.prisma.periodEvent.findFirst({
        where: { id: request.params.id, userId: request.user.id },
      })
      if (!event) return sendError(reply, 404, 'Period event not found')

      await fastify.prisma.periodEvent.delete({ where: { id: request.params.id } })
      return reply.status(204).send()
    }
  )
}

export default periodEventRoutes
