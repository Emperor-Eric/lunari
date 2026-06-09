# Lunari — Phase 1: Foundation
**Repo:** https://github.com/Emperor-Eric/lunari  
**Status:** 🔴 Not started  
**Goal:** Scaffold the entire monorepo, establish the design system, wire up the database, and stand up a working API skeleton. Every subsequent phase builds directly on this.

---

## What Gets Built in Phase 1

1. Turborepo monorepo with all workspaces
2. Shared design tokens package (Lunari brand colors, typography, spacing)
3. Shared TypeScript types package
4. Shared phase data package (the 4 cycle phases, ingredients, workouts, nutrition)
5. Fastify API with Supabase auth middleware and all route skeletons
6. PostgreSQL database schema via Prisma (all tables, all relations)
7. ESLint + Prettier + Husky pre-commit hooks across the entire repo
8. GitHub Actions CI pipeline (lint, type-check on every PR)
9. Railway deployment config for the API
10. `.env.example` files for every app

---

## Tech Decisions (Locked for Phase 1)

| Decision | Choice | Reason |
|---|---|---|
| Package manager | pnpm | Fastest installs, strict hoisting, workspace support |
| Monorepo tool | Turborepo | Parallel task running, build caching across workspaces |
| Language | TypeScript (strict mode) | Type safety across all surfaces from day one |
| API framework | Fastify | Schema-validated routes, auto OpenAPI docs, 2x faster than Express |
| Database | PostgreSQL via Supabase | Free tier, built-in Auth, Row Level Security, real-time ready |
| ORM | Prisma | Type-safe queries, migration management, great DX |
| Auth | Supabase Auth | Handles JWT, email/password, Apple, Google — no custom auth code |
| API hosting | Railway | Auto-deploys from GitHub main, zero config |
| Linting | ESLint + Prettier | Consistent code style enforced before every commit |
| Pre-commit | Husky + lint-staged | Only lints changed files — keeps commits fast |

---

## Monorepo Structure

```
lunari/                          # github.com/Emperor-Eric/lunari
├── apps/
│   ├── web/                     # Next.js 14 — herlunari.com (Phase 2+)
│   ├── mobile/                  # Expo SDK 51 — iOS + Android (Phase 2+)
│   ├── api/                     # Fastify backend — api.herlunari.com
│   └── admin/                   # Internal dashboard (Phase 4+)
├── packages/
│   ├── design-tokens/           # Colors, fonts, spacing — shared by web + mobile
│   ├── types/                   # Shared TypeScript interfaces
│   ├── phase-data/              # Static cycle phase content (JSON + typed exports)
│   └── utils/                   # Shared helper functions
├── supabase/
│   ├── migrations/              # SQL migration files
│   └── seed.sql                 # Dev seed data
├── .github/
│   └── workflows/
│       └── ci.yml               # Lint + type-check on every PR
├── .husky/
│   └── pre-commit               # Runs lint-staged before every commit
├── .eslintrc.js                 # Root ESLint config (shared by all packages)
├── .prettierrc                  # Prettier config
├── turbo.json                   # Turborepo pipeline config
├── pnpm-workspace.yaml          # Workspace definitions
└── package.json                 # Root — devDependencies only
```

---

## Package Specs

### `packages/design-tokens`

Exports Lunari's brand identity as consumable tokens for both web (CSS variables) and mobile (JS constants).

**Files to create:**
- `tokens.json` — source of truth, all values as JSON
- `index.css` — CSS custom properties for Next.js
- `tokens.ts` — typed TypeScript export for React Native

**Color tokens:**

| Token | Hex | Usage |
|---|---|---|
| `brand-gold` | `#C9A84C` | Primary CTA, logo accent, highlights |
| `brand-ink` | `#2C2825` | Primary text, headings |
| `brand-ink-soft` | `#6B6460` | Secondary text, labels |
| `brand-stone` | `#E8E2D6` | Borders, dividers |
| `brand-cream` | `#F5F0E8` | Page background, card fills |
| `phase-menstrual` | `#7A1E2E` | Phase 1 — Deep Burgundy |
| `phase-menstrual-light` | `#F5E8EA` | Phase 1 — light fill |
| `phase-follicular` | `#3D6B4A` | Phase 2 — Sage Green |
| `phase-follicular-light` | `#E4EFE6` | Phase 2 — light fill |
| `phase-ovulatory` | `#5B3E8C` | Phase 3 — Royal Purple |
| `phase-ovulatory-light` | `#EDE8F5` | Phase 3 — light fill |
| `phase-luteal` | `#7A4A2A` | Phase 4 — Terracotta |
| `phase-luteal-light` | `#F0E8DF` | Phase 4 — light fill |
| `metallic-gold` | `#C9A84C` | Interior box reveal |

