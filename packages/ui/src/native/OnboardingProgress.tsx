import React from 'react'
import { View, StyleSheet } from 'react-native'

interface Props {
  total: number
  current: number
  phaseColor?: string
}

export const OnboardingProgress: React.FC<Props> = ({ total, current, phaseColor = '#C9A84C' }) => {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[styles.dot, i < current ? { backgroundColor: phaseColor } : styles.inactive]}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inactive: {
    backgroundColor: 'rgba(245,235,214,0.25)', // navy-friendly — was light stone #E8E2D6
  },
})
