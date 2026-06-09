import type { FastifyPluginAsync } from 'fastify'
import { sendError } from '../lib/errors'

const meRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/me', { preHandler: [fastify.verifyAuth] }, async (request, reply) => {
    const user = await fastify.prisma.user.findUnique({
      where: { id: request.user.id },
    })
    if (!user) return sendError(reply, 404, 'User not found')
    return reply.send(user)
  })

  fastify.patch<{
    Body: {
      name?: string
      notificationPrefs?: { dailyReminder: boolean; reminderTime: string }
    }
  }>('/me', { preHandler: [fastify.verifyAuth] }, async (request, reply) => {
    const { name, notificationPrefs } = request.body ?? {}

    const updated = await fastify.prisma.user.update({
      where: { id: request.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(notificationPrefs !== undefined && { notificationPrefs }),
      },
    })

    return reply.send(updated)
  })
}

export default meRoutes
