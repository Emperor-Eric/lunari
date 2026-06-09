import type { FastifyPluginAsync } from 'fastify'
import { notImplemented } from '../lib/errors'

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/auth/signup', async (_request, reply) => {
    notImplemented(reply)
  })

  fastify.post('/auth/login', async (_request, reply) => {
    notImplemented(reply)
  })

  fastify.post('/auth/logout', async (_request, reply) => {
    notImplemented(reply)
  })

  fastify.post('/auth/reset-password', async (_request, reply) => {
    notImplemented(reply)
  })
}

export default authRoutes
