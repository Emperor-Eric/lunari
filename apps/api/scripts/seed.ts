import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

async function main() {
  const seedPath = join(__dirname, '../../../supabase/seed.sql')
  const sql = readFileSync(seedPath, 'utf-8')

  // Split on statement boundaries and run each non-empty statement
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'))

  console.warn(`Running ${statements.length} seed statements...`)

  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement)
  }

  console.warn('✅ Seed complete.')
}

main()
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
