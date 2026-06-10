import 'dotenv/config'
import { buildApp } from './server'

const PORT = parseInt(process.env.PORT ?? '3001', 10)
const HOST = process.env.HOST ?? (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1')

async function start() {
  const app = await buildApp()

  try {
    await app.listen({ port: PORT, host: HOST })
    console.warn(`API running at http://${HOST}:${PORT}/v1`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
