import type { FastifyPluginAsync } from 'fastify'
import { notImplemented } from '../../lib/errors'

const adminAnalyticsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/admin/analytics',
    { preHandler: [fastify.verifyAuth] },
    async (_request, reply) => {
      notImplemented(reply)
    }
  )
}

export default adminAnalyticsRoutes
