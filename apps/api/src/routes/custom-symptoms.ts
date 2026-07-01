import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { sendError } from '../lib/errors'

const MAX_LABEL = 30

const createSchema = z.object({
  label: z.string().trim().min(1, 'Enter a symptom name').max(MAX_LABEL, 'Too long'),
})
const patchSchema = z.object({
  label: z.string().trim().min(1).max(MAX_LABEL).optional(),
  archived: z.boolean().optional(),
})

interface Row {
  id: string
  userId: string
  label: string
  archived: boolean
  sortOrder: number
  createdAt: Date
}
const serialize = (c: Row) => ({
  id: c.id,
  userId: c.userId,
  label: c.label,
  archived: c.archived,
  sortOrder: c.sortOrder,
  createdAt: c.createdAt.toISOString(),
})

const customSymptomRoutes: FastifyPluginAsync = async (fastify) => {
  // List the user's custom symptoms — non-archived first, then by sort order.
  fastify.get(
    '/me/custom-symptoms',
    { preHandler: [fastify.verifyAuth] },
    async (request, reply) => {
      const items = await fastify.prisma.customSymptom.findMany({
        where: { userId: request.user.id },
        orderBy: [{ archived: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
      })
      return reply.send(items.map(serialize))
    }
  )

  // Create a custom symptom. Trims, rejects empty, rejects a case-insensitive dupe.
  fastify.post(
    '/me/custom-symptoms',
    { preHandler: [fastify.verifyAuth] },
    async (request, reply) => {
      const parsed = createSchema.safeParse(request.body)
      if (!parsed.success) {
        return sendError(reply, 400, parsed.error.issues.map((i) => i.message).join('; '))
      }
      const label = parsed.data.label

      const dupe = await fastify.prisma.customSymptom.findFirst({
        where: { userId: request.user.id, label: { equals: label, mode: 'insensitive' } },
      })
      if (dupe) return sendError(reply, 409, 'You already have that symptom')

      const count = await fastify.prisma.customSymptom.count({ where: { userId: request.user.id } })
      const created = await fastify.prisma.customSymptom.create({
        data: { userId: request.user.id, label, sortOrder: count },
      })
      return reply.status(201).send(serialize(created))
    }
  )

  // Rename and/or archive a custom symptom.
  fastify.patch<{ Params: { id: string } }>(
    '/me/custom-symptoms/:id',
    { preHandler: [fastify.verifyAuth] },
    async (request, reply) => {
      const parsed = patchSchema.safeParse(request.body)
      if (!parsed.success) {
        return sendError(reply, 400, parsed.error.issues.map((i) => i.message).join('; '))
      }
      const { label, archived } = parsed.data
      if (label === undefined && archived === undefined) {
        return sendError(reply, 400, 'Nothing to update')
      }

      const existing = await fastify.prisma.customSymptom.findFirst({
        where: { id: request.params.id, userId: request.user.id },
      })
      if (!existing) return sendError(reply, 404, 'Custom symptom not found')

      if (label !== undefined) {
        const dupe = await fastify.prisma.customSymptom.findFirst({
          where: {
            userId: request.user.id,
            label: { equals: label, mode: 'insensitive' },
            id: { not: existing.id },
          },
        })
        if (dupe) return sendError(reply, 409, 'You already have that symptom')
      }

      const updated = await fastify.prisma.customSymptom.update({
        where: { id: existing.id },
        data: {
          ...(label !== undefined && { label }),
          ...(archived !== undefined && { archived }),
        },
      })
      return reply.send(serialize(updated))
    }
  )

  // Hard-delete the definition. Past logs keep the stored label string untouched.
  fastify.delete<{ Params: { id: string } }>(
    '/me/custom-symptoms/:id',
    { preHandler: [fastify.verifyAuth] },
    async (request, reply) => {
      const existing = await fastify.prisma.customSymptom.findFirst({
        where: { id: request.params.id, userId: request.user.id },
      })
      if (!existing) return sendError(reply, 404, 'Custom symptom not found')

      await fastify.prisma.customSymptom.delete({ where: { id: existing.id } })
      return reply.status(204).send()
    }
  )
}

export default customSymptomRoutes
