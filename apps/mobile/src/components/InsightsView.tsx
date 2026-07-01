import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { useAuth } from '@lunari/utils'
import { phases as phaseTheme, phaseKeyFor } from '@lunari/design-tokens'
import { LoadingSpinner } from '@lunari/ui'
import { RHYTHM_NOTE_COPY, RHYTHM_FLAG_COPY } from '@lunari/phase-data'
import type { InsightsResponse, InsightsCorrelation, PhaseId } from '@lunari/types'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/v1'

const N = { section: '#A99E88', title: '#2C2825', text: '#6A655D', sub: '#8A8275' }

const PHASE_ORDER: PhaseId[] = ['menstrual', 'follicular', 'ovulatory', 'luteal']
const labelOf = (p: PhaseId) => phaseTheme[phaseKeyFor(p)].label
const colorOf = (p: PhaseId) => phaseTheme[phaseKeyFor(p)].phase
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

type Theme = (typeof phaseTheme)[keyof typeof phaseTheme]

/** Read-only "Symptom & cycle insights" view — body-literacy patterns from logged data. */
export function InsightsView({ t }: { t: Theme }) {
  const { session } = useAuth()
  const [data, setData] = useState<InsightsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!session) return
    try {
      const res = await fetch(`${API_URL}/me/insights`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) setData(await res.json())
    } catch {
      /* leave null → calm empty state */
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    load()
  }, [load])

  if (loading || !data) return <LoadingSpinner phaseColor={t.accent} />

  const r = data.cycleRhythm
  const anyPhaseData = data.phasePatterns.some((p) => p.enough)
  const cardStyle = [styles.card, { backgroundColor: t.labCard, borderColor: t.labBorder }]

  return (
    <ScrollView contentContainerStyle={styles.body}>
      {/* ── Cycle rhythm ── */}
      <Text style={[styles.sectionLabel, { color: N.section }]}>Cycle rhythm</Text>
      <View style={cardStyle}>
        {r.enough ? (
          <>
            <Statement accent={t.accent}>
              your cycles average <Text style={styles.bold}>{r.avgCycleLength} days</Text> and vary
              by <Text style={styles.bold}>±{r.cycleVariation}</Text> — {r.regularity}
            </Statement>
            {r.hasPeriodLength ? (
              <Statement accent={t.accent}>
                your period runs about <Text style={styles.bold}>{r.avgPeriodLength} days</Text>
              </Statement>
            ) : (
              <Text style={[styles.muted, { color: N.sub }]}>
                Log a full period — start to end — to learn your period length.
              </Text>
            )}
            {r.recentCycleLengths.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={[styles.miniLabel, { color: N.section }]}>RECENT CYCLES</Text>
                <Text style={[styles.recent, { color: N.title }]}>
                  {r.recentCycleLengths.join(' · ')}{' '}
                  <Text style={{ color: N.sub, fontSize: 11 }}>days</Text>
                </Text>
              </View>
            )}
          </>
        ) : (
          <Unlock>Log at least 2 period starts to unlock your cycle rhythm.</Unlock>
        )}
      </View>

      {/* ── How you feel by phase ── */}
      <Text style={[styles.sectionLabel, styles.gap, { color: N.section }]}>
        How you feel by phase
      </Text>
      <View style={cardStyle}>
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

            <View style={{ gap: 14, marginTop: 14 }}>
              {PHASE_ORDER.map((p) => {
                const pat = data.phasePatterns.find((x) => x.phase === p)
                if (!pat) return null
                return (
                  <View key={p}>
                    <View style={styles.phaseHead}>
                      <Text style={[styles.phaseName, { color: colorOf(p) }]}>{labelOf(p)}</Text>
                      <Text style={[styles.phaseCount, { color: N.sub }]}>
                        {pat.enough
                          ? `${pat.logCount} ${pat.logCount === 1 ? 'log' : 'logs'}`
                          : 'no logs yet'}
                      </Text>
                    </View>
                    {pat.enough ? (
                      <>
                        {pat.topSymptoms.length > 0 && (
                          <Text style={[styles.symptoms, { color: N.text }]}>
                            {pat.topSymptoms.map((s) => s.symptom).join(', ')}
                          </Text>
                        )}
                        <View style={styles.bars}>
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
                        </View>
                      </>
                    ) : (
                      <Text style={[styles.phaseEmpty, { color: N.sub }]}>
                        Keep logging through this phase to see its patterns.
                      </Text>
                    )}
                  </View>
                )
              })}
            </View>
          </>
        ) : (
          <Unlock>Log how you feel across a full cycle to see patterns by phase.</Unlock>
        )}
      </View>

      {/* ── Symptom timing ── */}
      <Text style={[styles.sectionLabel, styles.gap, { color: N.section }]}>Symptom timing</Text>
      <View style={cardStyle}>
        {(data.symptomTiming ?? []).length > 0 ? (
          (data.symptomTiming ?? []).map((p, i) => (
            <Statement key={`${p.phase}-${p.half}-${p.symptom}-${i}`} accent={t.accent}>
              you've often logged <Text style={styles.bold}>{p.symptom}</Text> in your {p.half}{' '}
              {labelOf(p.phase).toLowerCase()} phase — {p.cycles} of your last {p.ofCycles} cycles
            </Statement>
          ))
        ) : (
          <Unlock>Keep logging through a few cycles to spot your symptom patterns.</Unlock>
        )}
      </View>

      {/* ── What moves together (correlations) ── */}
      <Text style={[styles.sectionLabel, styles.gap, { color: N.section }]}>
        What moves together
      </Text>
      <View style={cardStyle}>
        {(() => {
          const shown = (data.correlations ?? []).filter((c) => c.enough && c.direction)
          return shown.length > 0 ? (
            <>
              {shown.map((c) => (
                <Statement key={c.pair} accent={t.accent}>
                  {corrSentence(c)}
                </Statement>
              ))}
              <Text style={[styles.muted, { color: N.sub }]}>
                A gentle observation from your logs — not medical advice.
              </Text>
            </>
          ) : (
            <Unlock>
              Log your sleep alongside mood and energy to see what tends to move together.
            </Unlock>
          )
        })()}
      </View>

      {/* ── Cycle trends ── */}
      <Text style={[styles.sectionLabel, styles.gap, { color: N.section }]}>Cycle trends</Text>
      <View style={cardStyle}>
        {data.cycleTrend?.enough ? (
          <Statement accent={t.accent}>{trendSentence(data.cycleTrend.direction)}</Statement>
        ) : (
          <Unlock>Log a few more cycles to see how your cycle length is trending.</Unlock>
        )}
      </View>

      {/* ── Your rhythm (gentle, non-diagnostic) ── */}
      {data.rhythmNote && data.rhythmNote.state !== 'insufficient' && (
        <>
          <Text style={[styles.sectionLabel, styles.gap, { color: N.section }]}>Your rhythm</Text>
          <View style={cardStyle}>
            {data.rhythmNote.state === 'observation' ? (
              <>
                {data.rhythmNote.flags.map((flag) => (
                  <Statement key={flag} accent={t.accent}>
                    {RHYTHM_FLAG_COPY[flag]}
                  </Statement>
                ))}
                <Text style={[styles.muted, { color: N.sub }]}>{RHYTHM_NOTE_COPY.disclaimer}</Text>
              </>
            ) : (
              <Statement accent={t.accent}>{RHYTHM_NOTE_COPY.steady}</Statement>
            )}
          </View>
        </>
      )}

      {/* ── Consistency ── */}
      <Text style={[styles.sectionLabel, styles.gap, { color: N.section }]}>Consistency</Text>
      <View style={cardStyle}>
        <Text style={[styles.recent, { color: N.title }]}>
          You've logged{' '}
          <Text style={[styles.bold, { color: t.accent }]}>
            {data.consistency.daysLogged} of the last {data.consistency.windowDays} days
          </Text>
          .
        </Text>
        <Text style={[styles.muted, { color: N.sub }]}>
          The more you log, the sharper these patterns become.
        </Text>
      </View>
    </ScrollView>
  )
}