**Typography tokens:**

| Role | Font | Weights | Usage |
|---|---|---|---|
| Display | Playfair Display | 400, 500, 400i | Phase names, hero headlines |
| Body | Inter | 300, 400, 500 | All UI text, labels |
| Mono | JetBrains Mono | 400 | Dosage amounts (clinical feel) |

**Spacing scale:** `4, 8, 12, 16, 24, 32, 48, 64` (px)  
**Border radius:** `sm: 8px, md: 12px, lg: 16px, full: 9999px`

---

### `packages/types`

Shared TypeScript interfaces used by the API, web, and mobile apps. No runtime code — types only.

**Interfaces to define:**

```ts
// User
interface User {
  id: string
  email: string
  name: string
  createdAt: string
  onboardedAt: string | null
  notificationPrefs: NotificationPrefs
}

interface NotificationPrefs {
  dailyReminder: boolean
  reminderTime: string // "08:00"
}

// Cycle
interface Cycle {
  id: string
  userId: string
  startDate: string // ISO date "2026-06-01"
  cycleLength: number // default 28
}

interface TodayCycleResponse {
  day: number          // 1–28
  phase: PhaseId
  phaseName: string
  phaseColor: string
  packsRemaining: number
}

type PhaseId = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal'

// Phase content
interface Phase {
  id: PhaseId
  name: string
  cycleDays: { start: number; end: number }
  color: string
  lightColor: string
  tagline: string
  packCount: number
  workouts: Workout[]
  avoidWorkouts: AvoidItem[]
  foods: FoodItem[]
  supplements: Supplement[]
  symptoms: string[]
}

interface Workout {
  title: string
  duration: string
  intensity: 'low' | 'moderate' | 'high'
  description: string
}

interface AvoidItem {
  name: string
  reason: string
}

interface FoodItem {
  name: string
  reason: string
}

interface Supplement {
  name: string
  dosage: string
  purpose: string
}

// Symptom log
interface SymptomLog {
  id: string
  userId: string
  cycleDay: number
  phase: PhaseId
  symptoms: string[]
  journalNote: string
  loggedAt: string
}

// Orders
interface Order {
  id: string
  userId: string
  stripeSessionId: string
  status: 'pending' | 'paid' | 'fulfilled' | 'refunded'
  productSku: 'kit-30day' | 'refill-pouch'
  quantity: number
  totalCents: number
  shippingAddress: ShippingAddress
  fulfillmentTracking: string | null
  createdAt: string
}

interface ShippingAddress {
  line1: string
  line2?: string
  city: string
  province: string
  postalCode: string
  country: string
}

// API responses
interface ApiError {
  error: string
  statusCode: number
}

interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  perPage: number
}
```

---

### `packages/phase-data`

Static content package. The authoritative source for all phase content — workouts, foods, supplements. Populated from the Lunari V3 formulation and master brief. Both the API and the mobile app import from here directly (no DB round-trip for static content).

**Files:**
- `phases.ts` — full phase data array
- `index.ts` — exports + helper functions

**Helper functions to export:**
```ts
getPhaseForDay(day: number): Phase
getPhaseById(id: PhaseId): Phase
getAllPhases(): Phase[]
getDayInCycle(cycleStartDate: string, today?: string): number
```

**Phase content summary (full detail in each phase object):**

| Phase | Days | Pack count | Key supplements (V3) |
|---|---|---|---|
| Menstrual | 1–5 | 5 | Chamomile 500mg, Iron Polysaccharide 18mg, Vit C 250mg, Nettle Leaf 400mg |
| Follicular | 6–15 | 10 | Rhodiola 150mg, L-Theanine 200mg, Maca Root 875mg, Calcium D-Glucarate 800mg |
| Ovulatory | 16–20 | 5 | Tremella 600mg, Aloe Vera 75mg, Vit C 500mg, Amla 250mg, Vit E 125mg |
| Luteal | 21–28 | 10 | Passionflower 250mg, Ashwagandha KSM-66 300mg, L-Tryptophan 200mg, Hibiscus 600mg |

