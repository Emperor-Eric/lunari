import React, { useEffect } from 'react'
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { GoldButton, authColors, authFonts } from '../../src/components/AuthChrome'
import { useOnboardingStore } from '../../src/stores/onboarding'

const TIME_OPTIONS = ['07:00', '08:00', '09:00', '10:00', '12:00']

export default function Notifications() {
  const { setStep, dailyReminder, reminderTime, setNotifications } = useOnboardingStore()
  useEffect(() => {
    setStep(5)
  }, [setStep])

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.heading}>Daily reminders</Text>
        <Text style={styles.body}>
          We&apos;ll remind you to take your supplements and log how you&apos;re feeling.
        </Text>

        {/* Toggle */}
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Daily phase reminder</Text>
          <Switch
            value={dailyReminder}
            onValueChange={(v) => setNotifications(v, reminderTime)}
            trackColor={{ true: authColors.gold, false: 'rgba(245,235,214,0.2)' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {dailyReminder && (
          <View style={styles.timePicker}>
            <Text style={styles.timeLabel}>Remind me at</Text>
            <View style={styles.timeRow}>
              {TIME_OPTIONS.map((t) => {
                const active = t === reminderTime
                return (
                  <TouchableOpacity
                    key={t}
                    style={[styles.pill, active && styles.pillActive]}
                    onPress={() => setNotifications(dailyReminder, t)}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{t}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        )}

        {/* Preview bubble */}
        {dailyReminder && (
          <View style={styles.previewBubble}>
            <Text style={styles.previewIcon}>🌙</Text>
            <View>
              <Text style={styles.previewTitle}>lunari · {reminderTime}</Text>
              <Text style={styles.previewBody}>Time for today&apos;s phase check-in ✨</Text>
            </View>
          </View>
        )}

        <View style={styles.bottom}>
          <GoldButton
            label={dailyReminder ? 'Enable reminders' : 'Continue'}
            onPress={() => router.push('/onboarding/ready')}
          />
          <TouchableOpacity onPress={() => router.push('/onboarding/ready')}>
            <Text style={styles.skipText}>Not now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 24, gap: 24 },
  heading: { fontFamily: authFonts.display, fontSize: 26, color: authColors.ink },
  body: { fontFamily: authFonts.body, fontSize: 14, color: authColors.muted, lineHeight: 22 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontFamily: authFonts.medium, fontSize: 15, color: authColors.ink },
  timePicker: { gap: 12 },
  timeLabel: { fontFamily: authFonts.body, fontSize: 14, color: authColors.muted },
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
  previewBubble: {
    backgroundColor: authColors.fieldBg,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: authColors.fieldBorder,
  },
  previewIcon: { fontSize: 24 },
  previewTitle: { fontFamily: authFonts.semibold, fontSize: 12, color: authColors.ink },
  previewBody: { fontFamily: authFonts.body, fontSize: 12, color: authColors.muted },
  bottom: { marginTop: 'auto', gap: 12 },
  skipText: {
    fontFamily: authFonts.medium,
    fontSize: 14,
    color: authColors.gold,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
})
