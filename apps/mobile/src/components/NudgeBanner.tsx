import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { NotificationItem } from '@lunari/types'

// Frost-on-flood palette injected by the Today screen (same contract as NextUpCard).
export interface NudgeSurface {
  ink: string
  sub: string
  gold: string
  cardwash: string
  cardbd: string
}

/**
 * A single gentle in-app nudge on the Today flood surface. Session-dismissible —
 * the host owns the dismiss state.
 */
export function NudgeBanner({
  item,
  surface,
  onDismiss,
}: {
  item: NotificationItem
  surface: NudgeSurface
  onDismiss: () => void
}) {
  const { ink, sub, gold, cardwash, cardbd } = surface
  return (
    <View style={[styles.card, { backgroundColor: cardwash, borderColor: cardbd }]}>
      <View style={[styles.dot, { backgroundColor: gold }]} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: gold }]}>{item.title}</Text>
        <Text style={[styles.body, { color: ink }]}>{item.body}</Text>
      </View>
      <TouchableOpacity onPress={onDismiss} hitSlop={10}>
        <Text style={[styles.close, { color: sub }]}>×</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  dot: { width: 6, height: 6, borderRadius: 999, marginTop: 6 },
  title: {
    fontFamily: 'Raleway_600SemiBold',
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  body: { fontFamily: 'Raleway_300Light', fontSize: 12.5, marginTop: 4, lineHeight: 18 },
  close: { fontFamily: 'Raleway_400Regular', fontSize: 18, marginTop: -2 },
})
