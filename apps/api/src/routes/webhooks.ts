import type { FastifyPluginAsync } from 'fastify'
import { notImplemented } from '../lib/errors'

const webhooksRoutes: FastifyPluginAsync = async (fastify) => {
  // No auth — Stripe signature verified inside handler (Phase 3)
  fastify.post('/webhooks/stripe', async (_request, reply) => {
    notImplemented(reply)
  })
}

export default webhooksRoutes
