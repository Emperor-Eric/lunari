'use client'
import React from 'react'
import { getCyclePrediction } from '@lunari/phase-data'
import { phases as phaseTheme, phaseKeyFor } from '@lunari/design-tokens'
import type { CycleSettings, PhaseId } from '@lunari/types'
import { differenceInCalendarDays, format, parseISO } from 'date-fns'

// Frost-on-flood palette injected by the host screen so this block is
// self-contained + relocatable (Today passes its flood-derived colors).
export interface PredictionSurface {
  ink: string
  sub: string
  gold: string
  cardwash: string
  cardbd: string
}

const phaseLabel = (id: PhaseId) => phaseTheme[phaseKeyFor(id)].label

/**
 * "Next up" — a glanceable, estimate-framed prediction summary.
 * Pure: derives everything from getCyclePrediction (no fetching here).
 */
export function NextUpCard({
  settings,
  surface,
}: {
  settings: CycleSettings | null
  surface: PredictionSurface
}) {
  const { ink, sub, gold, cardwash, cardbd } = surface
  const cardStyle: React.CSSProperties = {
    padding: '14px 16px',
    borderRadius: 14,
    background: cardwash,
    border: `1px solid ${cardbd}`,
  }

  if (!settings) {
    return (
      <div style={cardStyle}>
        <div className="uppercase" style={{ fontSize: 9, letterSpacing: '0.22em', color: gold, fontWeight: 600 }}>
          Next up
        </div>
        <div style={{ fontSize: 12, color: ink, opacity: 0.85, marginTop: 6, fontWeight: 300 }}>
          Predictions appear once your cycle is set up.
        </div>
      </div>
    )
  }

  const pred = getCyclePrediction(settings)
  const today = new Date()
  const nextStart = parseISO(pred.nextPeriodStart)
  const daysToNext = Math.max(1, differenceInCalendarDays(nextStart, today))

  // Current phase window + transition into the next phase.
  const idx = pred.phaseRanges.findIndex((r) => r.phase === pred.currentPhase)
  const curRange = idx >= 0 ? pred.phaseRanges[idx] : undefined
  const daysLeftInPhase = curRange ? curRange.endDay - pred.currentDay : 0
  const nextRange = idx >= 0 ? pred.phaseRanges[idx + 1] : undefined
  const nextPhaseId: PhaseId = nextRange ? nextRange.phase : 'menstrual' // luteal → next cycle's menstrual
  const nextPhaseStart = nextRange ? parseISO(nextRange.startDate) : nextStart

  const curLabel = phaseLabel(pred.currentPhase)
  const plural = (n: number) => (n === 1 ? '' : 's')

  return (
    <div style={cardStyle}>
      <div className="flex justify-between items-baseline">
        <span className="uppercase" style={{ fontSize: 9, letterSpacing: '0.22em', color: gold, fontWeight: 600 }}>
          Next up
        </span>
        <span style={{ fontSize: 9, color: sub, letterSpacing: '0.08em' }}>estimated</span>
      </div>

      {/* Next period */}
      <div className="flex justify-between items-baseline" style={{ marginTop: 8 }}>
        <span style={{ fontSize: 12, color: ink, opacity: 0.85, fontWeight: 300 }}>Next period in</span>
        <span className="font-display" style={{ fontSize: 22, color: ink, lineHeight: 1 }}>
          ~{daysToNext} day{plural(daysToNext)}
        </span>
      </div>
      <div style={{ fontSize: 11, color: sub, marginTop: 3 }}>predicted {format(nextStart, 'EEE, MMM d')}</div>

      {/* Phase transition */}
      <div style={{ height: 1, background: cardbd, margin: '11px 0' }} />
      <div style={{ fontSize: 11.5, color: ink, opacity: 0.9, fontWeight: 300, lineHeight: 1.5 }}>
        {daysLeftInPhase > 0 ? (
          <>
            {curLabel} for ~{daysLeftInPhase} more day{plural(daysLeftInPhase)}
          </>
        ) : (
          <>Last estimated day of {curLabel}</>
        )}
        {' · '}
        <span style={{ color: gold }}>{phaseLabel(nextPhaseId)}</span> starts ~{format(nextPhaseStart, 'EEE, MMM d')}
      </div>

      <div style={{ fontSize: 9, color: sub, marginTop: 10, opacity: 0.85 }}>
        Estimated from your cycle — not a medical prediction.
      </div>
    </div>
  )
}
