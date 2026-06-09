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

  // Hook factory — call this in routes that require auth
  fastify.decorate(
    'verifyAuth',
    async (request: FastifyRequest, reply: FastifyReply) => {
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

      request.user = { id: user.id, email: user.email ?? '' }
    }
  )
})

export default authPlugin

// Extend FastifyInstance with verifyAuth
declare module 'fastify' {
  interface FastifyInstance {
    verifyAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}
