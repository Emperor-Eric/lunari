import React, { useEffect } from 'react'
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useOnboardingStore } from './store'

const TIME_OPTIONS = ['07:00', '08:00', '09:00', '10:00', '12:00']

export default function Notifications() {
  const { setStep, dailyReminder, reminderTime, setNotifications } = useOnboardingStore()
  useEffect(() => { setStep(5) }, [setStep])

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.heading}>Daily reminders</Text>
        <Text style={styles.body}>We'll remind you to take your supplements and log how you're feeling.</Text>

        {/* Toggle */}
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Daily phase reminder</Text>
          <Switch
            value={dailyReminder}
            onValueChange={(v) => setNotifications(v, reminderTime)}
            trackColor={{ true: '#C9A84C', false: '#E8E2D6' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {dailyReminder && (
          <View style={styles.timePicker}>
            <Text style={styles.timeLabel}>Remind me at</Text>
            <View style={styles.timeRow}>
              {TIME_OPTIONS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.timePill, t === reminderTime && styles.timePillActive]}
                  onPress={() => setNotifications(dailyReminder, t)}
                >
                  <Text style={[styles.timePillText, t === reminderTime && styles.timePillTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Preview bubble */}
        {dailyReminder && (
          <View style={styles.previewBubble}>
            <Text style={styles.previewIcon}>🌙</Text>
            <View>
              <Text style={styles.previewTitle}>lunari · {reminderTime}</Text>
              <Text style={styles.previewBody}>Time for today's phase check-in ✨</Text>
            </View>
          </View>
        )}

        <View style={styles.bottom}>
          <TouchableOpacity
            style={styles.cta}
            onPress={() => router.push('/onboarding/ready')}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>
              {dailyReminder ? 'Enable reminders' : 'Continue'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/onboarding/ready')}>
            <Text style={styles.skipText}>Not now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E8' },
  container: { flex: 1, padding: 24, gap: 24 },
  heading: { fontFamily: 'PlayfairDisplay', fontSize: 26, color: '#2C2825' },
  body: { fontFamily: 'Inter', fontSize: 14, color: '#6B6460', lineHeight: 22 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontFamily: 'Inter', fontSize: 15, fontWeight: '500', color: '#2C2825' },
  timePicker: { gap: 12 },
  timeLabel: { fontFamily: 'Inter', fontSize: 14, color: '#6B6460' },
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timePill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9999,
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E8E2D6',
  },
  timePillActive: { backgroundColor: '#2C2825', borderColor: '#2C2825' },
  timePillText: { fontFamily: 'Inter', fontSize: 13, color: '#2C2825' },
  timePillTextActive: { color: '#FFFFFF' },
  previewBubble: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#E8E2D6',
  },
  previewIcon: { fontSize: 24 },
  previewTitle: { fontFamily: 'Inter', fontSize: 12, fontWeight: '600', color: '#2C2825' },
  previewBody: { fontFamily: 'Inter', fontSize: 12, color: '#6B6460' },
  bottom: { marginTop: 'auto', gap: 12 },
  cta: {
    backgroundColor: '#2C2825', borderRadius: 12, paddingVertical: 16, alignItems: 'center',
  },
  ctaText: { fontFamily: 'Inter', fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  skipText: {
    fontFamily: 'Inter', fontSize: 14, color: '#6B6460',
    textAlign: 'center', textDecorationLine: 'underline',
  },
})
