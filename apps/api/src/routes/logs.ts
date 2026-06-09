import type { FastifyPluginAsync } from 'fastify'
import { notImplemented } from '../lib/errors'

const logsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/me/logs', { preHandler: [fastify.verifyAuth] }, async (_request, reply) => {
    notImplemented(reply)
  })

  fastify.get('/me/logs', { preHandler: [fastify.verifyAuth] }, async (_request, reply) => {
    notImplemented(reply)
  })

  fastify.get('/me/logs/:id', { preHandler: [fastify.verifyAuth] }, async (_request, reply) => {
    notImplemented(reply)
  })

  fastify.delete(
    '/me/logs/:id',
    { preHandler: [fastify.verifyAuth] },
    async (_request, reply) => {
      notImplemented(reply)
    }
  )
}

export default logsRoutes
