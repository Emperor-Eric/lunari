import Fastify from 'fastify'
import helmet from '@fastify/helmet'
import sensible from '@fastify/sensible'

import corsPlugin from './plugins/cors'
import authPlugin from './plugins/auth'
import prismaPlugin from './plugins/prisma'

import healthRoutes from './routes/health'
import authRoutes from './routes/auth'
import meRoutes from './routes/me'
import cycleRoutes from './routes/cycle'
import logsRoutes from './routes/logs'
import productsRoutes from './routes/products'
import checkoutRoutes from './routes/checkout'
import webhooksRoutes from './routes/webhooks'
import phasesRoutes from './routes/phases'
import adminOrdersRoutes from './routes/admin/orders'
import adminAnalyticsRoutes from './routes/admin/analytics'
import adminInfluencersRoutes from './routes/admin/influencers'
import adminUsersRoutes from './routes/admin/users'

export async function buildApp() {
  const app = Fastify({
    logger: true,
  })

  // Plugins
  await app.register(helmet)
  await app.register(sensible)
  await app.register(corsPlugin)
  await app.register(authPlugin)
  await app.register(prismaPlugin)

  // Routes — all prefixed under /v1
  const v1Prefix = { prefix: '/v1' }

  await app.register(healthRoutes, v1Prefix)
  await app.register(authRoutes, v1Prefix)
  await app.register(meRoutes, v1Prefix)
  await app.register(cycleRoutes, v1Prefix)
  await app.register(logsRoutes, v1Prefix)
  await app.register(productsRoutes, v1Prefix)
  await app.register(checkoutRoutes, v1Prefix)
  await app.register(webhooksRoutes, v1Prefix)
  await app.register(phasesRoutes, v1Prefix)
  await app.register(adminOrdersRoutes, v1Prefix)
  await app.register(adminAnalyticsRoutes, v1Prefix)
  await app.register(adminInfluencersRoutes, v1Prefix)
  await app.register(adminUsersRoutes, v1Prefix)

  return app
}
