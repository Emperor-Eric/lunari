import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { EducationCard as EduCard } from '@lunari/phase-data'

// Frost-on-flood palette injected by the Today screen (same contract as NextUpCard).
export interface EducationSurface {
  ink: string
  sub: string
  gold: string
  cardwash: string
  cardbd: string
  phaseLabel: string
}

/**
 * Daily micro-education teaser on the Today flood surface. Shows the current card's
 * title + one-line hook with a sparkle affordance; tapping opens the full card
 * (pushed /education route). Static content — the host passes the selected card.
 */
export function EducationCard({
  card,
  surface,
  onOpen,
}: {
  card: EduCard
  surface: EducationSurface
  onOpen: () => void
}) {
  const { ink, sub, gold, cardwash, cardbd, phaseLabel } = surface
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onOpen}
      style={[styles.card, { backgroundColor: cardwash, borderColor: cardbd }]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.eyebrow, { color: gold }]}>Today&apos;s insight · {phaseLabel}</Text>
        <Text style={[styles.title, { color: ink }]}>{card.title}</Text>
        <Text style={[styles.teaser, { color: sub }]}>{card.teaser}</Text>
      </View>
      <View style={[styles.badge, { borderColor: gold }]}>
        <Text style={[styles.badgeText, { color: gold }]}>✦</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 15,
    borderRadius: 14,
    borderWidth: 1,
  },
  eyebrow: {
    fontFamily: 'Raleway_600SemiBold',
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: { fontFamily: 'Marcellus_400Regular', fontSize: 16, marginTop: 6 },
  teaser: { fontFamily: 'Raleway_300Light', fontSize: 12, marginTop: 3 },
  badge: {
    width: 30,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 14 },
})
