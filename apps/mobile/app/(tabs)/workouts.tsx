import React from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getPhaseForDay, getDayInCycle } from '@lunari/phase-data'
import { WorkoutCard } from '@lunari/ui'
import { useUser } from '@lunari/utils'

export default function Workouts() {
  const { user } = useUser()
  const day = 15 // TODO: from cycle store
  const phase = getPhaseForDay(day)

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Phase header */}
        <View style={[styles.phaseStrip, { backgroundColor: phase.lightColor }]}>
          <View style={[styles.phaseDot, { backgroundColor: phase.color }]} />
          <Text style={[styles.phaseLabel, { color: phase.color }]}>{phase.name} phase</Text>
        </View>

        <Text style={styles.heading}>Move</Text>

        {/* Workouts */}
        <Text style={styles.subheading}>Recommended this phase</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
          {phase.workouts.map((w) => (
            <WorkoutCard key={w.title} workout={w} />
          ))}
        </ScrollView>

        {/* Avoid */}
        <Text style={styles.subheading}>Best to avoid</Text>
        <View style={styles.avoidList}>
          {phase.avoidWorkouts.map((a) => (
            <View key={a.name} style={styles.avoidItem}>
              <Text style={styles.avoidName}>✗ {a.name}</Text>
              <Text style={styles.avoidReason}>{a.reason}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E8' },
  scroll: { padding: 20, gap: 20, paddingBottom: 40 },
  phaseStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 9999, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start',
  },
  phaseDot: { width: 8, height: 8, borderRadius: 4 },
  phaseLabel: { fontFamily: 'Inter', fontSize: 13, fontWeight: '600' },
  heading: { fontFamily: 'PlayfairDisplay', fontSize: 28, color: '#2C2825' },
  subheading: { fontFamily: 'Inter', fontSize: 15, fontWeight: '600', color: '#2C2825' },
  hScroll: { gap: 12, paddingRight: 20 },
  avoidList: { gap: 12 },
  avoidItem: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, gap: 4, borderWidth: 1, borderColor: '#E8E2D6' },
  avoidName: { fontFamily: 'Inter', fontSize: 14, fontWeight: '600', color: '#7A1E2E' },
  avoidReason: { fontFamily: 'Inter', fontSize: 13, color: '#6B6460', lineHeight: 18 },
})
