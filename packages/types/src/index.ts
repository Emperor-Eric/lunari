// ─── Phase ───────────────────────────────────────────────────────────────────

export type PhaseId = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal'

export interface Workout {
  title: string
  duration: string
  intensity: 'low' | 'moderate' | 'high'
  description: string
}

export interface AvoidItem {
  name: string
  reason: string
}

export interface FoodItem {
  name: string
  reason: string
}

export interface Supplement {
  name: string
  dosage: string
  purpose: string
}

export interface Phase {
  id: PhaseId
  name: string
  cycleDays: { start: number; end: number }
  color: string
  lightColor: string
  tagline: string
  containerNumber: 1 | 2 | 3 | 4
  workouts: Workout[]
  avoidWorkouts: AvoidItem[]
  foods: FoodItem[]
  supplements: Supplement[]
  symptoms: string[]
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface NotificationPrefs {
  dailyReminder: boolean
  reminderTime: string // "08:00"
}

export interface User {
  id: string
  email: string
  name: string
  createdAt: string
  onboardedAt: string | null
  notificationPrefs: NotificationPrefs
}

// ─── Cycle ───────────────────────────────────────────────────────────────────

export interface Cycle {
  id: string
  userId: string
  startDate: string // ISO date "2026-06-01"
  cycleLength: number // default 28
  periodLength: number // default 5
}

// Raw per-user cycle settings (GET /me/cycle) — the inputs to prediction.
export interface CycleSettings {
  startDate: string // ISO date "2026-06-01"
  cycleLength: number // default 28
  periodLength: number // default 5
}

export interface TodayCycleResponse {
  day: number // 1–cycleLength
  phase: PhaseId
  phaseName: string
  phaseColor: string
  containerNumber: 1 | 2 | 3 | 4
  daysRemainingInPhase: number
  isLastDayOfPhase: boolean
  isLastDayOfCycle: boolean
  cycleLength: number
  periodLength: number
}

// ─── Prediction (proportional phase model) ────────────────────────────────────

export interface PhaseRange {
  phase: PhaseId
  startDay: number // 1-based inclusive day within the cycle
  endDay: number // inclusive
  startDate: string // ISO date for this phase in the current cycle
  endDate: string // ISO date (inclusive)
}

export interface CyclePrediction {
  currentDay: number // 1-based day in the current cycle
  currentPhase: PhaseId
  nextPeriodStart: string // ISO date the next cycle begins
  cycleLength: number
  periodLength: number
  phaseRanges: PhaseRange[] // ordered, tiling the current cycle with no gaps
}

export interface ContainerInfo {
  containerNumber: 1 | 2 | 3 | 4
  containerName: string
  phase: PhaseId
  phaseColor: string
  daysRemaining: number
  isLastDay: boolean
}

// Referrals
export interface ReferralCodeResponse {
  code: string
  influencerName: string
  discountPercent: number
}

export interface UserReferralCode {
  code: string
  appliedAt: string
}

// ─── Symptom log ─────────────────────────────────────────────────────────────

export interface SymptomLog {
  id: string
  userId: string
  cycleDay: number
  phase: PhaseId
  symptoms: string[]
  journalNote: string
  mood?: number | null
  energyLevel?: number | null
  sleepHours?: number | string | null // Prisma Decimal serializes to string
  waterGlasses?: number | null
  loggedAt: string
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'paid' | 'fulfilled' | 'refunded'

export interface ShippingAddress {
  line1: string
  line2?: string
  city: string
  province: string
  postalCode: string
  country: string
}

export interface Order {
  id: string
  userId: string
  stripeSessionId: string
  status: OrderStatus
  productSku: 'kit-30day' | 'refill-pouch'
  quantity: number
  totalCents: number
  shippingAddress: ShippingAddress
  fulfillmentTracking: string | null
  createdAt: string
}

// ─── Subscriptions ───────────────────────────────────────────────────────────

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled'

export interface Subscription {
  id: string
  userId: string
  stripeSubscriptionId: string
  status: SubscriptionStatus
  nextBillingDate: string
  interval: string
  createdAt: string
}

// ─── Influencer referrals ─────────────────────────────────────────────────────

export interface InfluencerReferral {
  id: string
  influencerCode: string
  influencerName: string
  commissionRate: number
  totalSales: number
  totalCommissionCents: number
  createdAt: string
}

// ─── API responses ───────────────────────────────────────────────────────────

export interface ApiError {
  error: string
  statusCode: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  perPage: number
}
