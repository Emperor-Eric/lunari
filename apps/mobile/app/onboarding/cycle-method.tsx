import React, { useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { authColors, authFonts } from '../../src/components/AuthChrome'
import { useOnboardingStore } from '../../src/stores/onboarding'

export default function CycleMethod() {
  const { setStep } = useOnboardingStore()
  useEffect(() => {
    setStep(3)
  }, [setStep])

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.heading}>First, let&apos;s find your phase</Text>

        <View style={styles.cards}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push('/onboarding/cycle-manual')}
            activeOpacity={0.85}
          >
            <Text style={styles.cardIcon}>📅</Text>
            <Text style={styles.cardTitle}>I know my dates</Text>
            <Text style={styles.cardBody}>Enter the date your last period started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push('/onboarding/cycle-smart')}
            activeOpacity={0.85}
          >
            <Text style={styles.cardIcon}>💡</Text>
            <Text style={styles.cardTitle}>Help me figure it out</Text>
            <Text style={styles.cardBody}>Answer 3 quick questions to estimate your phase</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 24, gap: 32 },
  heading: { fontFamily: authFonts.display, fontSize: 26, color: authColors.ink, marginTop: 8 },
  cards: { gap: 16 },
  card: {
    backgroundColor: authColors.fieldBg,
    borderRadius: 16,
    padding: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: authColors.fieldBorder,
  },
  cardIcon: { fontSize: 32, marginBottom: 4 },
  cardTitle: { fontFamily: authFonts.semibold, fontSize: 17, color: authColors.ink },
  cardBody: { fontFamily: authFonts.body, fontSize: 14, color: authColors.muted, lineHeight: 20 },
})
