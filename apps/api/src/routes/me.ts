import type { FastifyPluginAsync } from 'fastify'
import { Prisma } from '@prisma/client'
import type { NotificationPrefs, TrainingProfile } from '@lunari/types'
import { sendError } from '../lib/errors'
import { supabase } from '../lib/supabase'

const meRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/me', { preHandler: [fastify.verifyAuth] }, async (request, reply) => {
    // Touch lastActiveAt on every read so the admin dashboard has live activity data.
    try {
      const user = await fastify.prisma.user.update({
        where: { id: request.user.id },
        data: { lastActiveAt: new Date() },
      })
      return reply.send(user)
    } catch {
      return sendError(reply, 404, 'User not found')
    }
  })

  fastify.patch<{
    Body: {
      name?: string
      // Partial — only the keys sent are changed; the rest of the stored prefs
      // (dailyReminder/reminderTime/etc.) are preserved via a server-side merge.
      notificationPrefs?: Partial<NotificationPrefs>
      trainingProfile?: Partial<TrainingProfile>
    }
  }>('/me', { preHandler: [fastify.verifyAuth] }, async (request, reply) => {
    const { name, notificationPrefs, trainingProfile } = request.body ?? {}

    // Merge the Json prefs into whatever is stored so a partial patch never clobbers
    // other keys (each Json column stays a superset). One read covers both.
    let mergedPrefs: NotificationPrefs | undefined
    let mergedTraining: TrainingProfile | undefined
    if (notificationPrefs !== undefined || trainingProfile !== undefined) {
      const existing = await fastify.prisma.user.findUnique({
        where: { id: request.user.id },
        select: { notificationPrefs: true, trainingProfile: true },
      })
      if (notificationPrefs !== undefined) {
        const current = (existing?.notificationPrefs ?? {}) as unknown as NotificationPrefs
        mergedPrefs = { ...current, ...notificationPrefs }
      }
      if (trainingProfile !== undefined) {
        const current = (existing?.trainingProfile ?? {}) as unknown as TrainingProfile
        mergedTraining = { ...current, ...trainingProfile }
      }
    }

    const updated = await fastify.prisma.user.update({
      where: { id: request.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(mergedPrefs !== undefined && {
          notificationPrefs: mergedPrefs as unknown as Prisma.InputJsonObject,
        }),
        ...(mergedTraining !== undefined && {
          trainingProfile: mergedTraining as unknown as Prisma.InputJsonObject,
        }),
      },
    })

    return reply.send(updated)
  })

  // Full export of everything STORED for this user (GDPR-style "download my data").
  // Derived data (predictions/insights) is computed on demand, not stored, so it's excluded.
  fastify.get('/me/export', { preHandler: [fastify.verifyAuth] }, async (request, reply) => {
    const userId = request.user.id

    const [user, cycle, periodEvents, symptomLogs] = await Promise.all([
      fastify.prisma.user.findUnique({ where: { id: userId } }),
      fastify.prisma.cycle.findUnique({ where: { userId } }),
      fastify.prisma.periodEvent.findMany({ where: { userId }, orderBy: { startDate: 'desc' } }),
      // ALL symptom logs — no pagination cap.
      fastify.prisma.symptomLog.findMany({ where: { userId }, orderBy: { loggedAt: 'desc' } }),
    ])

    if (!user) return sendError(reply, 404, 'User not found')

    return reply.send({
      note: 'This is everything Lunari stores for your account. Derived data such as cycle predictions and insights is computed on demand from the data below — it is not stored, so it is not included here.',
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        onboardedAt: user.onboardedAt,
        notificationPrefs: user.notificationPrefs,
        referralCode: user.referralCode,
      },
      cycle: cycle
        ? {
            startDate: cycle.startDate,
            cycleLength: cycle.cycleLength,
            periodLength: cycle.periodLength,
          }
        : null,
      periodEvents,
      symptomLogs,
    })
  })

  // Delete the account + all stored data. Prisma cascade removes Cycle, PeriodEvent,
  // SymptomLog and Subscription; Orders are kept with userId nulled (intentional).
  fastify.delete('/me', { preHandler: [fastify.verifyAuth] }, async (request, reply) => {
    const userId = request.user.id

    // 1. Delete the Prisma user (cascades the owned data).
    await fastify.prisma.user.delete({ where: { id: userId } })

    // 2. Delete the Supabase auth user. If this fails the data is already gone, so an
    //    orphaned auth user is low-harm — log and still return success.
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId)
      if (error)
        request.log.error(
          { err: error },
          'supabase.auth.admin.deleteUser failed after account delete'
        )
    } catch (err) {
      request.log.error({ err }, 'supabase.auth.admin.deleteUser threw after account delete')
    }

    return reply.status(204).send()
  })
}

export default meRoutes
