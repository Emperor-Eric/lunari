import type { FastifyPluginAsync } from 'fastify'
import { getAllPhases, getPhaseById } from '@lunari/phase-data'
import { sendError } from '../lib/errors'
import type { PhaseId } from '@lunari/types'

const VALID_PHASE_IDS: PhaseId[] = ['menstrual', 'follicular', 'ovulatory', 'luteal']

const phasesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/phases', async (_request, reply) => {
    return reply.send(getAllPhases())
  })

  fastify.get<{ Params: { phaseId: string } }>(
    '/phases/:phaseId',
    async (request, reply) => {
      const { phaseId } = request.params
      if (!VALID_PHASE_IDS.includes(phaseId as PhaseId)) {
        return sendError(reply, 404, `Unknown phase: ${phaseId}`)
      }
      return reply.send(getPhaseById(phaseId as PhaseId))
    }
  )

  fastify.get<{ Params: { phaseId: string } }>(
    '/phases/:phaseId/workouts',
    async (request, reply) => {
      const { phaseId } = request.params
      if (!VALID_PHASE_IDS.includes(phaseId as PhaseId)) {
        return sendError(reply, 404, `Unknown phase: ${phaseId}`)
      }
      const phase = getPhaseById(phaseId as PhaseId)
      return reply.send({ workouts: phase.workouts, avoidWorkouts: phase.avoidWorkouts })
    }
  )

  fastify.get<{ Params: { phaseId: string } }>(
    '/phases/:phaseId/nutrition',
    async (request, reply) => {
      const { phaseId } = request.params
      if (!VALID_PHASE_IDS.includes(phaseId as PhaseId)) {
        return sendError(reply, 404, `Unknown phase: ${phaseId}`)
      }
      const phase = getPhaseById(phaseId as PhaseId)
      return reply.send({ foods: phase.foods, supplements: phase.supplements })
    }
  )
}

export default phasesRoutes
