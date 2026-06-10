import React, { useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PhaseHero } from '@lunari/ui'
import { getPhaseById } from '@lunari/phase-data'
import { useOnboardingStore } from '../../src/stores/onboarding'

export default function OnboardingWelcome() {
  const { setStep } = useOnboardingStore()

  useEffect(() => { setStep(1) }, [setStep])

  const follicular = getPhaseById('follicular')

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <PhaseHero phase={follicular} cycleDay={8} />

        <View style={styles.copy}>
          <Text style={styles.heading}>Meet lunari</Text>
          <Text style={styles.body}>
            A 30-day kit synced to your cycle. Four containers. Thirty days. One system.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.cta}
          onPress={() => {
            setStep(2)
            router.push('/onboarding/cycle-method')
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>Let's set up your cycle →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E8' },
  container: { flex: 1, padding: 24, gap: 24, justifyContent: 'space-between' },
  copy: { gap: 12 },
  heading: { fontFamily: 'PlayfairDisplay', fontSize: 32, color: '#2C2825' },
  body: { fontFamily: 'Inter', fontSize: 15, color: '#6B6460', lineHeight: 23 },
  cta: {
    backgroundColor: '#2C2825', borderRadius: 12, paddingVertical: 16, alignItems: 'center',
  },
  ctaText: { fontFamily: 'Inter', fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
})
