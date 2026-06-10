import type { FastifyPluginAsync } from 'fastify'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { verifyAdmin } from '../../middleware/admin'
import { sendError } from '../../lib/errors'
import { sendCsv } from '../../lib/csv'

const PER_PAGE = 25
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function buildWhere(status?: string, search?: string): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {}
  if (status) where.status = status
  if (search) {
    const or: Prisma.OrderWhereInput[] = [
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { stripeSessionId: { contains: search, mode: 'insensitive' } },
    ]
    if (UUID_RE.test(search)) or.push({ id: search })
    where.OR = or
  }
  return where
}

const ORDER_CSV_FIELDS = [
  'id',
  'email',
  'status',
  'productSku',
  'quantity',
  'totalCents',
  'fulfillmentTracking',
  'createdAt',
]

const adminOrdersRoutes: FastifyPluginAsync = async (fastify) => {
  // Both guards: auth populates request.user, then admin checks the role.
  fastify.addHook('preHandler', fastify.verifyAuth)
  fastify.addHook('preHandler', verifyAdmin)

  fastify.get<{ Querystring: { page?: string; status?: string; search?: string } }>(
    '/admin/orders',
    async (request, reply) => {
      const page = Math.max(1, parseInt(request.query.page ?? '1', 10) || 1)
      const where = buildWhere(request.query.status, request.query.search)

      const [data, total] = await Promise.all([
        fastify.prisma.order.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * PER_PAGE,
          take: PER_PAGE,
          include: { user: { select: { email: true } } },
        }),
        fastify.prisma.order.count({ where }),
      ])

      return reply.send({ data, total, page, perPage: PER_PAGE })
    }
  )

  // Static export path (distinct from the :id PATCH below).
  fastify.get<{ Querystring: { status?: string; search?: string } }>(
    '/admin/orders/export',
    async (request, reply) => {
      const where = buildWhere(request.query.status, request.query.search)
      const orders = await fastify.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true } } },
      })

      const rows = orders.map((o) => ({
        id: o.id,
        email: o.user?.email ?? '',
        status: o.status,
        productSku: o.productSku,
        quantity: o.quantity,
        totalCents: o.totalCents,
        fulfillmentTracking: o.fulfillmentTracking ?? '',
        createdAt: o.createdAt.toISOString(),
      }))

      return sendCsv(reply, 'lunari-orders.csv', rows, ORDER_CSV_FIELDS)
    }
  )

  const patchSchema = z.object({
    status: z.string().min(1).optional(),
    fulfillmentTracking: z.string().optional(),
  })

  fastify.patch<{ Params: { id: string } }>('/admin/orders/:id', async (request, reply) => {
    const parsed = patchSchema.safeParse(request.body ?? {})
    if (!parsed.success) return sendError(reply, 400, 'Invalid order update payload')
    const { status, fulfillmentTracking } = parsed.data

    try {
      const order = await fastify.prisma.order.update({
        where: { id: request.params.id },
        data: {
          ...(status !== undefined && { status }),
          ...(fulfillmentTracking !== undefined && { fulfillmentTracking }),
        },
      })
      return reply.send(order)
    } catch {
      return sendError(reply, 404, 'Order not found')
    }
  })
}

export default adminOrdersRoutes
