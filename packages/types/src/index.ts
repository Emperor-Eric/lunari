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
  startDate: string // ISO date "2026-06-01" — EFFECTIVE anchor (most recent logged period, else onboarding)
  cycleLength: number // default 28 — EFFECTIVE (learned from logged periods when available)
  periodLength: number // CURRENT cycle's menstrual length (pinned to the actual logged end when present)
  projectedPeriodLength: number // learned-average period length — for projecting future cycles
}

// RAW stored onboarding baseline (GET /me/cycle/settings) — what the user edits on Me.
// Distinct from CycleSettings, which is the EFFECTIVE (recalibrated) shape.
export interface RawCycleSettings {
  startDate: string // ISO date "2026-06-01" — the onboarding anchor as stored
  cycleLength: number // 21–45
  periodLength: number // 2–10
}

// A real bleed-start logged by the user (overrides onboarding at prediction time).
export interface PeriodEvent {
  id: string
  userId: string
  startDate: string // ISO date "2026-06-01"
  endDate: string | null // ISO date, null while the period is still open
  createdAt: string
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

// ─── Insights (GET /me/insights) ──────────────────────────────────────────────

export type RegularityLabel = 'regular' | 'somewhat variable' | 'still settling'

export interface InsightsCycleRhythm {
  enough: boolean // >=2 logged starts producing >=1 plausible gap
  avgCycleLength: number | null
  cycleVariation: number | null // ± days
  regularity: RegularityLabel | null
  recentCycleLengths: number[] // up to 6, oldest → newest
  hasPeriodLength: boolean // >=1 ended period
  avgPeriodLength: number | null
}

export interface InsightsPhasePattern {
  phase: PhaseId
  enough: boolean // >=1 log in this phase
  logCount: number
  topSymptoms: { symptom: string; count: number }[] // most-logged first, up to 3
  avgMood: number | null // 1–5
  avgEnergy: number | null // 1–10
}

// ─── Pattern intelligence (additive; older clients ignore these) ──────────────

export type PhaseHalf = 'early' | 'late'

// A recurring symptom-in-phase-half pattern, surfaced only past its threshold.
export interface SymptomTimingPattern {
  symptom: string
  phase: PhaseId
  half: PhaseHalf
  cycles: number // eligible cycles the symptom recurred in
  ofCycles: number // eligible cycles in the denominator
}

// A gentle, non-causal correlation between two logged fields.
export interface InsightsCorrelation {
  pair: 'energy_sleep' | 'mood_sleep'
  enough: boolean
  direction: 'up' | 'down' | null // null unless |rho| >= 0.3 and consistent
  strength: number | null // Spearman rho, rounded; null when not enough
  n: number // paired data points
}

export interface InsightsCycleTrend {
  enough: boolean // >=3 recent cycle lengths
  direction: 'lengthening' | 'shortening' | 'steady' | null
  lengths: number[] // recent cycle lengths, oldest -> newest
}

export interface InsightsResponse {
  cycleRhythm: InsightsCycleRhythm
  phasePatterns: InsightsPhasePattern[] // always 4, in cycle order
  energyPeak: PhaseId | null // phase with highest avg energy (null if no contrast)
  energyDip: PhaseId | null // phase with lowest avg energy
  moodPeak: PhaseId | null
  moodDip: PhaseId | null
  consistency: { daysLogged: number; windowDays: number }
  // Pattern intelligence — optional so existing consumers keep working.
  symptomTiming?: SymptomTimingPattern[] // only patterns past threshold
  correlations?: InsightsCorrelation[] // the two fixed pairs
  cycleTrend?: InsightsCycleTrend
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

// A user-defined symptom chip. Daily logs still store the plain `label` string in
// SymptomLog.symptoms (same as built-ins) — this is just the user's personal palette.
export interface CustomSymptom {
  id: string
  userId: string
  label: string
  archived: boolean
  sortOrder: number
  createdAt: string
}

// Daily bleed intensity, logged on the SymptomLog (independent of PeriodEvents).
export type FlowValue = 'none' | 'spotting' | 'light' | 'medium' | 'heavy'

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
  flow?: FlowValue | null
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
