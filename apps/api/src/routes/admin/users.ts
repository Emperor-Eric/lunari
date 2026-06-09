import type { FastifyPluginAsync } from 'fastify'
import { notImplemented } from '../../lib/errors'

const adminUsersRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/users', { preHandler: [fastify.verifyAuth] }, async (_request, reply) => {
    notImplemented(reply)
  })
}

export default adminUsersRoutes
