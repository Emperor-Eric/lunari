import React, { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PhaseHero } from '@lunari/ui'
import { getPhaseById } from '@lunari/phase-data'
import { GoldButton, authColors, authFonts } from '../../src/components/AuthChrome'
import { useOnboardingStore } from '../../src/stores/onboarding'

export default function OnboardingWelcome() {
  const { setStep } = useOnboardingStore()

  useEffect(() => {
    setStep(1)
  }, [setStep])

  const follicular = getPhaseById('follicular')

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <View style={styles.container}>
        <PhaseHero phase={follicular} cycleDay={8} />

        <View style={styles.copy}>
          <Text style={styles.heading}>Meet lunari</Text>
          <Text style={styles.body}>
            A 30-day kit synced to your cycle. Four containers. Thirty days. One system.
          </Text>
        </View>

        <GoldButton
          label="Let's set up your cycle →"
          onPress={() => {
            setStep(2)
            router.push('/onboarding/cycle-method')
          }}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 24, gap: 24, justifyContent: 'space-between' },
  copy: { gap: 12 },
  heading: { fontFamily: authFonts.display, fontSize: 32, color: authColors.ink },
  body: { fontFamily: authFonts.light, fontSize: 15, color: authColors.muted, lineHeight: 23 },
})