function Statement({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <View style={styles.statement}>
      <Text style={[styles.statementDot, { color: accent }]}>·</Text>
      <Text style={[styles.statementText, { color: N.title }]}>{children}</Text>
    </View>
  )
}

function Unlock({ children }: { children: React.ReactNode }) {
  return (
    <Text style={[styles.unlock, { color: N.text }]}>
      <Text style={{ fontSize: 14 }}>◌ </Text>
      {children}
    </Text>
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
    <View style={{ flex: 1 }}>
      <View style={styles.barHead}>
        <Text style={[styles.barLabel, { color: N.section }]}>{label.toUpperCase()}</Text>
        <Text style={[styles.barValue, { color: N.sub }]}>
          {value == null ? '—' : `${value}/${max}`}
        </Text>
      </View>
      <View style={[styles.barTrack, { backgroundColor: track }]}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 40 },
  sectionLabel: {
    fontFamily: 'Raleway_500Medium',
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 11,
    marginTop: 12,
  },
  gap: { marginTop: 22 },

  card: { borderRadius: 15, borderWidth: 1, padding: 16 },
  bold: { fontFamily: 'Raleway_600SemiBold' },

  statement: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'flex-start' },
  statementDot: { fontFamily: 'Raleway_600SemiBold', fontSize: 13, lineHeight: 20 },
  statementText: { flex: 1, fontFamily: 'Raleway_400Regular', fontSize: 13, lineHeight: 20 },

  muted: { fontFamily: 'Raleway_300Light', fontSize: 11, lineHeight: 17, marginTop: 8 },
  miniLabel: {
    fontFamily: 'Raleway_500Medium',
    fontSize: 8.5,
    letterSpacing: 1.4,
    marginBottom: 5,
  },
  recent: { fontFamily: 'Raleway_400Regular', fontSize: 13, lineHeight: 19 },

  unlock: { fontFamily: 'Raleway_300Light', fontSize: 12, lineHeight: 19 },

  phaseHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  phaseName: { fontFamily: 'Marcellus_400Regular', fontSize: 14.5 },
  phaseCount: { fontFamily: 'Raleway_400Regular', fontSize: 10 },
  symptoms: { fontFamily: 'Raleway_300Light', fontSize: 11, marginTop: 2 },
  phaseEmpty: { fontFamily: 'Raleway_300Light', fontSize: 11, marginTop: 2 },

  bars: { flexDirection: 'row', gap: 16, marginTop: 8 },
  barHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barLabel: { fontFamily: 'Raleway_500Medium', fontSize: 8.5, letterSpacing: 0.7 },
  barValue: { fontFamily: 'Raleway_400Regular', fontSize: 9 },
  barTrack: { height: 5, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
})
