import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import type { Supplement } from '@lunari/types'

interface Props {
  supplement: Supplement
}

export const SupplementCard: React.FC<Props> = ({ supplement }) => {
  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.name}>{supplement.name}</Text>
        <Text style={styles.purpose} numberOfLines={2}>{supplement.purpose}</Text>
      </View>
      <View style={styles.dosagePill}>
        <Text style={styles.dosage}>{supplement.dosage}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E2D6',
    gap: 12,
  },
  left: { flex: 1, gap: 3 },
  name: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2825',
  },
  purpose: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#6B6460',
    lineHeight: 17,
  },
  dosagePill: {
    backgroundColor: '#F5F0E8',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dosage: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    color: '#2C2825',
    fontWeight: '500',
  },
})
