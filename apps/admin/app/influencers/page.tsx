'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { apiGet, apiPost, apiPatch, downloadCsv } from '@/src/lib/api'
import type { Influencer } from '@/src/lib/types'
import { formatCents } from '@/src/lib/format'
import { PageHeader, Card, EmptyState, ExportButton } from '@/src/components/ui'

export default function InfluencersPage() {
  const [rows, setRows] = useState<Influencer[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  // Manual, UI-only "total sales" entry (dollars) for the commission-owed calculator.
  const [sales, setSales] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRows(await apiGet<Influencer[]>('/admin/influencers'))
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const toggleActive = async (inf: Influencer) => {
    await apiPatch(`/admin/influencers/${inf.id}`, { active: !inf.active }).catch(() => {})
    await load()
  }

  const editCommission = async (inf: Influencer) => {
    const input = window.prompt('Commission rate (%)', String(Math.round(inf.commissionRate * 100)))
    if (input === null) return
    const pct = Number(input)
    if (Number.isNaN(pct)) return
    await apiPatch(`/admin/influencers/${inf.id}`, { commissionRate: pct }).catch(() => {})
    await load()
  }

  const commissionOwed = (inf: Influencer): string => {
    const dollars = Number(sales[inf.id] ?? '')
    if (Number.isNaN(dollars) || dollars <= 0) return '—'
    return formatCents(Math.round(dollars * 100 * inf.commissionRate))
  }

  return (
    <div>
      <PageHeader
        title="Influencers"
        action={
          <div className="flex gap-2">
            <ExportButton onClick={() => downloadCsv('/admin/influencers/export', 'lunari-influencers.csv').catch(() => {})} />
            <button
              onClick={() => setShowAdd(true)}
              className="px-4 py-2 rounded-lg bg-brand-ink text-white text-sm font-semibold"
            >
              + Add influencer
            </button>
          </div>
        }
      />

      <Card className="!p-0 overflow-hidden">
        {loading ? (
          <EmptyState message="Loading…" />
        ) : rows.length === 0 ? (
          <EmptyState message="No influencers yet" />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-brand-cream border-b border-brand-stone">
              <tr>
                {['Code', 'Name', 'Commission', 'App attributions', 'Total sales ($)', 'Commission owed', 'Active', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-brand-ink-soft uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((inf) => (
                <tr key={inf.id} className="border-b border-brand-stone last:border-0">
                  <td className="px-4 py-3 font-mono font-semibold text-brand-ink">{inf.code}</td>
                  <td className="px-4 py-3 text-brand-ink">{inf.name}</td>
                  <td className="px-4 py-3 text-brand-ink">{Math.round(inf.commissionRate * 100)}%</td>
                  <td className="px-4 py-3 text-brand-ink">{inf.appAttributions}</td>
                  <td className="px-4 py-3">
                    <input
                      value={sales[inf.id] ?? ''}
                      onChange={(e) => setSales((s) => ({ ...s, [inf.id]: e.target.value }))}
                      placeholder="0"
                      inputMode="decimal"
                      className="w-24 rounded-md border border-brand-stone px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-brand-ink">{commissionOwed(inf)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${inf.active ? 'bg-phase-follicular-light text-phase-follicular' : 'bg-brand-stone text-brand-ink-soft'}`}>
                      {inf.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => editCommission(inf)} className="text-xs text-brand-gold font-medium">Edit %</button>
                      <button onClick={() => toggleActive(inf)} className="text-xs text-brand-ink-soft font-medium">
                        {inf.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {showAdd && <AddInfluencerModal onClose={() => setShowAdd(false)} onCreated={async () => { setShowAdd(false); await load() }} />}
    </div>
  )
}

function AddInfluencerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [commission, setCommission] = useState('20')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!code.trim() || !name.trim()) {
      setError('Code and name are required')
      return
    }
    setSaving(true)
    setError('')
    try {
      await apiPost('/admin/influencers', {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        commissionRate: Number(commission) || 20,
      })
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-6 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl text-brand-ink">Add influencer</h2>
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code (e.g. GYMGIRL20)" className="rounded-lg border-2 border-brand-stone px-3 py-2.5 text-sm uppercase focus:outline-none focus:border-brand-gold" />
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="rounded-lg border-2 border-brand-stone px-3 py-2.5 text-sm focus:outline-none focus:border-brand-gold" />
        <label className="text-sm text-brand-ink-soft flex items-center gap-2">
          Commission rate
          <input value={commission} onChange={(e) => setCommission(e.target.value)} inputMode="decimal" className="w-20 rounded-lg border-2 border-brand-stone px-3 py-2 text-sm focus:outline-none focus:border-brand-gold" />
          %
        </label>
        {error && <p className="text-xs text-phase-menstrual">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-brand-stone text-sm text-brand-ink">Cancel</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 rounded-lg bg-brand-ink text-white text-sm font-semibold disabled:opacity-60">
            {saving ? 'Saving…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
