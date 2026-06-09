import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import type { Workout } from '@lunari/types'

interface Props {
  workout: Workout
}

const INTENSITY_COLOR: Record<Workout['intensity'], string> = {
  low: '#3D6B4A',
  moderate: '#7A4A2A',
  high: '#5B3E8C',
}

export const WorkoutCard: React.FC<Props> = ({ workout }) => {
  const color = INTENSITY_COLOR[workout.intensity]

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{workout.title}</Text>
        <View style={[styles.intensityBadge, { backgroundColor: color + '20' }]}>
          <Text style={[styles.intensityText, { color }]}>{workout.intensity}</Text>
        </View>
      </View>
      <Text style={styles.duration}>{workout.duration}</Text>
      <Text style={styles.description}>{workout.description}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E8E2D6',
    width: 220,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '600',
    color: '#2C2825',
    flex: 1,
  },
  intensityBadge: {
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  intensityText: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  duration: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#6B6460',
  },
  description: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#6B6460',
    lineHeight: 18,
  },
})
