import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

interface Props {
  value: number
  onChange: (v: number) => void
}

export const SleepInput: React.FC<Props> = ({ value, onChange }) => {
  const decrement = () => onChange(Math.max(0, Math.round((value - 0.5) * 2) / 2))
  const increment = () => onChange(Math.min(12, Math.round((value + 0.5) * 2) / 2))

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Sleep</Text>
      <View style={styles.stepper}>
        <TouchableOpacity onPress={decrement} style={styles.btn} activeOpacity={0.7}>
          <Text style={styles.btnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.value}>{value} hrs</Text>
        <TouchableOpacity onPress={increment} style={styles.btn} activeOpacity={0.7}>
          <Text style={styles.btnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
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
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#F5F0E8',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  btn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8E2D6',
  },
  btnText: {
    fontSize: 18,
    color: '#2C2825',
    lineHeight: 22,
  },
  value: {
    fontFamily: 'JetBrainsMono',
    fontSize: 14,
    color: '#2C2825',
    minWidth: 52,
    textAlign: 'center',
  },
})
