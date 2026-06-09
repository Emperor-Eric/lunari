import type { FastifyReply } from 'fastify'

export interface ApiError {
  error: string
  statusCode: number
}

export function sendError(reply: FastifyReply, statusCode: number, message: string): void {
  reply.status(statusCode).send({ error: message, statusCode })
}

export function notImplemented(reply: FastifyReply): void {
  sendError(reply, 501, 'Not implemented')
}

export function unauthorized(reply: FastifyReply, message = 'Unauthorized'): void {
  sendError(reply, 401, message)
}
