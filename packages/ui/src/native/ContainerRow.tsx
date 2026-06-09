import React from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated'
import type { Phase } from '@lunari/types'
import { getAllPhases } from '@lunari/phase-data'

interface Props {
  phase: Phase
  currentDay: number
}

interface CardProps {
  cardPhase: Phase
  isActive: boolean
}

const ContainerCard: React.FC<CardProps> = ({ cardPhase, isActive }) => {
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isActive ? 1.05 : 1) }],
    opacity: withSpring(isActive ? 1 : 0.45),
  }))

  return (
    <Animated.View
      style={[
        styles.card,
        animStyle,
        isActive && { borderColor: cardPhase.color, borderWidth: 2 },
      ]}
    >
      {isActive && (
        <View style={[styles.nowPill, { backgroundColor: cardPhase.color }]}>
          <Text style={styles.nowPillText}>Now</Text>
        </View>
      )}
      <Text style={[styles.containerNumber, isActive && { color: cardPhase.color }]}>
        {cardPhase.containerNumber}
      </Text>
      <Text style={styles.phaseName}>{cardPhase.name}</Text>
    </Animated.View>
  )
}

export const ContainerRow: React.FC<Props> = ({ phase }) => {
  const allPhases = getAllPhases()

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {allPhases.map((p) => (
        <ContainerCard key={p.id} cardPhase={p} isActive={p.id === phase.id} />
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    gap: 12,
    paddingVertical: 8,
  },
  card: {
    width: 80,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#2C2825',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  nowPill: {
    position: 'absolute',
    top: -10,
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  nowPillText: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  containerNumber: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 48,
    color: '#2C2825',
    lineHeight: 56,
  },
  phaseName: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#6B6460',
    textAlign: 'center',
  },
})
