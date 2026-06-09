import fp from 'fastify-plugin'
import cors from '@fastify/cors'
import type { FastifyPluginAsync } from 'fastify'

const corsPlugin: FastifyPluginAsync = fp(async (fastify) => {
  await fastify.register(cors, {
    origin: [
      'https://herlunari.com',
      'https://www.herlunari.com',
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
})

export default corsPlugin
