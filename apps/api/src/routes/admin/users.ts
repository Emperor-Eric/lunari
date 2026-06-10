import type { FastifyPluginAsync } from 'fastify'
import { Prisma } from '@prisma/client'
import { getDayInCycle, getPhaseForDay } from '@lunari/phase-data'
import type { PhaseId } from '@lunari/types'
import { verifyAdmin } from '../../middleware/admin'
import { sendCsv } from '../../lib/csv'

const PER_PAGE = 25

type UserFilter = 'active7d' | 'active30d' | 'inactive14d' | 'all'

const USER_CSV_FIELDS = [
  'id',
  'name',
  'email',
  'createdAt',
  'lastActiveAt',
  'onboardedAt',
  'currentPhase',
  'cycleDay',
  'totalLogs',
  'referralCode',
]

function buildWhere(search?: string, filter?: UserFilter): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {}

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ]
  }

  const now = Date.now()
  if (filter === 'active7d') {
    where.lastActiveAt = { gte: new Date(now - 7 * 24 * 60 * 60 * 1000) }
  } else if (filter === 'active30d') {
    where.lastActiveAt = { gte: new Date(now - 30 * 24 * 60 * 60 * 1000) }
  } else if (filter === 'inactive14d') {
    // Inactive = last active before 14 days ago
    where.lastActiveAt = { lt: new Date(now - 14 * 24 * 60 * 60 * 1000) }
  }

  return where
}

const userQuery = {
  include: {
    cycles: { take: 1, orderBy: { createdAt: 'desc' as const } },
    _count: { select: { symptomLogs: true } },
  },
}

type UserWithExtras = Prisma.UserGetPayload<typeof userQuery>

function toRow(u: UserWithExtras) {
  const cycle = u.cycles[0]
  let currentPhase: PhaseId | null = null
  let cycleDay: number | null = null
  if (cycle) {
    const day = getDayInCycle(cycle.startDate.toISOString().slice(0, 10), undefined, cycle.cycleLength)
    cycleDay = day
    currentPhase = getPhaseForDay(day).id
  }

  return {
    id: u.id,
    name: u.name ?? '',
    email: u.email,
    createdAt: u.createdAt.toISOString(),
    lastActiveAt: u.lastActiveAt ? u.lastActiveAt.toISOString() : null,
    onboardedAt: u.onboardedAt ? u.onboardedAt.toISOString() : null,
    currentPhase,
    cycleDay,
    totalLogs: u._count.symptomLogs,
    referralCode: u.referralCode ?? null,
  }
}

const adminUsersRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.verifyAuth)
  fastify.addHook('preHandler', verifyAdmin)

  fastify.get<{ Querystring: { page?: string; search?: string; filter?: UserFilter } }>(
    '/admin/users',
    async (request, reply) => {
      const page = Math.max(1, parseInt(request.query.page ?? '1', 10) || 1)
      const where = buildWhere(request.query.search, request.query.filter ?? 'all')

      const [users, total] = await Promise.all([
        fastify.prisma.user.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * PER_PAGE,
          take: PER_PAGE,
          ...userQuery,
        }),
        fastify.prisma.user.count({ where }),
      ])

      return reply.send({ data: users.map(toRow), total, page, perPage: PER_PAGE })
    }
  )

  fastify.get<{ Querystring: { search?: string; filter?: UserFilter } }>(
    '/admin/users/export',
    async (request, reply) => {
      const where = buildWhere(request.query.search, request.query.filter ?? 'all')
      const users = await fastify.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...userQuery,
      })
      return sendCsv(reply, 'lunari-users.csv', users.map(toRow), USER_CSV_FIELDS)
    }
  )
}

export default adminUsersRoutes
