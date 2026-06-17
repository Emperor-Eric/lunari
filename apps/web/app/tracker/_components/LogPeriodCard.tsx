'use client'
import React, { useEffect, useState } from 'react'
import { addMonths, format, getDay, getDaysInMonth, parseISO, startOfMonth } from 'date-fns'
import { Toast } from '@lunari/ui'
import type { PeriodEvent } from '@lunari/types'
import { apiGet, apiPost, apiPatch, apiDelete } from '@/src/lib/api'
import type { PredictionSurface } from './NextUpCard'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function ymdFromOffset(days: number): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}
const daysBetween = (a: string, b: string) =>
  Math.abs(Math.round((parseISO(a).getTime() - parseISO(b).getTime()) / 86400000))

/** Compact, on-brand month date picker. Single date; min/max gate selectable days. */
function DatePicker({
  value,
  min,
  max,
  onSelect,
  surface,
}: {
  value: string
  min?: string
  max: string
  onSelect: (ymd: string) => void
  surface: PredictionSurface
}) {
  const { ink, sub, gold } = surface
  const [view, setView] = useState(() => startOfMonth(parseISO(value)))

  const year = view.getFullYear()
  const month = view.getMonth()
  const lead = getDay(startOfMonth(view))
  const cells: (number | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: getDaysInMonth(view) }, (_, i) => i + 1),
  ]
  const ymdOf = (d: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  const navBtn: React.CSSProperties = { fontSize: 16, color: gold, width: 24, height: 24, lineHeight: 1, cursor: 'pointer' }

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
        <button type="button" onClick={() => setView((v) => addMonths(v, -1))} aria-label="Previous month" style={navBtn}>‹</button>
        <span style={{ fontSize: 11.5, color: ink, fontWeight: 600 }}>{format(view, 'MMMM yyyy')}</span>
        <button type="button" onClick={() => setView((v) => addMonths(v, 1))} aria-label="Next month" style={navBtn}>›</button>
      </div>
      <div className="grid grid-cols-7" style={{ gap: 2 }}>
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="text-center" style={{ fontSize: 8, color: sub }}>{w}</div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={`b${i}`} />
          const ymd = ymdOf(d)
          const disabled = (min !== undefined && ymd < min) || ymd > max
          const isSel = ymd === value
          return (
            <button
              key={d}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(ymd)}
              style={{
                aspectRatio: '1 / 1',
                borderRadius: 8,
                fontSize: 10.5,
                border: 'none',
                background: isSel ? gold : 'transparent',
                color: isSel ? '#2C2825' : ink,
                opacity: disabled ? 0.3 : 1,
                cursor: disabled ? 'default' : 'pointer',
              }}
            >
              {d}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** "Log period" control for Today — recalibrates predictions via `onChange`. */
export function LogPeriodCard({ surface, onChange }: { surface: PredictionSurface; onChange: () => void }) {
  const { ink, sub, gold, cardwash, cardbd } = surface
  const [events, setEvents] = useState<PeriodEvent[]>([])
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(() => ymdFromOffset(0))
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const load = () => apiGet<PeriodEvent[]>('/me/period-events').then(setEvents).catch(() => {})
  useEffect(() => { load() }, [])

  const mostRecent = events[0] ?? null
  // Open period = most recent start with no end, within the last 12 days.
  const openPeriod =
    events.find((e) => !e.endDate && daysBetween(ymdFromOffset(0), e.startDate) <= 12) ?? null
  const openStartDate = openPeriod?.startDate ?? ''

  const flash = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), type === 'error' ? 2800 : 1600)
  }
  const reset = () => { setOpen(false); setConfirming(false); setSelected(ymdFromOffset(0)) }

  const doLogStart = async () => {
    setBusy(true)
    try {
      await apiPost('/me/period-events', { startDate: selected })
      await load()
      onChange()
      flash(`Period logged: ${format(parseISO(selected), 'MMM d')}`, 'success')
      reset()
    } catch {
      flash("Couldn't log — try again", 'error')
    } finally {
      setBusy(false)
    }
  }

  const doLogEnd = async () => {
    if (!openPeriod) return
    setBusy(true)
    try {
      await apiPatch(`/me/period-events/${openPeriod.id}`, { endDate: selected })
      await load()
      onChange()
      flash(`Period ended: ${format(parseISO(selected), 'MMM d')}`, 'success')
      reset()
    } catch {
      flash("Couldn't save — try again", 'error')
    } finally {
      setBusy(false)
    }
  }

  const attemptLogStart = () => {
    if (mostRecent && daysBetween(selected, mostRecent.startDate) < 10) {
      setConfirming(true)
      return
    }
    doLogStart()
  }

  // Undo adapts: a just-logged END clears the endDate (reopen); a just-logged START deletes it.
  const undo = async () => {
    if (!mostRecent) return
    setBusy(true)
    try {
      if (mostRecent.endDate) {
        await apiPatch(`/me/period-events/${mostRecent.id}`, { endDate: null })
        await load()
        onChange()
        flash('Reopened', 'success')
      } else {
        await apiDelete(`/me/period-events/${mostRecent.id}`)
        await load()
        onChange()
        flash('Removed', 'success')
      }
    } catch {
      flash("Couldn't undo", 'error')
    } finally {
      setBusy(false)
    }
  }

  const trigger: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '8px 17px',
    borderRadius: 999,
    background: open ? cardwash : 'transparent',
    border: `1px solid ${gold}`,
    color: gold,
    fontSize: 11.5,
    fontWeight: 600,
    letterSpacing: '0.04em',
    cursor: 'pointer',
  }
  const panel: React.CSSProperties = {
    marginTop: 10,
    maxWidth: 340,
    marginLeft: 'auto',
    marginRight: 'auto',
    padding: '14px 16px',
    borderRadius: 14,
    background: cardwash,
    border: `1px solid ${cardbd}`,
    textAlign: 'left',
  }
  const primaryBtn: React.CSSProperties = { fontSize: 11, fontWeight: 600, padding: '8px 16px', borderRadius: 11, background: gold, color: '#2C2825', opacity: busy ? 0.6 : 1 }
  const ghostBtn: React.CSSProperties = { fontSize: 11, padding: '8px 14px', borderRadius: 11, background: 'transparent', color: ink, border: `1px solid ${cardbd}` }

  const gapDays = mostRecent ? daysBetween(selected, mostRecent.startDate) : 0

  return (
    <div>
      {/* Compact, prominent entry point — context-aware label. */}
      <button onClick={() => setOpen((o) => !o)} style={trigger}>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: gold }} />
        {openPeriod ? 'Period ended' : 'Log period'}
      </button>

      {/* Inline expansion. */}
      {open && (
        <div style={panel}>
          {openPeriod ? (
            /* ── END mode: an open period exists → pick the end date ── */
            <>
              <div style={{ fontSize: 11, color: sub, marginBottom: 10 }}>
                Started {format(parseISO(openPeriod.startDate), 'MMM d')} ·{' '}
                <button onClick={undo} disabled={busy} style={{ color: gold, fontWeight: 600 }}>
                  Undo
                </button>
              </div>

              <div className="uppercase" style={{ fontSize: 9, letterSpacing: '0.18em', color: sub, marginBottom: 8 }}>
                When did it end?
              </div>
              <DatePicker
                value={selected}
                min={openStartDate}
                max={ymdFromOffset(0)}
                onSelect={setSelected}
                surface={surface}
              />

              <div className="flex" style={{ gap: 8, marginTop: 10 }}>
                <button onClick={doLogEnd} disabled={busy} style={primaryBtn}>{busy ? 'Saving…' : 'Mark ended'}</button>
                <button onClick={reset} style={ghostBtn}>Cancel</button>
              </div>
            </>
          ) : (
            /* ── START mode: log a new period start ── */
            <>
              {mostRecent ? (
                <div style={{ fontSize: 11, color: sub, marginBottom: 10 }}>
                  {mostRecent.endDate
                    ? `Last period ${format(parseISO(mostRecent.startDate), 'MMM d')}–${format(parseISO(mostRecent.endDate), 'MMM d')}`
                    : `Last logged ${format(parseISO(mostRecent.startDate), 'MMM d')}`}{' '}
                  ·{' '}
                  <button onClick={undo} disabled={busy} style={{ color: gold, fontWeight: 600 }}>
                    Undo
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: 11, color: sub, marginBottom: 10, fontWeight: 300 }}>
                  Log the day your period starts to keep predictions accurate.
                </div>
              )}

              <div className="uppercase" style={{ fontSize: 9, letterSpacing: '0.18em', color: sub, marginBottom: 8 }}>
                When did it start?
              </div>
              <DatePicker
                value={selected}
                max={ymdFromOffset(0)}
                onSelect={(v) => { setSelected(v); setConfirming(false) }}
                surface={surface}
              />

              {confirming ? (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, color: ink, opacity: 0.9 }}>
                    Only {gapDays} day{gapDays === 1 ? '' : 's'} since your last logged period — log anyway?
                  </div>
                  <div className="flex" style={{ gap: 8, marginTop: 8 }}>
                    <button onClick={doLogStart} disabled={busy} style={primaryBtn}>{busy ? 'Logging…' : 'Log anyway'}</button>
                    <button onClick={reset} style={ghostBtn}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex" style={{ gap: 8, marginTop: 10 }}>
                  <button onClick={attemptLogStart} disabled={busy} style={primaryBtn}>{busy ? 'Logging…' : 'Log period'}</button>
                  <button onClick={reset} style={ghostBtn}>Cancel</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  )
}
