import type { FastifyPluginAsync } from 'fastify'
import { notImplemented } from '../lib/errors'

const phasesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/phases', async (_request, reply) => {
    notImplemented(reply)
  })

  fastify.get('/phases/:phaseId', async (_request, reply) => {
    notImplemented(reply)
  })

  fastify.get('/phases/:phaseId/workouts', async (_request, reply) => {
    notImplemented(reply)
  })

  fastify.get('/phases/:phaseId/nutrition', async (_request, reply) => {
    notImplemented(reply)
  })
}

export default phasesRoutes
