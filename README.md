# Lunari

**Repo:** https://github.com/Emperor-Eric/lunari

A cycle-syncing wellness app that personalises supplements, workouts, and nutrition to each phase of the menstrual cycle.

## Tech Stack

- **Monorepo:** Turborepo + pnpm workspaces
- **Language:** TypeScript (strict mode)
- **API:** Fastify — `api.herlunari.com`
- **Web:** Next.js 14 — `herlunari.com`
- **Mobile:** Expo SDK 51 (iOS + Android)
- **Database:** PostgreSQL via Supabase
- **ORM:** Prisma
- **Auth:** Supabase Auth (JWT, email/password, Apple, Google)
- **Hosting:** Railway (API), Vercel (web)

## Monorepo Structure

```
lunari/
├── apps/
│   ├── web/          # Next.js 14
│   ├── mobile/       # Expo SDK 51
│   ├── api/          # Fastify backend
│   └── admin/        # Internal dashboard
├── packages/
│   ├── design-tokens/ # Brand colors, typography, spacing
│   ├── types/         # Shared TypeScript interfaces
│   ├── phase-data/    # Static cycle phase content
│   └── utils/         # Shared helpers
└── supabase/
    ├── migrations/
    └── seed.sql
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Setup

```bash
# Clone the repo
git clone https://github.com/Emperor-Eric/lunari.git
cd lunari

# Install dependencies
pnpm install

# Start all apps in dev mode
pnpm dev
```

### Individual apps

```bash
# API only
pnpm --filter @lunari/api dev

# Web only
pnpm --filter @lunari/web dev
```

## Environment Variables

Copy `.env.example` files in each app workspace and fill in your values:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/mobile/.env.example apps/mobile/.env
```
