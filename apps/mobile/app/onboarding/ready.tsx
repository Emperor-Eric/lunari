import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getDayInCycle, getPhaseForDay } from '@lunari/phase-data'
import { PhaseHero } from '@lunari/ui'
import { useAuth, useUser } from '@lunari/utils'
import { useOnboardingStore } from './store'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/v1'

export default function Ready() {
  const { setStep, cycleStartDate, cycleLength, dailyReminder, reminderTime } = useOnboardingStore()
  const { session } = useAuth()
  const { fetchUser } = useUser()
  const [loading, setLoading] = useState(false)

  useEffect(() => { setStep(6) }, [setStep])

  const startDate = cycleStartDate ?? new Date().toISOString().split('T')[0]
  const day = getDayInCycle(startDate, undefined, cycleLength)
  const phase = getPhaseForDay(day)

  const handleStart = async () => {
    if (!session) return
    setLoading(true)
    try {
      // Save cycle
      await fetch(`${API_URL}/me/cycle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ startDate, cycleLength }),
      })
      // Save notification prefs
      await fetch(`${API_URL}/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          notificationPrefs: { dailyReminder, reminderTime },
        }),
      })
      await fetchUser()
      router.replace('/(tabs)')
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <PhaseHero phase={phase} cycleDay={day} />

        <View style={styles.copy}>
          <Text style={styles.heading}>You're all set</Text>
          <Text style={styles.sub}>
            Day {day} of your {phase.name} phase
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.cta, loading && styles.ctaDisabled]}
          onPress={handleStart}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>{loading ? 'Setting up…' : 'Start tracking →'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E8' },
  container: { flex: 1, padding: 24, gap: 24, justifyContent: 'space-between' },
  copy: { gap: 8 },
  heading: { fontFamily: 'PlayfairDisplay', fontSize: 32, color: '#2C2825' },
  sub: { fontFamily: 'Inter', fontSize: 16, color: '#6B6460' },
  cta: {
    backgroundColor: '#2C2825', borderRadius: 12, paddingVertical: 16, alignItems: 'center',
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { fontFamily: 'Inter', fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
})
