import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

interface Props {
  value: number | null
  onChange: (v: number) => void
}

const MOODS = [
  { value: 1, emoji: '😞', label: 'Rough' },
  { value: 2, emoji: '😐', label: 'Okay' },
  { value: 3, emoji: '🙂', label: 'Good' },
  { value: 4, emoji: '😊', label: 'Great' },
  { value: 5, emoji: '🌟', label: 'Amazing' },
]

export const MoodPicker: React.FC<Props> = ({ value, onChange }) => {
  return (
    <View style={styles.row}>
      {MOODS.map((mood) => (
        <TouchableOpacity
          key={mood.value}
          onPress={() => onChange(mood.value)}
          style={[styles.option, value === mood.value && styles.optionActive]}
          activeOpacity={0.7}
        >
          <Text style={styles.emoji}>{mood.emoji}</Text>
          <Text style={[styles.label, value === mood.value && styles.labelActive]}>
            {mood.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  option: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 2,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: '#F5F0E8',
  },
  optionActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#C9A84C',
  },
  emoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  label: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#6B6460',
    textAlign: 'center',
  },
  labelActive: {
    color: '#2C2825',
    fontWeight: '600',
  },
})
