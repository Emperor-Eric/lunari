import type { FastifyPluginAsync } from 'fastify'
import { notImplemented } from '../../lib/errors'

const adminInfluencersRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/admin/influencers',
    { preHandler: [fastify.verifyAuth] },
    async (_request, reply) => {
      notImplemented(reply)
    }
  )

  fastify.post(
    '/admin/influencers',
    { preHandler: [fastify.verifyAuth] },
    async (_request, reply) => {
      notImplemented(reply)
    }
  )
}

export default adminInfluencersRoutes
