'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { apiGet, apiPatch, downloadCsv } from '@/src/lib/api'
import type { Paginated, AdminOrder } from '@/src/lib/types'
import { formatCents, formatDate } from '@/src/lib/format'
import { PageHeader, Card, EmptyState, ExportButton, StatusBadge } from '@/src/components/ui'

const STATUSES = ['all', 'pending', 'paid', 'fulfilled', 'refunded']
const PER_PAGE = 25

export default function OrdersPage() {
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<Paginated<AdminOrder> | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (status !== 'all') params.set('status', status)
    if (search.trim()) params.set('search', search.trim())
    try {
      setResult(await apiGet<Paginated<AdminOrder>>(`/admin/orders?${params.toString()}`))
    } catch {
      setResult({ data: [], total: 0, page, perPage: PER_PAGE })
    } finally {
      setLoading(false)
    }
  }, [status, search, page])

  useEffect(() => {
    load()
  }, [load])

  const updateOrder = async (id: string, patch: { status?: string; fulfillmentTracking?: string }) => {
    try {
      await apiPatch(`/admin/orders/${id}`, patch)
      await load()
    } catch {
      /* ignore — keep current view */
    }
  }

  const exportCsv = () => {
    const params = new URLSearchParams()
    if (status !== 'all') params.set('status', status)
    if (search.trim()) params.set('search', search.trim())
    downloadCsv(`/admin/orders/export?${params.toString()}`, 'lunari-orders.csv').catch(() => {})
  }

  const orders = result?.data ?? []
  const total = result?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))

  return (
    <div>
      <PageHeader title="Orders" action={<ExportButton onClick={exportCsv} />} />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1) }}
            className="px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors"
            style={{
              backgroundColor: status === s ? '#2C2825' : '#FFFFFF',
              color: status === s ? '#FFFFFF' : '#6B6460',
              border: '1px solid #E8E2D6',
            }}
          >
            {s}
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search email or order ID"
          className="ml-auto rounded-lg border border-brand-stone bg-white px-3 py-1.5 text-sm w-64 focus:outline-none focus:border-brand-gold"
        />
      </div>

      <Card className="!p-0 overflow-hidden">
        {loading ? (
          <EmptyState message="Loading…" />
        ) : orders.length === 0 ? (
          <EmptyState message="No orders yet" />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-brand-cream border-b border-brand-stone">
              <tr>
                {['Order', 'Date', 'Email', 'Product', 'Amount', 'Status', 'Tracking', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-brand-ink-soft uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-brand-stone last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-brand-ink-soft">{o.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-brand-ink">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-3 text-brand-ink">{o.user?.email ?? '—'}</td>
                  <td className="px-4 py-3 text-brand-ink-soft">{o.productSku} ×{o.quantity}</td>
                  <td className="px-4 py-3 font-mono text-brand-ink">{formatCents(o.totalCents)}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3 text-brand-ink-soft text-xs">{o.fulfillmentTracking || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={o.status}
                        onChange={(e) => updateOrder(o.id, { status: e.target.value })}
                        className="rounded-md border border-brand-stone bg-white px-2 py-1 text-xs"
                      >
                        {['pending', 'paid', 'fulfilled', 'refunded'].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          const t = window.prompt('Tracking number', o.fulfillmentTracking ?? '')
                          if (t !== null) updateOrder(o.id, { fulfillmentTracking: t })
                        }}
                        className="text-xs text-brand-gold font-medium"
                      >
                        Tracking
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-brand-ink-soft">
          <span>{total} order{total === 1 ? '' : 's'}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-brand-stone bg-white disabled:opacity-40"
            >
              Prev
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-brand-stone bg-white disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
