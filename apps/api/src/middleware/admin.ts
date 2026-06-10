import type { FastifyRequest, FastifyReply } from 'fastify'
import { supabase } from '../lib/supabase'

/**
 * Fastify preHandler that gates a route to admins only.
 *
 * MUST run AFTER fastify.verifyAuth (which populates request.user). It reads the
 * Supabase auth user via the service-role admin client and checks that
 * app_metadata.role === 'admin'.
 */
export async function verifyAdmin(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user?.id
  if (!userId) {
    return reply.status(401).send({ error: 'Unauthorized', statusCode: 401 })
  }

  const { data, error } = await supabase.auth.admin.getUserById(userId)
  const role = (data?.user?.app_metadata as { role?: string } | undefined)?.role

  if (error || role !== 'admin') {
    return reply.status(403).send({ error: 'Admin access required', statusCode: 403 })
  }
}
