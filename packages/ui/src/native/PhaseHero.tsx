import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { Phase } from '@lunari/types'

interface Props {
  phase: Phase
  cycleDay: number
  onPress?: () => void
}

const PHASE_ORDER: Phase['id'][] = ['menstrual', 'follicular', 'ovulatory', 'luteal']

// Sanctuary (navy/gold) tokens — kept literal so @lunari/ui stays app-agnostic.
const INK = '#F5EBD6'
const MUTED = '#8BA0C4'
const GOLD = '#C9A84C'

/**
 * Dark-friendly, gold-framed phase card for the navy onboarding wash. The phase
 * colour reads as an ACCENT (a gold-ringed orb + the active progress bar) over a
 * frosted translucent card, so all four phases stay legible on navy.
 */
export const PhaseHero: React.FC<Props> = ({ phase, cycleDay, onPress }) => {
  return (
    <TouchableOpacity activeOpacity={onPress ? 0.9 : 1} onPress={onPress} style={styles.container}>
      {/* Cycle day badge */}
      <View style={styles.dayBadge}>
        <Text style={styles.dayBadgeText}>Day {cycleDay}</Text>
      </View>

      {/* Phase accent orb — phase colour inside a gold ring */}
      <View style={[styles.orb, { backgroundColor: phase.color }]} />

      {/* Phase name */}
      <Text style={styles.phaseName}>{phase.name}</Text>
      <Text style={styles.tagline}>{phase.tagline}</Text>

      {/* Phase progress bars — active bar carries the phase colour */}
      <View style={styles.progressRow}>
        {PHASE_ORDER.map((id) => (
          <View
            key={id}
            style={[
              styles.progressBar,
              id === phase.id ? { backgroundColor: phase.color } : styles.progressInactive,
            ]}
          />
        ))}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 24,
    backgroundColor: 'rgba(245,235,214,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.45)',
    overflow: 'hidden',
  },
  dayBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(201,168,76,0.15)',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  dayBadgeText: {
    fontFamily: 'Raleway_500Medium',
    fontSize: 12,
    color: GOLD,
  },
  orb: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: GOLD,
    marginBottom: 12,
  },
  phaseName: {
    fontFamily: 'Marcellus_400Regular',
    fontSize: 26,
    color: INK,
    marginBottom: 8,
  },
  tagline: {
    fontFamily: 'Raleway_400Regular',
    fontSize: 14,
    color: MUTED,
    marginBottom: 20,
    lineHeight: 20,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
  },
  progressBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  progressInactive: {
    backgroundColor: 'rgba(245,235,214,0.2)',
  },
})
