import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Slider from '@react-native-community/slider'

interface Props {
  value: number
  onChange: (v: number) => void
  phaseColor: string
}

export const EnergySlider: React.FC<Props> = ({ value, onChange, phaseColor }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Energy level</Text>
        <View style={[styles.badge, { backgroundColor: phaseColor }]}>
          <Text style={styles.badgeText}>{value}/10</Text>
        </View>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={1}
        maximumValue={10}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={phaseColor}
        maximumTrackTintColor="#E8E2D6"
        thumbTintColor={phaseColor}
      />
      <View style={styles.ticks}>
        <Text style={styles.tickLabel}>1</Text>
        <Text style={styles.tickLabel}>10</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#2C2825',
  },
  badge: {
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  slider: { width: '100%', height: 40 },
  ticks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  tickLabel: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#6B6460',
  },
})
