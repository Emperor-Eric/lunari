import { Parser } from 'json2csv'
import type { FastifyReply } from 'fastify'

/**
 * Serialise rows to CSV. Always pass explicit fields so that empty data still
 * produces a valid header-only CSV (never crashes on no data).
 */
export function toCsv<T>(rows: T[], fields: string[]): string {
  const parser = new Parser({ fields })
  return parser.parse(rows as ReadonlyArray<object>)
}

/** Send rows as a downloadable CSV attachment. */
export function sendCsv<T>(
  reply: FastifyReply,
  filename: string,
  rows: T[],
  fields: string[]
): FastifyReply {
  const csv = toCsv(rows, fields)
  reply.header('Content-Type', 'text/csv')
  reply.header('Content-Disposition', `attachment; filename="${filename}"`)
  return reply.send(csv)
}
