import type { FastifyPluginAsync } from 'fastify'
import { notImplemented } from '../lib/errors'

const meRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/me', { preHandler: [fastify.verifyAuth] }, async (_request, reply) => {
    notImplemented(reply)
  })

  fastify.patch('/me', { preHandler: [fastify.verifyAuth] }, async (_request, reply) => {
    notImplemented(reply)
  })
}

export default meRoutes
