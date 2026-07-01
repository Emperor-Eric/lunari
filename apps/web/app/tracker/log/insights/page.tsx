'use client'
import React, { useEffect, useState } from 'react'
import {
  getPhaseForDay,
  getPhaseById,
  RHYTHM_NOTE_COPY,
  RHYTHM_FLAG_COPY,
} from '@lunari/phase-data'
import { phases as phaseTheme, phaseKeyFor } from '@lunari/design-tokens'
import { LoadingSpinner } from '@lunari/ui'
import type { InsightsResponse, InsightsCorrelation, PhaseId } from '@lunari/types'
import { apiGet } from '@/src/lib/api'
import { useCycleContext } from '../../cycle-context'
import { LogTabs } from '../_components/LogTabs'

// Fixed Lab neutrals — phase-independent (labBg is light on all four phases).
const N = { section: '#A99E88', title: '#2C2825', text: '#6A655D', sub: '#8A8275' }

const PHASE_ORDER: PhaseId[] = ['menstrual', 'follicular', 'ovulatory', 'luteal']
const labelOf = (p: PhaseId) => phaseTheme[phaseKeyFor(p)].label
const colorOf = (p: PhaseId) => phaseTheme[phaseKeyFor(p)].phase
// "dips while you bleed" reads better than "dips in menstrual".
const inPhase = (p: PhaseId) =>
  p === 'menstrual' ? 'while you bleed' : `in ${labelOf(p).toLowerCase()}`

// Gentle, non-causal correlation copy.
function corrSentence(c: InsightsCorrelation): string {
  const metric = c.pair === 'energy_sleep' ? 'energy' : 'mood'
  const word =
    c.pair === 'energy_sleep'
      ? c.direction === 'up'
        ? 'higher'
        : 'lower'
      : c.direction === 'up'
        ? 'brighter'
        : 'lower'
  return `on nights you sleep more, your ${metric} tends to be ${word}`
}

const trendSentence = (d: 'lengthening' | 'shortening' | 'steady' | null): string =>
  d === 'lengthening'
    ? 'your recent cycles have been getting a little longer'
    : d === 'shortening'
      ? 'your recent cycles have been getting a little shorter'
      : 'your recent cycles have been holding steady'

