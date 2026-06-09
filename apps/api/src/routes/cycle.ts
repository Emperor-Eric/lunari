import type { FastifyPluginAsync } from 'fastify'
import { notImplemented } from '../lib/errors'

const cycleRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/me/cycle', { preHandler: [fastify.verifyAuth] }, async (_request, reply) => {
    notImplemented(reply)
  })

  fastify.get(
    '/me/cycle/today',
    { preHandler: [fastify.verifyAuth] },
    async (_request, reply) => {
      notImplemented(reply)
    }
  )

  fastify.get(
    '/me/cycle/calendar',
    { preHandler: [fastify.verifyAuth] },
    async (_request, reply) => {
      notImplemented(reply)
    }
  )
}

export default cycleRoutes
