'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { PhaseChip, LogCard, EmptyState, LoadingSpinner } from '@lunari/ui'
import { getPhaseForDay, getPhaseById, FLOW_OPTIONS } from '@lunari/phase-data'
import { phases as phaseTheme, phaseKeyFor } from '@lunari/design-tokens'
import type { SymptomLog } from '@lunari/types'
import { apiFetch } from '@/src/lib/api'
import { useCycleContext } from '../../cycle-context'
import { LogTabs } from '../_components/LogTabs'

const PER_PAGE = 20

export default function HistoryPage() {
  const { cycleData } = useCycleContext()
  const phase = cycleData ? getPhaseById(cycleData.phase) : getPhaseForDay(1)
  const t = phaseTheme[phaseKeyFor(phase.id)]

  const [logs, setLogs] = useState<SymptomLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchLogs = useCallback(async (pageNum: number) => {
    setLoading(true)
    try {
      const res = await apiFetch(`/me/logs?page=${pageNum}&perPage=${PER_PAGE}`)
      if (res.ok) {
        const data = await res.json()
        setLogs((prev) => (pageNum === 1 ? data.data : [...prev, ...data.data]))
        setTotal(data.total)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs(1)
  }, [fetchLogs])

  // The history table + fetch are unchanged — only wrapped so the header/tabs persist.
  const body =
    loading && logs.length === 0 ? (
      <LoadingSpinner />
    ) : logs.length === 0 ? (
      <EmptyState title="No logs yet" subtitle="Your check-ins will appear here." />
    ) : (
      <>
        {/* Desktop table */}
        <div className="hidden md:block bg-white rounded-2xl border border-brand-stone overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-brand-cream border-b border-brand-stone">
              <tr>
                {['Date', 'Phase', 'Symptoms', 'Flow', 'Mood', 'Energy', 'Note'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 font-semibold text-brand-ink-soft text-xs uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-brand-stone last:border-0 hover:bg-brand-cream/50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-brand-ink">
                    {format(new Date(log.loggedAt), 'MMM d')}
                  </td>
                  <td className="px-4 py-3">
                    <PhaseChip phase={log.phase} />
                  </td>
                  <td className="px-4 py-3 text-brand-ink-soft text-xs">
                    {log.symptoms.slice(0, 2).join(', ')}
                    {log.symptoms.length > 2 && ` +${log.symptoms.length - 2}`}
                  </td>
                  <td className="px-4 py-3 text-brand-ink-soft text-xs">
                    {log.flow && log.flow !== 'none'
                      ? (FLOW_OPTIONS.find((o) => o.value === log.flow)?.label ?? '—')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-brand-ink-soft">
                    {(log as SymptomLog & { mood?: number }).mood ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-brand-ink-soft">
                    {(log as SymptomLog & { energyLevel?: number }).energyLevel ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-brand-ink-soft text-xs max-w-[160px] truncate">
                    {log.journalNote || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden flex flex-col gap-3">
          {logs.map((log) => (
            <LogCard key={log.id} log={log} />
          ))}
        </div>

        {/* Pagination */}
        {logs.length < total && (
          <button
            onClick={() => {
              const next = page + 1
              setPage(next)
              fetchLogs(next)
            }}
            disabled={loading}
            className="mt-6 w-full py-3 rounded-xl border-2 border-brand-stone text-sm font-medium text-brand-ink hover:bg-white transition-colors"
          >
            {loading ? 'Loading…' : `Load more (${total - logs.length} remaining)`}
          </button>
        )}
      </>
    )

  return (
    <div className="min-h-screen" style={{ backgroundColor: t.labBg }}>
      {/* ── HEADER BAND (phase gradient — matches the check-in form) ── */}
      <div style={{ background: t.header, color: t.headerText }}>
        <div
          className="max-w-3xl mx-auto px-6 md:px-10"
          style={{ paddingTop: 18, paddingBottom: 20 }}
        >
          <h1 className="font-display" style={{ fontSize: 27, color: t.headerText }}>
            History
          </h1>
          <div
            className="font-body"
            style={{ fontSize: 10.5, marginTop: 4, fontWeight: 300, color: t.headerLabel }}
          >
            Your past daily check-ins
          </div>
          <LogTabs />
        </div>
      </div>

      {/* ── TINTED BODY ── */}
      <div className="max-w-3xl mx-auto px-6 md:px-10 pt-6 pb-12">{body}</div>
    </div>
  )
}