**Core blend (all phases, included in every phase object):**
Myo-Inositol 3500mg, Inulin 1000mg, L-Glycine 500mg, Magnesium Hybrid 200mg, Omega-3 Algal 300mg, D3 1000 IU, Methylated B-complex, Zinc Citrate 15mg

---

## Database Schema

All tables live in Supabase PostgreSQL. Prisma manages migrations.

### `users`
```sql
id              UUID PRIMARY KEY  -- matches Supabase Auth user ID
email           TEXT UNIQUE NOT NULL
name            TEXT
created_at      TIMESTAMPTZ DEFAULT now()
onboarded_at    TIMESTAMPTZ        -- null until cycle setup complete
notification_prefs JSONB DEFAULT '{"dailyReminder": true, "reminderTime": "08:00"}'
```

### `cycles`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
start_date      DATE NOT NULL      -- Day 1 of current cycle
cycle_length    INT NOT NULL DEFAULT 28
created_at      TIMESTAMPTZ DEFAULT now()
```

### `symptom_logs`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
cycle_day       INT NOT NULL        -- 1–28
phase           TEXT NOT NULL       -- menstrual | follicular | ovulatory | luteal
symptoms        TEXT[] NOT NULL DEFAULT '{}'
journal_note    TEXT DEFAULT ''
logged_at       TIMESTAMPTZ DEFAULT now()
```

### `orders`
```sql
id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id               UUID REFERENCES users(id) ON DELETE SET NULL
stripe_session_id     TEXT UNIQUE
status                TEXT NOT NULL DEFAULT 'pending'
product_sku           TEXT NOT NULL
quantity              INT NOT NULL DEFAULT 1
total_cents           INT NOT NULL
shipping_address      JSONB
fulfillment_tracking  TEXT
created_at            TIMESTAMPTZ DEFAULT now()
```

### `subscriptions`
```sql
id                      UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
stripe_subscription_id  TEXT UNIQUE NOT NULL
status                  TEXT NOT NULL DEFAULT 'active'
next_billing_date       DATE
interval                TEXT NOT NULL DEFAULT 'monthly'
created_at              TIMESTAMPTZ DEFAULT now()
```

### `influencer_referrals`
```sql
id                      UUID PRIMARY KEY DEFAULT gen_random_uuid()
influencer_code         TEXT UNIQUE NOT NULL
influencer_name         TEXT NOT NULL
commission_rate         NUMERIC NOT NULL DEFAULT 0.20
total_sales             INT NOT NULL DEFAULT 0
total_commission_cents  INT NOT NULL DEFAULT 0
created_at              TIMESTAMPTZ DEFAULT now()
```

---

## API — Route Skeletons

All routes are scaffolded in Phase 1 with correct auth middleware and typed request/response shapes. Business logic is filled in per phase.

**Base URL:** `https://api.herlunari.com/v1`  
**Auth:** Supabase JWT — `Authorization: Bearer <token>` on all protected routes.

### Skeleton routes to scaffold:

```
GET  /health                          # No auth — returns { status: "ok", version }

POST /auth/signup                     # Proxies to Supabase Auth
POST /auth/login
POST /auth/logout
POST /auth/reset-password

GET  /me                              # Protected — returns User
PATCH /me
POST /me/cycle
GET  /me/cycle/today
GET  /me/cycle/calendar

POST /me/logs                         # SymptomLog CRUD
GET  /me/logs
GET  /me/logs/:id
DELETE /me/logs/:id

GET  /products                        # Public
POST /checkout                        # Protected
POST /checkout/subscription           # Protected
GET  /me/orders                       # Protected
GET  /me/orders/:id
POST /webhooks/stripe                 # No auth — Stripe signature verified

GET  /phases                          # Public — returns from phase-data package
GET  /phases/:phaseId
GET  /phases/:phaseId/workouts
GET  /phases/:phaseId/nutrition

GET  /admin/orders                    # Admin role required
PATCH /admin/orders/:id
GET  /admin/analytics
GET  /admin/influencers
POST /admin/influencers
GET  /admin/users
```

