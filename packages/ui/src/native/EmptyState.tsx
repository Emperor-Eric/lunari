import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface Props {
  title: string
  subtitle: string
}

export const EmptyState: React.FC<Props> = ({ title, subtitle }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🌙</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  icon: { fontSize: 48 },
  title: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 20,
    color: '#2C2825',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#6B6460',
    textAlign: 'center',
    lineHeight: 20,
  },
})
