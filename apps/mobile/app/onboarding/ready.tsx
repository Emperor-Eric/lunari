import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Alert } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getDayInCycle, getPhaseForDay } from '@lunari/phase-data'
import { PhaseHero } from '@lunari/ui'
import { useAuth, useUser } from '@lunari/utils'
import { GoldButton, authColors, authFonts } from '../../src/components/AuthChrome'
import { useOnboardingStore } from '../../src/stores/onboarding'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/v1'

export default function Ready() {
  const { setStep, cycleStartDate, cycleLength, periodLength, dailyReminder, reminderTime } =
    useOnboardingStore()
  const { session } = useAuth()
  const { fetchUser } = useUser()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setStep(6)
  }, [setStep])

  const startDate = cycleStartDate ?? new Date().toISOString().split('T')[0]
  const day = getDayInCycle(startDate, undefined, cycleLength)
  const phase = getPhaseForDay(day, cycleLength, periodLength)

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
        body: JSON.stringify({ startDate, cycleLength, periodLength }),
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
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <View style={styles.container}>
        <PhaseHero phase={phase} cycleDay={day} />

        <View style={styles.copy}>
          <Text style={styles.heading}>You&apos;re all set</Text>
          <Text style={styles.sub}>
            Day {day} of your {phase.name} phase
          </Text>
        </View>

        <GoldButton
          label={loading ? 'Setting up…' : 'Start tracking →'}
          onPress={handleStart}
          disabled={loading}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 24, gap: 24, justifyContent: 'space-between' },
  copy: { gap: 8 },
  heading: { fontFamily: authFonts.display, fontSize: 32, color: authColors.ink },
  sub: { fontFamily: authFonts.body, fontSize: 16, color: authColors.muted },
})