**Every route returns on error:**
```json
{ "error": "Human-readable message", "statusCode": 400 }
```

---

## Linting & Formatting Config

### `.eslintrc.js` (root)
```js
module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  plugins: ['@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }]
  }
}
```

### `.prettierrc`
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### `lint-staged.config.js`
```js
module.exports = {
  '**/*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  '**/*.{json,md,css}': ['prettier --write']
}
```

---

## CI Pipeline — `.github/workflows/ci.yml`

Runs on every pull request targeting `main`.

```yaml
name: CI
on:
  pull_request:
    branches: [main]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo lint
      - run: pnpm turbo type-check
      - run: pnpm turbo build --filter=api
```

---

## Environment Variables

### `apps/api/.env.example`
```
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
PORT=3001
NODE_ENV=development
```

### `apps/web/.env.example`
```
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=https://api.herlunari.com/v1
```

### `apps/mobile/.env.example`
```
EXPO_PUBLIC_API_URL=https://api.herlunari.com/v1
EXPO_PUBLIC_SUPABASE_URL=https://[project].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

---

## Railway Deployment Config

Add `railway.json` to `apps/api/`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node dist/server.js",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

Set these environment variables in Railway dashboard (copy from `.env.example`).

---

## Phase 1 Claude Code Prompts

Work through these in order. Paste each one into Claude Code verbatim.

---

### Prompt 1 — Monorepo scaffold

```
Initialize a Turborepo monorepo in the current directory (github.com/Emperor-Eric/lunari).

Use pnpm as the package manager. Create pnpm-workspace.yaml defining these workspaces:
- apps/web
- apps/mobile  
- apps/api
- apps/admin
- packages/design-tokens
- packages/types
- packages/phase-data
- packages/utils

Create turbo.json with a pipeline that defines: build (depends on ^build), lint, type-check, test, dev (persistent: true, cache: false).

Create the root package.json with scripts: dev, build, lint, type-check, test — all running via turbo.

Create placeholder package.json files in each workspace (name scoped as @lunari/web, @lunari/mobile, @lunari/api, etc. — version 0.1.0).

Create a root .gitignore covering: node_modules, .turbo, dist, .next, .expo, build, .env, .env.local.

Create a README.md with: project name lunari, repo URL, one-line description, tech stack list, and a "Getting started" section with: prerequisites (Node 20, pnpm 9), clone instructions, pnpm install, pnpm dev.

Do not install any dependencies yet — scaffold structure only.
```

---

### Prompt 2 — Linting and formatting

```
Set up ESLint, Prettier, and Husky across the lunari monorepo.

At the repo root install these devDependencies:
eslint, @typescript-eslint/eslint-plugin, @typescript-eslint/parser, eslint-config-prettier, prettier, husky, lint-staged

Create .eslintrc.js at the root as defined in the Phase 1 spec (extends eslint:recommended, @typescript-eslint/recommended, prettier — rules: no-unused-vars error, no-explicit-any warn, no-console warn).

Create .prettierrc at the root: semi false, singleQuote true, tabWidth 2, trailingComma es5, printWidth 100.

Create lint-staged.config.js at the root: run eslint --fix and prettier --write on ts/tsx files; prettier --write on json/md/css files.

Run pnpm husky init and set up the pre-commit hook to run pnpm lint-staged.

Add lint and type-check scripts to the root package.json that run via turbo.

Create a .github/workflows/ci.yml that: triggers on pull_request to main, runs on ubuntu-latest, uses pnpm/action-setup@v3 (version 9), node 20, runs pnpm install --frozen-lockfile, then pnpm turbo lint, pnpm turbo type-check, pnpm turbo build --filter=api.
```

---

### Prompt 3 — Design tokens package

```
Build the packages/design-tokens workspace for the lunari monorepo.

Install dependencies: typescript only (devDependency).

Create tokens.json as the source of truth with these exact values:

