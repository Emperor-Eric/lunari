# Lunari Admin Dashboard — DEFERRED (not part of MVP)

This is a business-operations dashboard (orders, revenue, influencer commissions, 
user analytics, push-notification sender). It was built during Phase 4 but is 
**intentionally parked** and is NOT part of the current product.

## Why it's deferred
The Lunari app's MVP is a standalone cycle-tracking and recommendation tool. It is 
not connected to the Shopify store, so order/revenue/commission features have no 
data source in the app. This dashboard becomes relevant only if/when:
- The app is connected to commerce data, AND
- There's a real user base whose activity/cycle analytics are worth viewing.

## Status
- The admin app is fully built and runs on port 3002 (`pnpm dev` in apps/admin).
- The admin API routes exist in apps/api/src/routes/admin/ and are role-gated.
- It is NOT deployed and NOT run as part of normal development.
- The push-notifications page is a "coming soon" placeholder (notifications aren't built).

## To revive later
1. Run the make-admin script to grant an admin role: 
   `cd apps/api && npx tsx scripts/make-admin.ts your@email.com`
2. Set up apps/admin/.env.local (Supabase + API URL).
3. `pnpm dev` in apps/admin → http://localhost:3002
