import type { FastifyPluginAsync } from 'fastify'
import { computeNotifications } from '@lunari/phase-data'
import type { NotificationPrefs } from '@lunari/types'
import { loadEffectiveCycle } from '../lib/cycleDay'

const notificationRoutes: FastifyPluginAsync = async (fastify) => {
  // Today's derived nudges — computed on demand from the effective cycle + prefs.
  // NOTHING is stored; this is the read side of the smart-notification engine.
  fastify.get('/me/notifications', { preHandler: [fastify.verifyAuth] }, async (request, reply) => {
    const userId = request.user.id

    const [eff, user] = await Promise.all([
      loadEffectiveCycle(fastify.prisma, userId),
      fastify.prisma.user.findUnique({
        where: { id: userId },
        select: { notificationPrefs: true },
      }),
    ])

    // No cycle yet → nothing to nudge about.
    if (!eff) return reply.send([])

    const prefs = (user?.notificationPrefs ?? {}) as unknown as NotificationPrefs
    return reply.send(computeNotifications(eff, prefs, new Date()))
  })
}

export default notificationRoutes