Colors:
- brand: { gold: "#C9A84C", ink: "#2C2825", inkSoft: "#6B6460", stone: "#E8E2D6", cream: "#F5F0E8" }
- phase: {
    menstrual: { base: "#7A1E2E", light: "#F5E8EA", mid: "#C4566A" },
    follicular: { base: "#3D6B4A", light: "#E4EFE6", mid: "#6A9E78" },
    ovulatory:  { base: "#5B3E8C", light: "#EDE8F5", mid: "#9178C4" },
    luteal:     { base: "#7A4A2A", light: "#F0E8DF", mid: "#B8805A" }
  }
- metallic: { gold: "#C9A84C", silver: "#C0C0C0" }

Typography:
- fonts: { display: "Playfair Display", body: "Inter", mono: "JetBrains Mono" }
- weights: { light: 300, regular: 400, medium: 500 }

Spacing (px): { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32, 12: 48, 16: 64 }

Border radius: { sm: "8px", md: "12px", lg: "16px", full: "9999px" }

From tokens.json generate:
1. index.css — exports every color as a CSS custom property (--color-brand-gold, --color-phase-menstrual-base etc.) and font stacks as --font-display, --font-body, --font-mono
2. tokens.ts — exports a fully typed TypeScript object mirroring tokens.json, plus a PhaseId type ("menstrual" | "follicular" | "ovulatory" | "luteal"), plus a helper getPhaseColor(id: PhaseId): { base: string; light: string; mid: string }

Export tokens.ts as the package main entry. Add a build script that copies index.css to dist/.
```

---

### Prompt 4 — Types package

```
Build the packages/types workspace for the lunari monorepo.

TypeScript only — no runtime code, no dependencies (except typescript as devDependency).

Create src/index.ts exporting all of these interfaces and types exactly as specified:

- PhaseId: "menstrual" | "follicular" | "ovulatory" | "luteal"
- User, NotificationPrefs
- Cycle, TodayCycleResponse
- Phase, Workout, AvoidItem, FoodItem, Supplement
- SymptomLog
- Order, ShippingAddress, OrderStatus ("pending" | "paid" | "fulfilled" | "refunded")
- Subscription, SubscriptionStatus ("active" | "paused" | "cancelled")
- InfluencerReferral
- ApiError { error: string; statusCode: number }
- PaginatedResponse<T> { data: T[]; total: number; page: number; perPage: number }

Full interface definitions are in the Phase 1 spec document. Implement every field exactly — no optional fields unless marked with ? in the spec.

Set up tsconfig.json with strict mode, declaration: true, outDir: dist. Add build and type-check scripts.
```

---

### Prompt 5 — Phase data package

```
Build the packages/phase-data workspace for the lunari monorepo.

Dependencies: @lunari/types (workspace), typescript (dev).

Create src/phases.ts exporting a phases array of type Phase[] with full content for all 4 phases. Use the Lunari master brief as the content source — specifically the V3 formulation. Every phase must have:

