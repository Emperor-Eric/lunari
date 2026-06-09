import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { Phase } from '@lunari/types'

interface Props {
  phase: Phase
  cycleDay: number
  onPress?: () => void
}

const PHASE_ORDER: Phase['id'][] = ['menstrual', 'follicular', 'ovulatory', 'luteal']

export const PhaseHero: React.FC<Props> = ({ phase, cycleDay, onPress }) => {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.9 : 1}
      onPress={onPress}
      style={[styles.container, { backgroundColor: phase.color }]}
    >
      {/* Cycle day badge */}
      <View style={styles.dayBadge}>
        <Text style={styles.dayBadgeText}>Day {cycleDay}</Text>
      </View>

      {/* Phase name */}
      <Text style={styles.phaseName}>{phase.name}</Text>
      <Text style={styles.tagline}>{phase.tagline}</Text>

      {/* Phase progress bars */}
      <View style={styles.progressRow}>
        {PHASE_ORDER.map((id) => (
          <View
            key={id}
            style={[styles.progressBar, { opacity: id === phase.id ? 1 : 0.3 }]}
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
    overflow: 'hidden',
  },
  dayBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  dayBadgeText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  phaseName: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 26,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 8,
    marginTop: 8,
  },
  tagline: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
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
    backgroundColor: '#FFFFFF',
  },
})
