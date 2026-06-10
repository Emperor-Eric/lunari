import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { verifyAdmin } from '../../middleware/admin'
import { sendError } from '../../lib/errors'
import { sendCsv } from '../../lib/csv'

interface InfluencerRow {
  id: string
  code: string
  name: string
  commissionRate: number
  appAttributions: number
  active: boolean
}

const INFLUENCER_CSV_FIELDS = [
  'id',
  'code',
  'name',
  'commissionRate',
  'appAttributions',
  'active',
]

const adminInfluencersRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.verifyAuth)
  fastify.addHook('preHandler', verifyAdmin)

  const toRow = (r: {
    id: string
    influencerCode: string
    influencerName: string
    commissionRate: unknown
    appAttributions: number
    active: boolean
  }): InfluencerRow => ({
    id: r.id,
    code: r.influencerCode,
    name: r.influencerName,
    commissionRate: Number(r.commissionRate),
    appAttributions: r.appAttributions,
    active: r.active,
  })

  fastify.get('/admin/influencers', async (_request, reply) => {
    const rows = await fastify.prisma.influencerReferral.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return reply.send(rows.map(toRow))
  })

  fastify.get('/admin/influencers/export', async (_request, reply) => {
    const rows = await fastify.prisma.influencerReferral.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return sendCsv(reply, 'lunari-influencers.csv', rows.map(toRow), INFLUENCER_CSV_FIELDS)
  })

  // commissionRate is submitted as a PERCENT (e.g. 20) and stored as a fraction
  // (0.20) to match the existing seed-data convention.
  const createSchema = z.object({
    code: z.string().trim().min(1).max(40),
    name: z.string().trim().min(1),
    commissionRate: z.number().nonnegative().max(100).default(20),
  })

  fastify.post('/admin/influencers', async (request, reply) => {
    const parsed = createSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      return sendError(reply, 400, parsed.error.issues.map((i) => i.message).join('; '))
    }
    const { code, name, commissionRate } = parsed.data

    try {
      const created = await fastify.prisma.influencerReferral.create({
        data: {
          influencerCode: code.toUpperCase(),
          influencerName: name,
          commissionRate: commissionRate / 100,
        },
      })
      return reply.status(201).send(toRow(created))
    } catch {
      // Most likely a unique-constraint violation on influencer_code
      return sendError(reply, 409, 'An influencer with that code already exists')
    }
  })

  // commissionRate here is also a PERCENT, stored as a fraction.
  const updateSchema = z.object({
    name: z.string().trim().min(1).optional(),
    commissionRate: z.number().nonnegative().max(100).optional(),
    active: z.boolean().optional(),
  })

  fastify.patch<{ Params: { id: string } }>(
    '/admin/influencers/:id',
    async (request, reply) => {
      const parsed = updateSchema.safeParse(request.body ?? {})
      if (!parsed.success) return sendError(reply, 400, 'Invalid influencer update payload')
      const { name, commissionRate, active } = parsed.data

      try {
        const updated = await fastify.prisma.influencerReferral.update({
          where: { id: request.params.id },
          data: {
            ...(name !== undefined && { influencerName: name }),
            ...(commissionRate !== undefined && { commissionRate: commissionRate / 100 }),
            ...(active !== undefined && { active }),
          },
        })
        return reply.send(toRow(updated))
      } catch {
        return sendError(reply, 404, 'Influencer not found')
      }
    }
  )
}

export default adminInfluencersRoutes