Phase 1 — Menstrual (days 1–5, 5 packs, color #7A1E2E):
- tagline: "Rest, restore, and replenish. Your body is doing deep work."
- workouts: Yin yoga (30–45 min, low), Slow walk (20–30 min, low), Breathwork (15 min, low)
- avoidWorkouts: High-intensity cardio (cortisol spikes worsen cramping), Heavy lifting (muscles recover slower)
- foods: Dark leafy greens (iron replacement), Dark chocolate 85%+ (magnesium for cramps), Wild salmon (omega-3s reduce inflammation), Ginger tea (pain and nausea relief)
- supplements: Chamomile 500mg (tasteless pain relief), Iron Polysaccharide 18mg (no metallic taste), Vitamin C 250mg (iron absorption), Nettle Leaf 400mg (mineral replenishment)
- symptoms: ["Cramps", "Fatigue", "Heavy flow", "Headache", "Low mood", "Back pain"]

Phase 2 — Follicular (days 6–15, 10 packs, color #3D6B4A):
- tagline: "Rising energy, new ideas, fresh momentum. Lean in."
- workouts: Strength training (45–60 min, high), Spin class (45 min, high), Interval runs (30 min, high)
- avoidWorkouts: Skipping workouts (estrogen peaks — best gains window), Cardio only (add resistance for bone density)
- foods: Eggs and lean protein (fuel muscle repair), Fermented foods (estrogen metabolism), Flaxseeds (lignans regulate estrogen), Berries (antioxidants protect follicle development)
- supplements: Rhodiola Rosea 150mg (anti-fatigue, focus), Maca Root 875mg gelatinized (energy + libido), Calcium D-Glucarate 800mg (clears excess estrogen), L-Theanine 200mg (flow state)
- symptoms: ["Energised", "Clear-headed", "Creative", "Mild bloat", "Motivated", "Anxious"]

Phase 3 — Ovulatory (days 16–20, 5 packs, color #5B3E8C):
- tagline: "Peak energy, glow, and confidence. Your most magnetic week."
- workouts: Power yoga (60 min, high), HIIT circuits (30 min, high), Swimming (40 min, moderate)
- avoidWorkouts: Overtraining (joint laxity peaks — watch injury risk), Skipping protein (muscle synthesis at highest)
- foods: Cruciferous vegetables (clear hormone surge), Almonds and walnuts (zinc for glow), Avocado (healthy fats support hormones), Pomegranate (antioxidants protect egg quality)
- supplements: Tremella Mushroom 600mg (skin hydration), Aloe Vera 75mg (gut + skin), Vitamin C 500mg (collagen synthesis), Amla 250mg (antioxidant), Vitamin E dry acetate 125mg (skin protection)
- symptoms: ["Energised", "Confident", "High libido", "Glowing skin", "Sociable", "Restless"]

Phase 4 — Luteal (days 21–28, 10 packs, color #7A4A2A):
- tagline: "Wind down, go inward, and prepare for renewal."
- workouts: Moderate lifting (40 min, moderate), Nature walks (30–45 min, low), Pilates (45 min, low)
- avoidWorkouts: Intense HIIT (cortisol worsens PMS), Alcohol (amplifies mood swings and bloat)
- foods: Sweet potato (complex carbs calm cravings), Turkey and pumpkin seeds (tryptophan → serotonin), Hibiscus tea (anti-bloat diuretic), Dark chocolate (magnesium + mood)
- supplements: Ashwagandha KSM-66 300mg (cortisol control), L-Tryptophan 200mg (serotonin precursor), Passionflower 250mg (calm), Lemon Balm 200mg (anxiety relief), Hibiscus 600mg (anti-bloat + colour)
- symptoms: ["Bloating", "Mood swings", "Cravings", "Fatigue", "Tender breasts", "Anxious"]

Also create src/helpers.ts exporting:
- getPhaseForDay(day: number): Phase
- getPhaseById(id: PhaseId): Phase
- getAllPhases(): Phase[]
- getDayInCycle(cycleStartDate: string, today?: string): number — returns 1–28 based on date diff, wraps at cycleLength

Export everything from src/index.ts.
```

---

### Prompt 6 — Fastify API scaffold

```
Build the apps/api workspace for the lunari monorepo.

Dependencies:
- fastify, @fastify/cors, @fastify/helmet, @fastify/sensible, @fastify/jwt
- @supabase/supabase-js
- prisma, @prisma/client
- zod, @sinclair/typebox
- dotenv

DevDependencies: typescript, @types/node, tsx, tsup

Create the following structure:
apps/api/
  src/
    server.ts          # Fastify instance, registers all plugins and routes, exports app
    index.ts           # Entry point — starts server on PORT from env
    plugins/
      auth.ts          # Supabase JWT verification middleware
      cors.ts          # CORS config — allow herlunari.com and localhost:3000
      prisma.ts        # Prisma client singleton, decorated onto fastify instance
    routes/
      health.ts        # GET /health
      auth.ts          # POST /auth/signup, /login, /logout, /reset-password
      me.ts            # GET+PATCH /me
      cycle.ts         # POST /me/cycle, GET /me/cycle/today, GET /me/cycle/calendar
      logs.ts          # Full CRUD /me/logs
      products.ts      # GET /products
      checkout.ts      # POST /checkout, /checkout/subscription
      webhooks.ts      # POST /webhooks/stripe
      phases.ts        # GET /phases, /phases/:id, /phases/:id/workouts, /phases/:id/nutrition
      admin/
        orders.ts
        analytics.ts
        influencers.ts
        users.ts
    lib/
      supabase.ts      # Supabase admin client singleton
      errors.ts        # Error handler — returns { error: string, statusCode: number }
  prisma/
    schema.prisma      # Full schema from Phase 1 spec
  railway.json
  tsconfig.json
  package.json

All routes in Phase 1 return 501 Not Implemented with { error: "Not implemented", statusCode: 501 } — business logic is filled in per phase. The scaffold must compile with zero TypeScript errors.

The auth plugin must: extract the Bearer token from Authorization header, verify it with Supabase JWT secret, and decorate request with request.user: { id: string, email: string }. Return 401 if missing or invalid.

The Prisma schema must include all 6 tables from the Phase 1 spec: users, cycles, symptom_logs, orders, subscriptions, influencer_referrals — with all columns, types, and relations.

Add a build script using tsup (entry: src/index.ts, format cjs, dts false) and a dev script using tsx watch src/index.ts.
```

---

### Prompt 7 — Database migration + seed

```
In apps/api, run the initial Prisma migration:

1. Ensure prisma/schema.prisma matches the Phase 1 spec exactly (all 6 tables).
2. Run: npx prisma migrate dev --name init
3. Run: npx prisma generate

Create supabase/seed.sql at the repo root with dev seed data:
- 1 test user (id matches a Supabase Auth test user you will create manually)
- 1 cycle record for that user (start_date: today minus 14 days, cycle_length: 28)
- 4 symptom_log records (one per phase, with 2–3 sample symptoms each)
- 3 influencer_referral records: { code: "GYMGIRL20", name: "Test Influencer 1", commission_rate: 0.20 }, { code: "LUNARI15", name: "Test Influencer 2", commission_rate: 0.15 }, { code: "WELLNESS10", name: "Test Influencer 3", commission_rate: 0.10 }

Create a scripts/seed.ts file in apps/api that reads supabase/seed.sql and runs it via the Prisma client. Add a "seed" script to package.json: tsx scripts/seed.ts

Add .env.example to apps/api with all variables from the Phase 1 spec.
```

---

### Prompt 8 — Verify and commit

```
Verify the Phase 1 build is complete:

1. Run pnpm install from the repo root — should complete with zero errors.
2. Run pnpm turbo type-check — all workspaces must pass with zero TypeScript errors.
3. Run pnpm turbo lint — zero errors (warnings are OK).
4. Run pnpm turbo build --filter=api — API must compile to dist/ successfully.
5. Start the API: cd apps/api && pnpm dev — server must start and GET /health must return { "status": "ok" }.

Fix any errors before committing.

Then commit everything:
git add .
git commit -m "feat: Phase 1 — monorepo scaffold, design tokens, types, phase data, API skeleton"
git push origin main

The commit should include every file created in Phase 1. Confirm the push succeeded and share the GitHub URL.
```

---

## Phase 1 Checklist

Before calling Phase 1 done, confirm every item:

- [ ] Turborepo monorepo with all 8 workspaces initialised
- [ ] `pnpm install` runs cleanly from root
- [ ] `packages/design-tokens` — tokens.json, index.css, tokens.ts all present
- [ ] `packages/types` — all interfaces exported, zero TS errors
- [ ] `packages/phase-data` — all 4 phases fully populated, helpers working
- [ ] `apps/api` — Fastify server starts, `/health` returns 200
- [ ] Prisma schema matches spec, initial migration runs
- [ ] Seed data script works
- [ ] ESLint + Prettier configured root-level
- [ ] Husky pre-commit hook fires on `git commit`
- [ ] GitHub Actions CI workflow present at `.github/workflows/ci.yml`
- [ ] `.env.example` files in every app workspace
- [ ] `railway.json` in `apps/api`
- [ ] Everything committed and pushed to `main`

---

## What's Not in Phase 1

The following are intentionally deferred:

- UI (no screens, no components — Phase 2)
- Auth flow UI (Phase 2)
- Real business logic in API routes (Phase 2+)
- Stripe integration (Phase 3)
- Push notifications (Phase 4)
- Admin dashboard UI (Phase 4)
- App Store builds (Phase 5)

---

*Phase 1 complete → move to Phase 2: Cycle Tracker App*  
*Repo: https://github.com/Emperor-Eric/lunari*
