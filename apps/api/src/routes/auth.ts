import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { sendError } from '../lib/errors'
import { supabase } from '../lib/supabase'

// name is optional — defaults to the email prefix if the form omits it
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
})

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/auth/signup', async (request, reply) => {
    // 1. Validate the body with Zod — log the exact issue on failure
    const parsed = signupSchema.safeParse(request.body)
    if (!parsed.success) {
      request.log.error(
        { zodErrors: parsed.error.issues, receivedBody: request.body },
        'Signup validation failed'
      )
      const detail = parsed.error.issues
        .map((i) => `${i.path.join('.') || 'body'}: ${i.message}`)
        .join('; ')
      return sendError(reply, 400, `Invalid signup payload — ${detail}`)
    }

    const { email, password, name } = parsed.data

    // 2. Create the auth user with the service-role admin client
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (error || !data?.user) {
      request.log.error(
        {
          supabaseError: error,
          message: error?.message,
          status: error?.status,
          code: (error as { code?: string } | null)?.code,
        },
        'supabase.auth.admin.createUser failed'
      )
      return sendError(reply, 400, error?.message ?? 'Failed to create auth user')
    }

    // 3. Insert the users-table row
    try {
      await fastify.prisma.user.upsert({
        where: { id: data.user.id },
        create: { id: data.user.id, email, name: name ?? email.split('@')[0] },
        update: {},
      })
    } catch (dbErr) {
      request.log.error({ err: dbErr }, 'Failed to insert users row after signup')
      return sendError(reply, 500, 'User created but failed to persist profile')
    }

    // 4. Mint a real session so the client is signed in immediately
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      request.log.error(
        { supabaseError: signInError, message: signInError.message },
        'signInWithPassword after signup failed'
      )
      // Account exists — return user without a session so the client can log in
      return reply.status(201).send({ user: data.user, session: null })
    }

    return reply.status(201).send({ user: data.user, session: signInData.session })
  })

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
