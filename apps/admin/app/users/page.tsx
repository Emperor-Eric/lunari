'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { apiGet, downloadCsv } from '@/src/lib/api'
import type { Paginated, AdminUser } from '@/src/lib/types'
import { formatDate } from '@/src/lib/format'
import { PageHeader, Card, EmptyState, ExportButton } from '@/src/components/ui'

const FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active7d', label: 'Active 7d' },
  { value: 'active30d', label: 'Active 30d' },
  { value: 'inactive14d', label: 'Inactive 14d+' },
]
const PER_PAGE = 25

export default function UsersPage() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<Paginated<AdminUser> | null>(null)
  const [loading, setLoading] = useState(true)

  const queryString = useCallback(() => {
    const params = new URLSearchParams({ page: String(page) })
    if (filter !== 'all') params.set('filter', filter)
    if (search.trim()) params.set('search', search.trim())
    return params.toString()
  }, [filter, search, page])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setResult(await apiGet<Paginated<AdminUser>>(`/admin/users?${queryString()}`))
    } catch {
      setResult({ data: [], total: 0, page, perPage: PER_PAGE })
    } finally {
      setLoading(false)
    }
  }, [queryString, page])

  useEffect(() => { load() }, [load])

  const exportCsv = () => {
    const params = new URLSearchParams()
    if (filter !== 'all') params.set('filter', filter)
    if (search.trim()) params.set('search', search.trim())
    downloadCsv(`/admin/users/export?${params.toString()}`, 'lunari-users.csv').catch(() => {})
  }

  const users = result?.data ?? []
  const total = result?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))

  return (
    <div>
      <PageHeader title="Users" action={<ExportButton onClick={exportCsv} />} />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setPage(1) }}
            className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
            style={{
              backgroundColor: filter === f.value ? '#2C2825' : '#FFFFFF',
              color: filter === f.value ? '#FFFFFF' : '#6B6460',
              border: '1px solid #E8E2D6',
            }}
          >
            {f.label}
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search name or email"
          className="ml-auto rounded-lg border border-brand-stone bg-white px-3 py-1.5 text-sm w-64 focus:outline-none focus:border-brand-gold"
        />
      </div>

      <Card className="!p-0 overflow-hidden">
        {loading ? (
          <EmptyState message="Loading…" />
        ) : users.length === 0 ? (
          <EmptyState message="No users yet" />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-brand-cream border-b border-brand-stone">
              <tr>
                {['Name', 'Email', 'Joined', 'Last active', 'Phase', 'Cycle day', 'Logs', 'Referral'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-brand-ink-soft uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-brand-stone last:border-0">
                  <td className="px-4 py-3 text-brand-ink">{u.name || '—'}</td>
                  <td className="px-4 py-3 text-brand-ink">{u.email}</td>
                  <td className="px-4 py-3 text-brand-ink-soft">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-brand-ink-soft">{formatDate(u.lastActiveAt)}</td>
                  <td className="px-4 py-3 capitalize text-brand-ink">{u.currentPhase ?? '—'}</td>
                  <td className="px-4 py-3 text-brand-ink">{u.cycleDay ?? '—'}</td>
                  <td className="px-4 py-3 text-brand-ink">{u.totalLogs}</td>
                  <td className="px-4 py-3 font-mono text-xs text-brand-ink-soft">{u.referralCode ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {total > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-brand-ink-soft">
          <span>{total} user{total === 1 ? '' : 's'}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 rounded-lg border border-brand-stone bg-white disabled:opacity-40">Prev</button>
            <span>Page {page} of {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 rounded-lg border border-brand-stone bg-white disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
