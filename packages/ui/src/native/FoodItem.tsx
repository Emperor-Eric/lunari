import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import type { FoodItem as FoodItemType } from '@lunari/types'

interface Props {
  food: FoodItemType
  phaseColor?: string
}

export const FoodItem: React.FC<Props> = ({ food, phaseColor = '#C9A84C' }) => {
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: phaseColor }]} />
      <View style={styles.content}>
        <Text style={styles.name}>{food.name}</Text>
        <Text style={styles.reason}>{food.reason}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E2D6',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  content: { flex: 1, gap: 2 },
  name: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2825',
  },
  reason: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#6B6460',
    lineHeight: 17,
  },
})
