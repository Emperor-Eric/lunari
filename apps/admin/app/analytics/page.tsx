'use client'
import React, { useEffect, useState } from 'react'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts'
import { apiGet, downloadCsv } from '@/src/lib/api'
import type { RevenueAnalytics, UserAnalytics, SymptomAnalytics } from '@/src/lib/types'
import { formatCents, shortMonth, shortDay } from '@/src/lib/format'
import { PageHeader, Card, MetricCard, EmptyState, ExportButton } from '@/src/components/ui'

const PHASE_COLORS: Record<string, string> = {
  Menstrual: '#7A1E2E',
  Follicular: '#3D6B4A',
  Ovulatory: '#5B3E8C',
  Luteal: '#7A4A2A',
}

export default function AnalyticsPage() {
  const [revenue, setRevenue] = useState<RevenueAnalytics | null>(null)
  const [users, setUsers] = useState<UserAnalytics | null>(null)
  const [symptoms, setSymptoms] = useState<SymptomAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiGet<RevenueAnalytics>('/admin/analytics/revenue').catch(() => null),
      apiGet<UserAnalytics>('/admin/analytics/users').catch(() => null),
      apiGet<SymptomAnalytics>('/admin/analytics/symptoms').catch(() => null),
    ])
      .then(([r, u, s]) => { setRevenue(r); setUsers(u); setSymptoms(s) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <EmptyState message="Loading…" />

  const monthly = revenue?.monthlyRevenue ?? []
  const dau = users?.dailyActiveUsers ?? []
  const pd = symptoms?.phaseDistribution
  const pieData = pd
    ? [
        { name: 'Menstrual', value: pd.menstrual },
        { name: 'Follicular', value: pd.follicular },
        { name: 'Ovulatory', value: pd.ovulatory },
        { name: 'Luteal', value: pd.luteal },
      ].filter((d) => d.value > 0)
    : []
  const topSymptoms = symptoms?.topSymptoms ?? []

  const hasMonthly = monthly.some((m) => m.amount > 0)
  const hasDau = dau.some((d) => d.count > 0)

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Analytics" />

      {/* Revenue */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-brand-ink">Revenue</h2>
          <ExportButton onClick={() => downloadCsv('/admin/analytics/export?type=revenue', 'lunari-revenue.csv').catch(() => {})} label="Export revenue" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <MetricCard label="Total revenue" value={formatCents(revenue?.totalRevenue ?? 0)} />
          <MetricCard label="This month" value={formatCents(revenue?.monthRevenue ?? 0)} />
          <MetricCard label="Avg order value" value={formatCents(revenue?.avgOrderValue ?? 0)} />
        </div>
        <Card>
          <h3 className="text-sm font-semibold text-brand-ink mb-4">Monthly revenue (12mo)</h3>
          {hasMonthly ? (
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <LineChart data={monthly.map((m) => ({ ...m, label: shortMonth(m.month) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D6" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#6B6460" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#6B6460" tickFormatter={(v) => `$${Number(v) / 100}`} />
                  <Tooltip formatter={(value) => formatCents(Number(value))} />
                  <Line type="monotone" dataKey="amount" stroke="#C9A84C" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="No revenue yet" />
          )}
        </Card>
      </section>

      {/* Users */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-brand-ink">Users</h2>
          <ExportButton onClick={() => downloadCsv('/admin/analytics/export?type=users', 'lunari-users.csv').catch(() => {})} label="Export users" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <MetricCard label="Total users" value={users?.totalUsers ?? 0} />
          <MetricCard label="New this month" value={users?.newUsersMonth ?? 0} />
          <MetricCard label="DAU (7d avg)" value={users?.dau7dayAvg ?? 0} />
        </div>
        <Card>
          <h3 className="text-sm font-semibold text-brand-ink mb-4">Daily active users (30d)</h3>
          {hasDau ? (
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={dau.map((d) => ({ ...d, label: shortDay(d.date) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D6" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#6B6460" interval={6} />
                  <YAxis tick={{ fontSize: 11 }} stroke="#6B6460" allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#5B3E8C" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="No activity yet" />
          )}
        </Card>
      </section>

      {/* Cycle / symptoms */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-brand-ink">Cycle insights</h2>
          <ExportButton onClick={() => downloadCsv('/admin/analytics/export?type=symptoms', 'lunari-symptoms.csv').catch(() => {})} label="Export symptoms" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-sm font-semibold text-brand-ink mb-4">Phase distribution</h3>
            {pieData.length > 0 ? (
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} label>
                      {pieData.map((d) => (
                        <Cell key={d.name} fill={PHASE_COLORS[d.name]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState message="No cycle data yet" />
            )}
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-brand-ink mb-4">Top 10 symptoms</h3>
            {topSymptoms.length > 0 ? (
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <BarChart data={topSymptoms} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D6" />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="#6B6460" allowDecimals={false} />
                    <YAxis type="category" dataKey="symptom" tick={{ fontSize: 11 }} stroke="#6B6460" width={90} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3D6B4A" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState message="No symptom logs yet" />
            )}
          </Card>
        </div>
      </section>
    </div>
  )
}
