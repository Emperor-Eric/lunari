import React from 'react'
import { View, Text, TextInput, StyleSheet } from 'react-native'

interface Props {
  value: string
  onChange: (v: string) => void
  maxLength?: number
}

export const JournalInput: React.FC<Props> = ({ value, onChange, maxLength = 500 }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Journal</Text>
        <Text style={styles.counter}>{value.length}/{maxLength}</Text>
      </View>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder="How are you really feeling today..."
        placeholderTextColor="#6B6460"
        multiline
        numberOfLines={4}
        maxLength={maxLength}
        textAlignVertical="top"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 8 },
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
  counter: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#6B6460',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8E2D6',
    padding: 14,
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#2C2825',
    minHeight: 100,
  },
})
