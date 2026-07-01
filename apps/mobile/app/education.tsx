import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import { getPhaseById, PHASE_EDUCATION, EDUCATION_DISCLAIMER } from '@lunari/phase-data'
import { phases as phaseTheme, phaseKeyFor, palette } from '@lunari/design-tokens'
import type { PhaseId } from '@lunari/types'

const PHASE_IDS: PhaseId[] = ['menstrual', 'follicular', 'ovulatory', 'luteal']

// Light phases (Ovulation) take dark text + dark gold; dark phases take light text
// + bright gold. (Same rule as the Today flood.)
function isLightHex(hex: string): boolean {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return 0.299 * r + 0.587 * g + 0.114 * b > 150
}

export default function EducationScreen() {
  const params = useLocalSearchParams<{ phase?: string; variant?: string }>()
  const phaseId: PhaseId = PHASE_IDS.includes(params.phase as PhaseId)
    ? (params.phase as PhaseId)
    : 'menstrual'
  const variant: 'early' | 'late' = params.variant === 'late' ? 'late' : 'early'
  const card = PHASE_EDUCATION[phaseId][variant]

  const phase = getPhaseById(phaseId)
  const t = phaseTheme[phaseKeyFor(phase.id)]
  const light = isLightHex(t.phase)
  const gold = light ? palette.goldOnLight : palette.gold
  const ink = t.floodText
  const sub = t.floodSub
  const cardwash = light ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.10)'
  const cardbd = light ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.20)'
  const baseColor = t.floodColors[t.floodColors.length - 1]

  return (
    <View style={{ flex: 1, backgroundColor: baseColor }}>
      <LinearGradient
        colors={t.floodColors as [string, string, ...string[]]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <ScrollView contentContainerStyle={styles.scroll}>
            {/* ── Top bar ── */}
            <View style={styles.topbar}>
              <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
                <Text style={[styles.back, { color: gold }]}>← Today</Text>
              </TouchableOpacity>
              <Text style={[styles.eyebrow, { color: gold }]}>
                Today&apos;s insight · {t.label}
              </Text>
            </View>

            <Text style={[styles.title, { color: ink }]}>{card.title}</Text>
            <Text style={[styles.body, { color: ink }]}>{card.body}</Text>

            {/* ── Today's tip (visually distinct) ── */}
            <View style={[styles.tip, { backgroundColor: cardwash, borderColor: cardbd }]}>
              <Text style={[styles.tipLabel, { color: gold }]}>Today&apos;s tip</Text>
              <Text style={[styles.tipText, { color: ink }]}>{card.tip}</Text>
            </View>

            <Text style={[styles.disclaimer, { color: sub }]}>{EDUCATION_DISCLAIMER}</Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.back()}
              style={[styles.closeBtn, { borderColor: gold }]}
            >
              <Text style={[styles.closeText, { color: gold }]}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 36 },
  topbar: { marginBottom: 22 },
  back: { fontFamily: 'Raleway_600SemiBold', fontSize: 13, marginBottom: 14 },
  eyebrow: {
    fontFamily: 'Raleway_600SemiBold',
    fontSize: 9,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  title: { fontFamily: 'Marcellus_400Regular', fontSize: 34, lineHeight: 38 },
  body: {
    fontFamily: 'Raleway_300Light',
    fontSize: 14,
    lineHeight: 24,
    marginTop: 16,
  },
  tip: {
    marginTop: 22,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  tipLabel: {
    fontFamily: 'Raleway_600SemiBold',
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  tipText: { fontFamily: 'Raleway_400Regular', fontSize: 13, lineHeight: 20, marginTop: 7 },
  disclaimer: { fontFamily: 'Raleway_400Regular', fontSize: 10, lineHeight: 15, marginTop: 20 },
  closeBtn: {
    marginTop: 24,
    paddingVertical: 13,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
  },
  closeText: { fontFamily: 'Raleway_600SemiBold', fontSize: 12, letterSpacing: 0.6 },
})
