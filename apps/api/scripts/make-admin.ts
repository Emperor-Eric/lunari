import 'dotenv/config'
import { supabase } from '../src/lib/supabase'

/**
 * One-off script to grant a user the admin role.
 *
 *   npx tsx apps/api/scripts/make-admin.ts user@email.com
 *
 * Sets app_metadata.role = 'admin' on the matching Supabase Auth user, which the
 * admin API middleware (verifyAdmin) checks.
 */
async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error('Usage: npx tsx apps/api/scripts/make-admin.ts <email>')
    process.exit(1)
  }

  // Find the user by paging through the admin list (Supabase has no get-by-email).
  let target: { id: string; email?: string } | undefined
  let page = 1
  const perPage = 1000
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) {
      console.error('Failed to list users:', error.message)
      process.exit(1)
    }
    target = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (target || data.users.length < perPage) break
    page += 1
  }

  if (!target) {
    console.error(`No user found with email: ${email}`)
    process.exit(1)
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(target.id, {
    app_metadata: { role: 'admin' },
  })

  if (updateError) {
    console.error('Failed to set admin role:', updateError.message)
    process.exit(1)
  }

  console.warn(`✅ ${email} is now an admin (user id: ${target.id})`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
