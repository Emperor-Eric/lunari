import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { format, subDays } from 'date-fns'
import { getPhaseById } from '@lunari/phase-data'
import { PhaseHero } from '@lunari/ui'
import { GoldButton, authColors, authFonts } from '../../src/components/AuthChrome'
import { useOnboardingStore } from '../../src/stores/onboarding'
import type { PhaseId } from '@lunari/types'

const Q1_OPTIONS = [
  { label: 'Crampy and low energy', phase: 'menstrual' as PhaseId },
  { label: 'Energised and motivated', phase: 'follicular' as PhaseId },
  { label: 'Confident and social', phase: 'ovulatory' as PhaseId },
  { label: 'Tired and craving comfort', phase: 'luteal' as PhaseId },
]

const Q2_OPTIONS = [
  { label: '1–5 days ago', days: 3 },
  { label: '6–10 days ago', days: 8 },
  { label: '11–20 days ago', days: 15 },
  { label: '21+ days ago', days: 24 },
]

const Q3_OPTIONS = [
  { label: '3–4 days', len: 4 },
  { label: '5–6 days', len: 6 },
  { label: '7+ days', len: 7 },
]

export default function CycleSmart() {
  const { setStep, setCycleData } = useOnboardingStore()
  const [q, setQ] = useState(0)
  const [phase, setPhase] = useState<PhaseId | null>(null)
  const [daysAgo, setDaysAgo] = useState<number | null>(null)
  const [periodLength, setPeriodLength] = useState(5)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    setStep(4)
  }, [setStep])

  const estimatedPhase = phase ? getPhaseById(phase) : null

  const handleConfirm = () => {
    const startDate = format(subDays(new Date(), daysAgo ?? 14), 'yyyy-MM-dd')
    setCycleData(startDate, 28, periodLength)
    router.push('/onboarding/notifications')
  }

  if (confirmed && estimatedPhase) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.safe}>
        <View style={styles.container}>
          <PhaseHero phase={estimatedPhase} cycleDay={daysAgo ?? 14} />
          <Text style={styles.heading}>
            Looks like you&apos;re in your {estimatedPhase.name} phase
          </Text>
          <GoldButton label="That sounds right →" onPress={handleConfirm} />
          <TouchableOpacity onPress={() => router.push('/onboarding/cycle-manual')}>
            <Text style={styles.linkText}>Let me enter manually</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <View style={styles.container}>
        {q === 0 && (
          <>
            <Text style={styles.heading}>How are you feeling right now?</Text>
            <View style={styles.options}>
              {Q1_OPTIONS.map((o) => (
                <TouchableOpacity
                  key={o.phase}
                  style={styles.option}
                  onPress={() => {
                    setPhase(o.phase)
                    setQ(1)
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.optionText}>{o.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {q === 1 && (
          <>
            <Text style={styles.heading}>How long ago did your last period start?</Text>
            <View style={styles.options}>
              {Q2_OPTIONS.map((o) => (
                <TouchableOpacity
                  key={o.days}
                  style={styles.option}
                  onPress={() => {
                    setDaysAgo(o.days)
                    setQ(2)
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.optionText}>{o.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {q === 2 && (
          <>
            <Text style={styles.heading}>How long does your period usually last?</Text>
            <View style={styles.options}>
              {Q3_OPTIONS.map((o) => (
                <TouchableOpacity
                  key={o.len}
                  style={styles.option}
                  onPress={() => {
                    setPeriodLength(o.len)
                    setConfirmed(true)
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.optionText}>{o.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 24, gap: 24 },
  heading: { fontFamily: authFonts.display, fontSize: 26, color: authColors.ink, marginTop: 8 },
  options: { gap: 12 },
  option: {
    backgroundColor: authColors.fieldBg,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: authColors.fieldBorder,
  },
  optionText: { fontFamily: authFonts.body, fontSize: 15, color: authColors.ink },
  linkText: {
    fontFamily: authFonts.medium,
    fontSize: 14,
    color: authColors.gold,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
})
