import fp from 'fastify-plugin'
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { createClient } from '@supabase/supabase-js'

declare module 'fastify' {
  interface FastifyRequest {
    user: { id: string; email: string }
  }
}

const authPlugin: FastifyPluginAsync = fp(async (fastify) => {
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Decorate request with a default user (overwritten by verifyAuth)
  fastify.decorateRequest('user', null)

  // Ensure a Prisma `users` row exists for the verified Supabase identity. OAuth
  // sign-ins never hit POST /auth/signup, so without this their row is missing and
  // every /me route 404s. Identity fields are filled ONLY on first create — never
  // overwritten on later requests (so a user's edited name/email is preserved).
  const ensureUserRow = async (user: {
    id: string
    email?: string
    user_metadata?: Record<string, unknown>
  }) => {
    const existing = await fastify.prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true },
    })
    if (existing) return

    const email = user.email ?? ''
    const meta = (user.user_metadata ?? {}) as { full_name?: string; name?: string }
    const handle = email.includes('@') ? email.slice(0, email.indexOf('@')) : email
    const name = meta.full_name?.trim() || meta.name?.trim() || handle || null

    try {
      await fastify.prisma.user.create({ data: { id: user.id, email, name } })
    } catch (err) {
      // A concurrent request may have created it first (P2002 unique violation) —
      // that's the expected race and is safe to ignore. Log anything else.
      if ((err as { code?: string })?.code !== 'P2002') {
        fastify.log.error({ err }, 'ensureUserRow: failed to create user row')
      }
    }
  }

  // Hook factory — call this in routes that require auth
  fastify.decorate('verifyAuth', async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized', statusCode: 401 })
    }

    const token = authHeader.slice(7)

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) {
      return reply.status(401).send({ error: 'Invalid or expired token', statusCode: 401 })
    }

    // Self-heal: guarantee the Prisma row exists before any /me handler runs.
    await ensureUserRow(user)

    request.user = { id: user.id, email: user.email ?? '' }
  })
})

export default authPlugin

// Extend FastifyInstance with verifyAuth
declare module 'fastify' {
  interface FastifyInstance {
    verifyAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}
