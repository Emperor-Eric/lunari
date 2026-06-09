import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import type { PhaseId } from '@lunari/types'
import { getPhaseById } from '@lunari/phase-data'

interface Props {
  phase: PhaseId
}

export const PhaseChip: React.FC<Props> = ({ phase }) => {
  const phaseData = getPhaseById(phase)

  return (
    <View style={[styles.chip, { backgroundColor: phaseData.lightColor }]}>
      <View style={[styles.dot, { backgroundColor: phaseData.color }]} />
      <Text style={[styles.label, { color: phaseData.color }]}>{phaseData.name}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
  },
})
