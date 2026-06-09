import type { FastifyPluginAsync } from 'fastify'
import { notImplemented } from '../lib/errors'

const checkoutRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/checkout', { preHandler: [fastify.verifyAuth] }, async (_request, reply) => {
    notImplemented(reply)
  })

  fastify.post(
    '/checkout/subscription',
    { preHandler: [fastify.verifyAuth] },
    async (_request, reply) => {
      notImplemented(reply)
    }
  )

  fastify.get(
    '/me/orders',
    { preHandler: [fastify.verifyAuth] },
    async (_request, reply) => {
      notImplemented(reply)
    }
  )

  fastify.get(
    '/me/orders/:id',
    { preHandler: [fastify.verifyAuth] },
    async (_request, reply) => {
      notImplemented(reply)
    }
  )
}

export default checkoutRoutes
