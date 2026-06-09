import type { FastifyPluginAsync } from 'fastify'
import { notImplemented } from '../lib/errors'

const productsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/products', async (_request, reply) => {
    notImplemented(reply)
  })
}

export default productsRoutes
