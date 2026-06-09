import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

interface Props {
  symptoms: string[]
  selected: string[]
  onToggle: (s: string) => void
  phaseColor: string
}

export const SymptomGrid: React.FC<Props> = ({ symptoms, selected, onToggle, phaseColor }) => {
  return (
    <View style={styles.grid}>
      {symptoms.map((symptom) => {
        const active = selected.includes(symptom)
        return (
          <TouchableOpacity
            key={symptom}
            onPress={() => onToggle(symptom)}
            style={[
              styles.chip,
              active && { backgroundColor: phaseColor, borderColor: phaseColor },
            ]}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {symptom}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8E2D6',
  },
  chipText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '500',
    color: '#2C2825',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
})