export default function InsightsPage() {
  const { cycleData } = useCycleContext()
  const phase = cycleData ? getPhaseById(cycleData.phase) : getPhaseForDay(1)
  const t = phaseTheme[phaseKeyFor(phase.id)]

  const [data, setData] = useState<InsightsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGet<InsightsResponse>('/me/insights')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const card: React.CSSProperties = {
    background: t.labCard,
    border: `1px solid ${t.labBorder}`,
    borderRadius: 15,
    padding: 16,
  }
  const sectionLabel: React.CSSProperties = {
    fontSize: 9,
    letterSpacing: '0.2em',
    color: N.section,
    margin: '22px 0 11px',
  }

  const r = data?.cycleRhythm
  const anyPhaseData = data?.phasePatterns.some((p) => p.enough) ?? false

  return (
    <div className="min-h-screen" style={{ backgroundColor: t.labBg }}>
      {/* ── HEADER BAND (matches the check-in form) ── */}
      <div style={{ background: t.header, color: t.headerText }}>
        <div
          className="max-w-xl mx-auto px-6 md:px-10"
          style={{ paddingTop: 18, paddingBottom: 20 }}
        >
          <h1 className="font-display" style={{ fontSize: 27, color: t.headerText }}>
            Insights
          </h1>
          <div
            className="font-body"
            style={{ fontSize: 10.5, marginTop: 4, fontWeight: 300, color: t.headerLabel }}
          >
            Patterns from your logged data
          </div>
          <LogTabs />
        </div>
      </div>

      {/* ── TINTED BODY ── */}
      <div className="max-w-xl mx-auto px-6 md:px-10 pt-2 pb-12 font-body">
        {loading || !data || !r ? (
          <LoadingSpinner phaseColor={t.accent} />
        ) : (
          <>
            {/* ── Cycle rhythm ── */}
            <div className="uppercase" style={sectionLabel}>
              Cycle rhythm
            </div>
            <div style={card}>
              {r.enough ? (
                <>
                  <Statement accent={t.accent}>
                    your cycles average <b>{r.avgCycleLength} days</b> and vary by{' '}
                    <b>±{r.cycleVariation}</b> — {r.regularity}
                  </Statement>
                  {r.hasPeriodLength ? (
                    <Statement accent={t.accent}>
                      your period runs about <b>{r.avgPeriodLength} days</b>
                    </Statement>
                  ) : (
                    <Muted>Log a full period — start to end — to learn your period length.</Muted>
                  )}
                  {r.recentCycleLengths.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div
                        className="uppercase"
                        style={{
                          fontSize: 8.5,
                          letterSpacing: '0.16em',
                          color: N.section,
                          marginBottom: 5,
                        }}
                      >
                        Recent cycles
                      </div>
                      <div style={{ fontSize: 13, color: N.title }}>
                        {r.recentCycleLengths.join(' · ')}{' '}
                        <span style={{ color: N.sub, fontSize: 11 }}>days</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Unlock>Log at least 2 period starts to unlock your cycle rhythm.</Unlock>
              )}
            </div>

            {/* ── How you feel by phase ── */}
            <div className="uppercase" style={sectionLabel}>
              How you feel by phase
            </div>
            <div style={card}>
              {anyPhaseData ? (
                <>
                  {data.energyPeak && data.energyDip && (
                    <Statement accent={t.accent}>
                      energy peaks {inPhase(data.energyPeak)}, dips {inPhase(data.energyDip)}
                    </Statement>
                  )}
                  {data.moodPeak && data.moodDip && (
                    <Statement accent={t.accent}>
                      mood lifts {inPhase(data.moodPeak)}, settles {inPhase(data.moodDip)}
                    </Statement>
                  )}

                  <div className="flex flex-col" style={{ gap: 14, marginTop: 14 }}>
                    {PHASE_ORDER.map((p) => {
                      const pat = data.phasePatterns.find((x) => x.phase === p)
                      if (!pat) return null
                      return (
                        <div key={p}>
                          <div className="flex items-baseline justify-between">
                            <div
                              className="font-display"
                              style={{ fontSize: 14.5, color: colorOf(p) }}
                            >
                              {labelOf(p)}
                            </div>
                            <div style={{ fontSize: 10, color: N.sub }}>
                              {pat.enough
                                ? `${pat.logCount} ${pat.logCount === 1 ? 'log' : 'logs'}`
                                : 'no logs yet'}
                            </div>
                          </div>
                          {pat.enough ? (
                            <>
                              {pat.topSymptoms.length > 0 && (
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: N.text,
                                    marginTop: 2,
                                    fontWeight: 300,
                                  }}
                                >
                                  {pat.topSymptoms.map((s) => s.symptom).join(', ')}
                                </div>
                              )}
                              <div className="flex" style={{ gap: 16, marginTop: 8 }}>
                                <MiniBar
                                  label="mood"
                                  value={pat.avgMood}
                                  max={5}
                                  color={colorOf(p)}
                                  track={t.labTrack}
                                />
                                <MiniBar
                                  label="energy"
                                  value={pat.avgEnergy}
                                  max={10}
                                  color={colorOf(p)}
                                  track={t.labTrack}
                                />
                              </div>
                            </>
                          ) : (
                            <div
                              style={{ fontSize: 11, color: N.sub, marginTop: 2, fontWeight: 300 }}
                            >
                              Keep logging through this phase to see its patterns.
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <Unlock>Log how you feel across a full cycle to see patterns by phase.</Unlock>
              )}
            </div>

            {/* ── Symptom timing ── */}
            <div className="uppercase" style={sectionLabel}>
              Symptom timing
            </div>
            <div style={card}>
              {(data.symptomTiming ?? []).length > 0 ? (
                (data.symptomTiming ?? []).map((p, i) => (
                  <Statement key={`${p.phase}-${p.half}-${p.symptom}-${i}`} accent={t.accent}>
                    you've often logged <b>{p.symptom}</b> in your {p.half}{' '}
                    {labelOf(p.phase).toLowerCase()} phase — {p.cycles} of your last {p.ofCycles}{' '}
                    cycles
                  </Statement>
                ))
              ) : (
                <Unlock>Keep logging through a few cycles to spot your symptom patterns.</Unlock>
              )}
            </div>

            {/* ── What moves together (correlations) ── */}
            <div className="uppercase" style={sectionLabel}>
              What moves together
            </div>
            <div style={card}>
              {(() => {
                const shown = (data.correlations ?? []).filter((c) => c.enough && c.direction)
                return shown.length > 0 ? (
                  <>
                    {shown.map((c) => (
                      <Statement key={c.pair} accent={t.accent}>
                        {corrSentence(c)}
                      </Statement>
                    ))}
                    <Muted>A gentle observation from your logs — not medical advice.</Muted>
                  </>
                ) : (
                  <Unlock>
                    Log your sleep alongside mood and energy to see what tends to move together.
                  </Unlock>
                )
              })()}
            </div>

            {/* ── Cycle trends ── */}
            <div className="uppercase" style={sectionLabel}>
              Cycle trends
            </div>
            <div style={card}>
              {data.cycleTrend?.enough ? (
                <Statement accent={t.accent}>{trendSentence(data.cycleTrend.direction)}</Statement>
              ) : (
                <Unlock>Log a few more cycles to see how your cycle length is trending.</Unlock>
              )}
            </div>

            {/* ── Your rhythm (gentle, non-diagnostic) ── */}
            {data.rhythmNote && data.rhythmNote.state !== 'insufficient' && (
              <>
                <div className="uppercase" style={sectionLabel}>
                  Your rhythm
                </div>
                <div style={card}>
                  {data.rhythmNote.state === 'observation' ? (
                    <>
                      {data.rhythmNote.flags.map((flag) => (
                        <Statement key={flag} accent={t.accent}>
                          {RHYTHM_FLAG_COPY[flag]}
                        </Statement>
                      ))}
                      <Muted>{RHYTHM_NOTE_COPY.disclaimer}</Muted>
                    </>
                  ) : (
                    <Statement accent={t.accent}>{RHYTHM_NOTE_COPY.steady}</Statement>
                  )}
                </div>
              </>
            )}

            {/* ── Consistency ── */}
            <div className="uppercase" style={sectionLabel}>
              Consistency
            </div>
            <div style={card}>
              <div style={{ fontSize: 13, color: N.title }}>
                You've logged{' '}
                <b style={{ color: t.accent }}>
                  {data.consistency.daysLogged} of the last {data.consistency.windowDays} days
                </b>
                .
              </div>
              <Muted>The more you log, the sharper these patterns become.</Muted>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Statement({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <div className="flex" style={{ gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
      <span style={{ color: accent, fontSize: 13, lineHeight: '20px' }}>·</span>
      <span style={{ fontSize: 13, color: N.title, lineHeight: 1.5 }}>{children}</span>
    </div>
  )
}

function Muted({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, color: N.sub, fontWeight: 300, lineHeight: 1.5, marginTop: 8 }}>
      {children}
    </div>
  )
}

function Unlock({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, color: N.text, fontWeight: 300, lineHeight: 1.6 }}>
      <span style={{ fontSize: 14, marginRight: 6 }}>◌</span>
      {children}
    </div>
  )
}

function MiniBar({
  label,
  value,
  max,
  color,
  track,
}: {
  label: string
  value: number | null
  max: number
  color: string
  track: string
}) {
  const pct = value == null ? 0 : Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div style={{ flex: 1 }}>
      <div className="flex justify-between" style={{ marginBottom: 4 }}>
        <span
          style={{
            fontSize: 8.5,
            letterSpacing: '0.08em',
            color: N.section,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
        <span style={{ fontSize: 9, color: N.sub }}>{value == null ? '—' : `${value}/${max}`}</span>
      </div>
      <div style={{ height: 5, background: track, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
    </div>
  )
}
