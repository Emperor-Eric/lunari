'use client'
import React, { useEffect, useState } from 'react'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { apiGet } from '@/src/lib/api'
import type { RevenueAnalytics, UserAnalytics, Paginated, AdminOrder } from '@/src/lib/types'
import { formatCents, shortDay } from '@/src/lib/format'
import { Card, MetricCard, EmptyState, PageHeader } from '@/src/components/ui'

function isThisMonth(iso: string): boolean {
  const d = new Date(iso)
  const now = new Date()
  return d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth()
}

export default function OverviewPage() {
  const [revenue, setRevenue] = useState<RevenueAnalytics | null>(null)
  const [users, setUsers] = useState<UserAnalytics | null>(null)
  const [unitsMonth, setUnitsMonth] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiGet<RevenueAnalytics>('/admin/analytics/revenue').catch(() => null),
      apiGet<UserAnalytics>('/admin/analytics/users').catch(() => null),
      apiGet<Paginated<AdminOrder>>('/admin/orders?status=paid').catch(() => null),
    ])
      .then(([rev, usr, orders]) => {
        setRevenue(rev)
        setUsers(usr)
        if (orders) {
          const units = orders.data
            .filter((o) => isThisMonth(o.createdAt))
            .reduce((sum, o) => sum + o.quantity, 0)
          setUnitsMonth(units)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <EmptyState message="Loading…" />

  const dailyRevenue = revenue?.dailyRevenue ?? []
  const dailySignups = users?.dailySignups ?? []
  const hasRevenue = dailyRevenue.some((d) => d.amount > 0)
  const hasSignups = dailySignups.some((d) => d.count > 0)

  return (
    <div>
      <PageHeader title="Overview" />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Revenue this month" value={formatCents(revenue?.monthRevenue ?? 0)} />
        <MetricCard label="Units sold this month" value={unitsMonth} />
        <MetricCard label="Active users (7d avg)" value={users?.dau7dayAvg ?? 0} />
        <MetricCard label="Total users" value={users?.totalUsers ?? 0} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-sm font-semibold text-brand-ink mb-4">Daily revenue (30d)</h2>
          {hasRevenue ? (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <LineChart data={dailyRevenue.map((d) => ({ ...d, label: shortDay(d.date) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D6" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#6B6460" interval={6} />
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

        <Card>
          <h2 className="text-sm font-semibold text-brand-ink mb-4">Daily signups (30d)</h2>
          {hasSignups ? (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={dailySignups.map((d) => ({ ...d, label: shortDay(d.date) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D6" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#6B6460" interval={6} />
                  <YAxis tick={{ fontSize: 11 }} stroke="#6B6460" allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3D6B4A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="No signups yet" />
          )}
        </Card>
      </div>
    </div>
  )
}
