import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Slider from '@react-native-community/slider'
import { format, subDays } from 'date-fns'
import { getDayInCycle, getPhaseForDay } from '@lunari/phase-data'
import { PhaseHero } from '@lunari/ui'
import { useOnboardingStore } from './store'

export default function CycleManual() {
  const { setStep, setCycleData } = useOnboardingStore()
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 14), 'yyyy-MM-dd'))
  const [cycleLength, setCycleLength] = useState(28)

  useEffect(() => { setStep(4) }, [setStep])

  const day = getDayInCycle(startDate, undefined, cycleLength)
  const phase = getPhaseForDay(day)

  const handleContinue = () => {
    setCycleData(startDate, cycleLength)
    router.push('/onboarding/notifications')
  }

  // Simple date picker: offset days from today
  const offsetDays = [1, 7, 14, 21, 28]

  return (
    <SafeAreaView style={styles.safe}>
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
                style={[styles.datePill, active && styles.datePillActive]}
                onPress={() => setStartDate(date)}
              >
                <Text style={[styles.datePillText, active && styles.datePillTextActive]}>
                  {label}
                </Text>
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
            minimumTrackTintColor="#C9A84C"
            maximumTrackTintColor="#E8E2D6"
            thumbTintColor="#C9A84C"
          />
          <View style={styles.sliderTicks}>
            <Text style={styles.tickLabel}>21</Text>
            <Text style={styles.tickLabel}>35</Text>
          </View>
        </View>

        <View>
          <Text style={styles.previewLabel}>Your estimated phase</Text>
          <PhaseHero phase={phase} cycleDay={day} />
        </View>

        <TouchableOpacity style={styles.cta} onPress={handleContinue} activeOpacity={0.85}>
          <Text style={styles.ctaText}>This looks right →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E8' },
  container: { flex: 1, padding: 24, gap: 24 },
  heading: { fontFamily: 'PlayfairDisplay', fontSize: 26, color: '#2C2825' },
  dateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  datePill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9999,
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E8E2D6',
  },
  datePillActive: { backgroundColor: '#2C2825', borderColor: '#2C2825' },
  datePillText: { fontFamily: 'Inter', fontSize: 13, color: '#2C2825' },
  datePillTextActive: { color: '#FFFFFF' },
  sliderSection: { gap: 4 },
  sliderLabel: { fontFamily: 'Inter', fontSize: 14, fontWeight: '500', color: '#2C2825' },
  sliderTicks: { flexDirection: 'row', justifyContent: 'space-between' },
  tickLabel: { fontFamily: 'Inter', fontSize: 11, color: '#6B6460' },
  previewLabel: {
    fontFamily: 'Inter', fontSize: 13, color: '#6B6460', marginBottom: 8,
  },
  cta: {
    backgroundColor: '#2C2825', borderRadius: 12, paddingVertical: 16, alignItems: 'center',
    marginTop: 'auto',
  },
  ctaText: { fontFamily: 'Inter', fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
})
