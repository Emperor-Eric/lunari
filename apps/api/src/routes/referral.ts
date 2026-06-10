import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { sendError } from '../lib/errors'

const DISCOUNT_PERCENT = 10

const codeSchema = z.object({
  code: z.string().trim().min(1, 'Referral code is required').max(20, 'Referral code too long'),
})

const referralRoutes: FastifyPluginAsync = async (fastify) => {
  // Apply a referral code to the current user.
  fastify.post(
    '/me/referral-code',
    { preHandler: [fastify.verifyAuth] },
    async (request, reply) => {
      const parsed = codeSchema.safeParse(request.body)
      if (!parsed.success) {
        return sendError(reply, 400, parsed.error.issues.map((i) => i.message).join('; '))
      }

      const code = parsed.data.code.trim().toUpperCase()

      // Look up the influencer code case-insensitively (UPPER(influencer_code) = UPPER(code)).
      const influencer = await fastify.prisma.influencerReferral.findFirst({
        where: { influencerCode: { equals: code, mode: 'insensitive' } },
      })
      if (!influencer) {
        return sendError(reply, 404, 'Referral code not found')
      }

      // Save to the user and increment the influencer's app attributions atomically.
      await fastify.prisma.$transaction([
        fastify.prisma.user.update({
          where: { id: request.user.id },
          data: {
            referralCode: influencer.influencerCode,
            referralCodeAppliedAt: new Date(),
          },
        }),
        fastify.prisma.influencerReferral.update({
          where: { id: influencer.id },
          data: { appAttributions: { increment: 1 } },
        }),
      ])

      return reply.send({
        code: influencer.influencerCode,
        influencerName: influencer.influencerName,
        discountPercent: DISCOUNT_PERCENT,
      })
    }
  )

  // Return the current user's applied referral code (if any).
  fastify.get(
    '/me/referral-code',
    { preHandler: [fastify.verifyAuth] },
    async (request, reply) => {
      const user = await fastify.prisma.user.findUnique({
        where: { id: request.user.id },
        select: { referralCode: true, referralCodeAppliedAt: true },
      })

      return reply.send({
        code: user?.referralCode ?? null,
        appliedAt: user?.referralCodeAppliedAt?.toISOString() ?? null,
      })
    }
  )

  // Remove the current user's referral code.
  fastify.delete(
    '/me/referral-code',
    { preHandler: [fastify.verifyAuth] },
    async (request, reply) => {
      await fastify.prisma.user.update({
        where: { id: request.user.id },
        data: { referralCode: null, referralCodeAppliedAt: null },
      })

      return reply.status(204).send()
    }
  )
}

export default referralRoutes
