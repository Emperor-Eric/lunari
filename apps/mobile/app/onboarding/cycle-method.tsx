import React, { useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useOnboardingStore } from '../../src/stores/onboarding'

export default function CycleMethod() {
  const { setStep } = useOnboardingStore()
  useEffect(() => { setStep(3) }, [setStep])

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.heading}>First, let's find your phase</Text>

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
  safe: { flex: 1, backgroundColor: '#F5F0E8' },
  container: { flex: 1, padding: 24, gap: 32 },
  heading: { fontFamily: 'PlayfairDisplay', fontSize: 26, color: '#2C2825', marginTop: 8 },
  cards: { gap: 16 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, gap: 8,
    borderWidth: 1.5, borderColor: '#E8E2D6',
  },
  cardIcon: { fontSize: 32, marginBottom: 4 },
  cardTitle: { fontFamily: 'Inter', fontSize: 17, fontWeight: '600', color: '#2C2825' },
  cardBody: { fontFamily: 'Inter', fontSize: 14, color: '#6B6460', lineHeight: 20 },
})
