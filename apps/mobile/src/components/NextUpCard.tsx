import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
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
const plural = (n: number) => (n === 1 ? '' : 's')

/** "Next up" — glanceable, estimate-framed prediction summary (pure). */
export function NextUpCard({
  settings,
  surface,
}: {
  settings: CycleSettings | null
  surface: PredictionSurface
}) {
  const { ink, sub, gold, cardwash, cardbd } = surface
  const card = [styles.card, { backgroundColor: cardwash, borderColor: cardbd }]

  if (!settings) {
    return (
      <View style={card}>
        <Text style={[styles.eyebrow, { color: gold }]}>Next up</Text>
        <Text style={[styles.placeholder, { color: ink }]}>Predictions appear once your cycle is set up.</Text>
      </View>
    )
  }

  const pred = getCyclePrediction(settings)
  const nextStart = parseISO(pred.nextPeriodStart)
  const daysToNext = Math.max(1, differenceInCalendarDays(nextStart, new Date()))

  const idx = pred.phaseRanges.findIndex((r) => r.phase === pred.currentPhase)
  const curRange = idx >= 0 ? pred.phaseRanges[idx] : undefined
  const daysLeftInPhase = curRange ? curRange.endDay - pred.currentDay : 0
  const nextRange = idx >= 0 ? pred.phaseRanges[idx + 1] : undefined
  const nextPhaseId: PhaseId = nextRange ? nextRange.phase : 'menstrual'
  const nextPhaseStart = nextRange ? parseISO(nextRange.startDate) : nextStart
  const curLabel = phaseLabel(pred.currentPhase)

  return (
    <View style={card}>
      <View style={styles.headRow}>
        <Text style={[styles.eyebrow, { color: gold }]}>Next up</Text>
        <Text style={[styles.estimated, { color: sub }]}>estimated</Text>
      </View>

      <View style={styles.nextRow}>
        <Text style={[styles.nextLabel, { color: ink }]}>Next period in</Text>
        <Text style={[styles.nextValue, { color: ink }]}>
          ~{daysToNext} day{plural(daysToNext)}
        </Text>
      </View>
      <Text style={[styles.predicted, { color: sub }]}>predicted {format(nextStart, 'EEE, MMM d')}</Text>

      <View style={[styles.divider, { backgroundColor: cardbd }]} />

      <Text style={[styles.transition, { color: ink }]}>
        {daysLeftInPhase > 0 ? `${curLabel} for ~${daysLeftInPhase} more day${plural(daysLeftInPhase)}` : `Last estimated day of ${curLabel}`}
        {' · '}
        <Text style={{ color: gold }}>{phaseLabel(nextPhaseId)}</Text> starts ~{format(nextPhaseStart, 'EEE, MMM d')}
      </Text>

      <Text style={[styles.disclaimer, { color: sub }]}>Estimated from your cycle — not a medical prediction.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 14, borderWidth: 1 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  eyebrow: { fontFamily: 'Raleway_600SemiBold', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase' },
  estimated: { fontFamily: 'Raleway_400Regular', fontSize: 9, letterSpacing: 0.5 },
  placeholder: { fontFamily: 'Raleway_300Light', fontSize: 12, marginTop: 6, opacity: 0.85 },
  nextRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8 },
  nextLabel: { fontFamily: 'Raleway_300Light', fontSize: 12, opacity: 0.85 },
  nextValue: { fontFamily: 'Marcellus_400Regular', fontSize: 22 },
  predicted: { fontFamily: 'Raleway_400Regular', fontSize: 11, marginTop: 3 },
  divider: { height: 1, marginVertical: 11 },
  transition: { fontFamily: 'Raleway_300Light', fontSize: 11.5, lineHeight: 17 },
  disclaimer: { fontFamily: 'Raleway_400Regular', fontSize: 9, marginTop: 10, opacity: 0.85 },
})
