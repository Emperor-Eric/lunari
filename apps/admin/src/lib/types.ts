// Response shapes returned by the /admin API routes.

export interface Paginated<T> {
  data: T[]
  total: number
  page: number
  perPage: number
}

export interface AdminOrder {
  id: string
  userId: string | null
  status: string
  productSku: string
  quantity: number
  totalCents: number
  fulfillmentTracking: string | null
  createdAt: string
  user: { email: string } | null
}

export interface RevenueAnalytics {
  totalRevenue: number
  monthRevenue: number
  avgOrderValue: number
  dailyRevenue: { date: string; amount: number }[]
  monthlyRevenue: { month: string; amount: number }[]
}

export interface UserAnalytics {
  totalUsers: number
  newUsersMonth: number
  dau7dayAvg: number
  dailyActiveUsers: { date: string; count: number }[]
  dailySignups: { date: string; count: number }[]
}

export interface SymptomAnalytics {
  phaseDistribution: {
    menstrual: number
    follicular: number
    ovulatory: number
    luteal: number
  }
  topSymptoms: { symptom: string; count: number }[]
}

export interface Influencer {
  id: string
  code: string
  name: string
  commissionRate: number // stored as a fraction (0.20 = 20%)
  appAttributions: number
  active: boolean
}

export interface AdminUser {
  id: string
  name: string
  email: string
  createdAt: string
  lastActiveAt: string | null
  onboardedAt: string | null
  currentPhase: string | null
  cycleDay: number | null
  totalLogs: number
  referralCode: string | null
}
