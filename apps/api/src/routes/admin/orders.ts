import type { FastifyPluginAsync } from 'fastify'
import { notImplemented } from '../../lib/errors'

const adminOrdersRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/orders', { preHandler: [fastify.verifyAuth] }, async (_request, reply) => {
    notImplemented(reply)
  })

  fastify.patch(
    '/admin/orders/:id',
    { preHandler: [fastify.verifyAuth] },
    async (_request, reply) => {
      notImplemented(reply)
    }
  )
}

export default adminOrdersRoutes
