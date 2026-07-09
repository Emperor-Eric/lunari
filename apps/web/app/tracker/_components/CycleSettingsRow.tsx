'use client'
import React, { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Toast } from '@lunari/ui'
import type { RawCycleSettings } from '@lunari/types'
import { apiGet, apiPost } from '@/src/lib/api'
import { DatePicker, onColor } from './LogPeriodCard'

const CYCLE_MIN = 21
const CYCLE_MAX = 45
const PERIOD_MIN = 2
const PERIOD_MAX = 10
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

function todayYmd(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

/**
 * Settings row + inline editor for the RAW onboarding cycle (length, period, start).
 * Reads/writes the stored Cycle row (GET /me/cycle/settings · POST /me/cycle), NOT the
 * EFFECTIVE values from GET /me/cycle. Saving recalibrates the app via `onSaved`.
 */
export function CycleSettingsRow({
  ink,
  sub,
  chev,
  gold,
  cardwash,
  cardbd,
  rowBorder,
  isLast,
  onSaved,
}: {
  ink: string
  sub: string
  chev: string
  gold: string
  cardwash: string
  cardbd: string
  rowBorder: string
  isLast?: boolean
  onSaved: () => void
}) {
  const [open, setOpen] = useState(false)
  const [startDate, setStartDate] = useState(() => todayYmd())
  const [cycleLength, setCycleLength] = useState(28)
  const [periodLength, setPeriodLength] = useState(5)
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const surface = { ink, sub, gold, cardwash, cardbd }

  const flash = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), type === 'error' ? 2800 : 1600)
  }

  // Lazy-load the RAW baseline the first time the editor opens.
  const openEditor = async () => {
    setOpen((o) => !o)
    if (loaded || open) return
    try {
      const raw = await apiGet<RawCycleSettings>('/me/cycle/settings')
      setStartDate(raw.startDate)
      setCycleLength(raw.cycleLength)
      setPeriodLength(raw.periodLength)
      setLoaded(true)
    } catch {
      /* leave defaults */
    }
  }

  const save = async () => {
    setBusy(true)
    try {
      await apiPost('/me/cycle', { startDate, cycleLength, periodLength })
      onSaved()
      flash('Cycle settings updated', 'success')
      setOpen(false)
    } catch {
      flash("Couldn't save — try again", 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ borderBottom: isLast ? 'none' : `1px solid ${rowBorder}` }}>
      <button
        onClick={openEditor}
        className="flex justify-between items-center w-full"
        style={{
          padding: '14px 0',
          fontFamily: 'var(--font-display, serif)',
          fontSize: 15.5,
          color: ink,
        }}
      >
        <span className="font-display">Cycle settings</span>
        <span
          className="font-body"
          style={{
            color: chev,
            transform: open ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.15s',
          }}
        >
          ›
        </span>
      </button>

      {open && (
        <div
          style={{
            background: cardwash,
            border: `1px solid ${cardbd}`,
            borderRadius: 14,
            padding: 16,
            margin: '0 0 14px',
          }}
        >
          <Stepper
            label="Cycle length"
            unit="days"
            value={cycleLength}
            min={CYCLE_MIN}
            max={CYCLE_MAX}
            onChange={(n) => setCycleLength(clamp(n, CYCLE_MIN, CYCLE_MAX))}
            ink={ink}
            sub={sub}
            gold={gold}
            cardbd={cardbd}
          />
          <div style={{ height: 12 }} />
          <Stepper
            label="Period length"
            unit="days"
            value={periodLength}
            min={PERIOD_MIN}
            max={PERIOD_MAX}
            onChange={(n) => setPeriodLength(clamp(n, PERIOD_MIN, PERIOD_MAX))}
            ink={ink}
            sub={sub}
            gold={gold}
            cardbd={cardbd}
          />

          <div
            className="uppercase"
            style={{ fontSize: 9, letterSpacing: '0.18em', color: sub, margin: '16px 0 8px' }}
          >
            Cycle start date
          </div>
          <DatePicker
            value={startDate}
            max={todayYmd()}
            onSelect={setStartDate}
            surface={surface}
          />
          <div style={{ fontSize: 11, color: sub, marginTop: 6 }}>
            Anchored to {format(parseISO(startDate), 'MMM d, yyyy')}
          </div>

          <div
            style={{ fontSize: 10.5, color: sub, fontWeight: 300, lineHeight: 1.5, marginTop: 12 }}
          >
            These are your baseline — logged periods refine predictions over time.
          </div>

          <div className="flex" style={{ gap: 8, marginTop: 12 }}>
            <button
              onClick={save}
              disabled={busy}
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '8px 16px',
                borderRadius: 11,
                background: gold,
                color: onColor(gold),
                opacity: busy ? 0.6 : 1,
              }}
            >
              {busy ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => setOpen(false)}
              style={{
                fontSize: 11,
                padding: '8px 14px',
                borderRadius: 11,
                background: 'transparent',
                color: ink,
                border: `1px solid ${cardbd}`,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  )
}

function Stepper({
  label,
  unit,
  value,
  min,
  max,
  onChange,
  ink,
  sub,
  gold,
  cardbd,
}: {
  label: string
  unit: string
  value: number
  min: number
  max: number
  onChange: (n: number) => void
  ink: string
  sub: string
  gold: string
  cardbd: string
}) {
  const btn = (disabled: boolean): React.CSSProperties => ({
    width: 30,
    height: 30,
    borderRadius: 9,
    border: `1px solid ${cardbd}`,
    color: gold,
    fontSize: 17,
    lineHeight: 1,
    background: 'transparent',
    opacity: disabled ? 0.35 : 1,
    cursor: disabled ? 'default' : 'pointer',
  })
  return (
    <div className="flex items-center justify-between">
      <div>
        <div style={{ fontSize: 13, color: ink }}>{label}</div>
        <div style={{ fontSize: 10, color: sub }}>{unit}</div>
      </div>
      <div className="flex items-center" style={{ gap: 10 }}>
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
          style={btn(value <= min)}
        >
          −
        </button>
        <span
          className="font-display"
          style={{ fontSize: 19, color: ink, minWidth: 26, textAlign: 'center' }}
        >
          {value}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
          style={btn(value >= max)}
        >
          +
        </button>
      </div>
    </div>
  )
}
