'use client'
import React, { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Toast } from '@lunari/ui'
import type { PeriodEvent } from '@lunari/types'
import { apiGet, apiPost, apiDelete } from '@/src/lib/api'
import type { PredictionSurface } from './NextUpCard'

const OFFSETS = [0, 1, 2, 3, 5, 7, 14]

function ymdFromOffset(days: number): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}
const offsetLabel = (d: number) => (d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d}d ago`)
const daysBetween = (a: string, b: string) =>
  Math.abs(Math.round((parseISO(a).getTime() - parseISO(b).getTime()) / 86400000))

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
  const flash = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), type === 'error' ? 2800 : 1600)
  }
  const reset = () => { setOpen(false); setConfirming(false); setSelected(ymdFromOffset(0)) }

  const doLog = async () => {
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

  const attemptLog = () => {
    if (mostRecent && daysBetween(selected, mostRecent.startDate) < 10) {
      setConfirming(true)
      return
    }
    doLog()
  }

  const undo = async () => {
    if (!mostRecent) return
    setBusy(true)
    try {
      await apiDelete(`/me/period-events/${mostRecent.id}`)
      await load()
      onChange()
      flash('Removed', 'success')
    } catch {
      flash("Couldn't undo", 'error')
    } finally {
      setBusy(false)
    }
  }

  const card: React.CSSProperties = { padding: '14px 16px', borderRadius: 14, background: cardwash, border: `1px solid ${cardbd}` }
  const chip = (on: boolean): React.CSSProperties => ({
    fontSize: 10.5,
    padding: '6px 11px',
    borderRadius: 18,
    background: on ? gold : 'transparent',
    color: on ? '#2C2825' : ink,
    border: `1px solid ${on ? 'transparent' : cardbd}`,
    cursor: 'pointer',
  })
  const primaryBtn: React.CSSProperties = { fontSize: 11, fontWeight: 600, padding: '8px 16px', borderRadius: 11, background: gold, color: '#2C2825', opacity: busy ? 0.6 : 1 }
  const ghostBtn: React.CSSProperties = { fontSize: 11, padding: '8px 14px', borderRadius: 11, background: 'transparent', color: ink, border: `1px solid ${cardbd}` }

  const gapDays = mostRecent ? daysBetween(selected, mostRecent.startDate) : 0

  return (
    <div style={card}>
      <div className="flex justify-between items-baseline">
        <span className="uppercase" style={{ fontSize: 9, letterSpacing: '0.22em', color: gold, fontWeight: 600 }}>
          Period start
        </span>
        {!open && (
          <button onClick={() => setOpen(true)} style={{ fontSize: 10.5, color: gold, fontWeight: 600 }}>
            Log period
          </button>
        )}
      </div>

      {!open && mostRecent && (
        <div style={{ fontSize: 11, color: sub, marginTop: 6 }}>
          Period logged: {format(parseISO(mostRecent.startDate), 'MMM d')} ·{' '}
          <button onClick={undo} disabled={busy} style={{ color: gold, fontWeight: 600 }}>
            Undo
          </button>
        </div>
      )}
      {!open && !mostRecent && (
        <div style={{ fontSize: 11, color: sub, marginTop: 6, fontWeight: 300 }}>
          Log the day your period starts to keep predictions accurate.
        </div>
      )}

      {open && (
        <div style={{ marginTop: 10 }}>
          <div className="uppercase" style={{ fontSize: 9, letterSpacing: '0.18em', color: sub, marginBottom: 8 }}>
            When did it start?
          </div>
          <div className="flex flex-wrap" style={{ gap: 6 }}>
            {OFFSETS.map((o) => {
              const v = ymdFromOffset(o)
              return (
                <button key={o} onClick={() => { setSelected(v); setConfirming(false) }} style={chip(selected === v)}>
                  {offsetLabel(o)}
                </button>
              )
            })}
          </div>

          {confirming ? (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 11, color: ink, opacity: 0.9 }}>
                Only {gapDays} day{gapDays === 1 ? '' : 's'} since your last logged period — log anyway?
              </div>
              <div className="flex" style={{ gap: 8, marginTop: 8 }}>
                <button onClick={doLog} disabled={busy} style={primaryBtn}>{busy ? 'Logging…' : 'Log anyway'}</button>
                <button onClick={reset} style={ghostBtn}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex" style={{ gap: 8, marginTop: 10 }}>
              <button onClick={attemptLog} disabled={busy} style={primaryBtn}>{busy ? 'Logging…' : 'Log period'}</button>
              <button onClick={reset} style={ghostBtn}>Cancel</button>
            </div>
          )}
        </div>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  )
}
