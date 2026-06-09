import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

interface Props {
  value: number
  onChange: (v: number) => void
}

export const WaterTracker: React.FC<Props> = ({ value, onChange }) => {
  const glasses = Array.from({ length: 8 }, (_, i) => i + 1)

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Water — {value}/8 glasses</Text>
      <View style={styles.row}>
        {glasses.map((g) => (
          <TouchableOpacity
            key={g}
            onPress={() => onChange(g === value ? g - 1 : g)}
            activeOpacity={0.7}
            style={styles.glass}
          >
            <Text style={[styles.glassIcon, g <= value && styles.glassFilled]}>
              🥛
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  label: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#2C2825',
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  glass: {
    flex: 1,
    alignItems: 'center',
  },
  glassIcon: {
    fontSize: 22,
    opacity: 0.25,
  },
  glassFilled: {
    opacity: 1,
  },
})
