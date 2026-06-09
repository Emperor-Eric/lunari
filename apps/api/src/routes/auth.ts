import type { FastifyPluginAsync } from 'fastify'
import { sendError } from '../lib/errors'
import { supabase } from '../lib/supabase'

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: { email: string; password: string; name?: string } }>(
    '/auth/signup',
    async (request, reply) => {
      const { email, password, name } = request.body ?? {}
      if (!email || !password) return sendError(reply, 400, 'email and password are required')

      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })
      if (error) return sendError(reply, 400, error.message)

      await fastify.prisma.user.upsert({
        where: { id: data.user.id },
        create: { id: data.user.id, email, name: name ?? email.split('@')[0] },
        update: {},
      })

      const { data: session } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
      })

      return reply.status(201).send({ user: data.user, session: session?.properties })
    }
  )

  fastify.post<{ Body: { email: string; password: string } }>(
    '/auth/login',
    async (request, reply) => {
      const { email, password } = request.body ?? {}
      if (!email || !password) return sendError(reply, 400, 'email and password are required')

      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return sendError(reply, 401, error.message)

      return reply.send({ user: data.user, session: data.session })
    }
  )

  fastify.post('/auth/logout', async (_request, reply) => {
    return reply.send({ success: true })
  })

  fastify.post<{ Body: { email: string } }>(
    '/auth/reset-password',
    async (request, reply) => {
      const { email } = request.body ?? {}
      if (!email) return sendError(reply, 400, 'email is required')

      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) return sendError(reply, 400, error.message)

      return reply.send({ success: true })
    }
  )
}

export default authRoutes
