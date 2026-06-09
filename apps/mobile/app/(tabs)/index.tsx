import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, RefreshControl, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@lunari/utils'
import { getPhaseForDay } from '@lunari/phase-data'
import { PhaseHero, ContainerRow, SupplementCard, LoadingSpinner } from '@lunari/ui'
import type { TodayCycleResponse } from '@lunari/types'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/v1'

export default function Today() {
  const { session } = useAuth()
  const [cycleData, setCycleData] = useState<TodayCycleResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [quickSymptoms, setQuickSymptoms] = useState<string[]>([])

  const fetchToday = useCallback(async () => {
    if (!session) return
    try {
      const res = await fetch(`${API_URL}/me/cycle/today`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) setCycleData(await res.json())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [session])

  useEffect(() => { fetchToday() }, [fetchToday])

  const onRefresh = () => { setRefreshing(true); fetchToday() }

  if (loading) return <LoadingSpinner />

  const phase = cycleData ? getPhaseForDay(cycleData.day) : getPhaseForDay(1)
  const quickTags = phase.symptoms.slice(0, 4)

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={phase.color} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Today</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        </View>

        {/* Phase hero */}
        <PhaseHero phase={phase} cycleDay={cycleData?.day ?? 1} />

        {/* Container row */}
        <View>
          <Text style={styles.sectionLabel}>
            Container {cycleData?.containerNumber ?? 1} of 4 — {phase.name} phase
          </Text>
          <ContainerRow phase={phase} currentDay={cycleData?.day ?? 1} />
        </View>

        {/* Quick symptom check */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>How are you feeling today?</Text>
          <View style={styles.tagRow}>
            {quickTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tag,
                  quickSymptoms.includes(tag) && { backgroundColor: phase.color, borderColor: phase.color },
                ]}
                onPress={() =>
                  setQuickSymptoms((prev) =>
                    prev.includes(tag) ? prev.filter((s) => s !== tag) : [...prev, tag]
                  )
                }
              >
                <Text style={[styles.tagText, quickSymptoms.includes(tag) && { color: '#FFFFFF' }]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Supplement focus */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Today's supplement focus</Text>
          <View style={styles.supplementList}>
            {phase.supplements.slice(8, 10).map((s) => (
              <SupplementCard key={s.name} supplement={s} />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E8' },
  scroll: { padding: 20, gap: 20, paddingBottom: 40 },
  header: { gap: 2 },
  greeting: { fontFamily: 'PlayfairDisplay', fontSize: 28, color: '#2C2825' },
  date: { fontFamily: 'Inter', fontSize: 13, color: '#6B6460' },
  sectionLabel: { fontFamily: 'Inter', fontSize: 13, color: '#6B6460', marginBottom: 8, marginLeft: 4 },
  section: { gap: 12 },
  sectionHeading: { fontFamily: 'Inter', fontSize: 15, fontWeight: '600', color: '#2C2825' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9999,
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E8E2D6',
  },
  tagText: { fontFamily: 'Inter', fontSize: 13, fontWeight: '500', color: '#2C2825' },
  supplementList: { gap: 8 },
})
