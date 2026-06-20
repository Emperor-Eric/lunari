import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Slider from '@react-native-community/slider'
import { format, subDays } from 'date-fns'
import { getDayInCycle, getPhaseForDay } from '@lunari/phase-data'
import { PhaseHero } from '@lunari/ui'
import { GoldButton, authColors, authFonts } from '../../src/components/AuthChrome'
import { useOnboardingStore } from '../../src/stores/onboarding'

const PERIOD_OPTIONS = [3, 4, 5, 6, 7, 8]

export default function CycleManual() {
  const { setStep, setCycleData } = useOnboardingStore()
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 14), 'yyyy-MM-dd'))
  const [cycleLength, setCycleLength] = useState(28)
  const [periodLength, setPeriodLength] = useState(5)

  useEffect(() => {
    setStep(4)
  }, [setStep])

  const day = getDayInCycle(startDate, undefined, cycleLength)
  const phase = getPhaseForDay(day, cycleLength, periodLength)

  const handleContinue = () => {
    setCycleData(startDate, cycleLength, periodLength)
    router.push('/onboarding/notifications')
  }

  // Simple date picker: offset days from today
  const offsetDays = [1, 7, 14, 21, 28]

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.heading}>When did your last period start?</Text>

        <View style={styles.dateRow}>
          {offsetDays.map((d) => {
            const date = format(subDays(new Date(), d), 'yyyy-MM-dd')
            const label = d === 1 ? 'Yesterday' : `${d}d ago`
            const active = date === startDate
            return (
              <TouchableOpacity
                key={d}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => setStartDate(date)}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <View style={styles.sliderSection}>
          <Text style={styles.sliderLabel}>Cycle length: {cycleLength} days</Text>
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={21}
            maximumValue={35}
            step={1}
            value={cycleLength}
            onValueChange={setCycleLength}
            minimumTrackTintColor={authColors.gold}
            maximumTrackTintColor="rgba(245,235,214,0.2)"
            thumbTintColor={authColors.gold}
          />
          <View style={styles.sliderTicks}>
            <Text style={styles.tickLabel}>21</Text>
            <Text style={styles.tickLabel}>35</Text>
          </View>
        </View>

        <View style={styles.periodSection}>
          <Text style={styles.sliderLabel}>Period length</Text>
          <View style={styles.periodRow}>
            {PERIOD_OPTIONS.map((d) => {
              const active = d === periodLength
              return (
                <TouchableOpacity
                  key={d}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => setPeriodLength(d)}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>{d}d</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <View>
          <Text style={styles.previewLabel}>Your estimated phase</Text>
          <PhaseHero phase={phase} cycleDay={day} />
        </View>

        <View style={styles.cta}>
          <GoldButton label="This looks right →" onPress={handleContinue} />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 24, gap: 24 },
  heading: { fontFamily: authFonts.display, fontSize: 26, color: authColors.ink },
  dateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: authColors.fieldBg,
    borderWidth: 1,
    borderColor: authColors.fieldBorder,
  },
  pillActive: { backgroundColor: authColors.gold, borderColor: authColors.gold },
  pillText: { fontFamily: authFonts.medium, fontSize: 13, color: authColors.ink },
  pillTextActive: { color: authColors.btnText },
  sliderSection: { gap: 4 },
  sliderLabel: { fontFamily: authFonts.medium, fontSize: 14, color: authColors.ink },
  sliderTicks: { flexDirection: 'row', justifyContent: 'space-between' },
  tickLabel: { fontFamily: authFonts.body, fontSize: 11, color: authColors.muted },
  periodSection: { gap: 10 },
  periodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  previewLabel: {
    fontFamily: authFonts.body,
    fontSize: 13,
    color: authColors.muted,
    marginBottom: 8,
  },
  cta: { marginTop: 'auto' },
})
