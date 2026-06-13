import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Circle } from 'react-native-svg'
import { router } from 'expo-router'
import { useAuth } from '@lunari/utils'
import { getPhaseForDay, getPhaseById } from '@lunari/phase-data'
import { phases as phaseTheme, phaseKeyFor } from '@lunari/design-tokens'
import type { TodayCycleResponse, CycleSettings } from '@lunari/types'
import { CycleCalendar } from '../src/components/CycleCalendar'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/v1'

function headerStops(css: string): string[] {
  return css.match(/#[0-9a-fA-F]{6}/g) ?? []
}

export default function CalendarScreen() {
  const { session } = useAuth()
  const [cycleData, setCycleData] = useState<TodayCycleResponse | null>(null)
  const [settings, setSettings] = useState<CycleSettings | null>(null)

  const authHeaders = useCallback(
    () => ({ Authorization: `Bearer ${session?.access_token}` }),
    [session]
  )

  useEffect(() => {
    if (!session) return
    fetch(`${API_URL}/me/cycle/today`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: TodayCycleResponse | null) => d && setCycleData(d))
      .catch(() => {})
    fetch(`${API_URL}/me/cycle`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: CycleSettings | null) => setSettings(d))
      .catch(() => setSettings(null))
  }, [session, authHeaders])

  const day = cycleData?.day ?? 1
  const phase = cycleData ? getPhaseById(cycleData.phase) : getPhaseForDay(1)
  const t = phaseTheme[phaseKeyFor(phase.id)]

  // Light Lab surface so the phase colours read clearly (NOT the dark flood).
  const surface = { ink: '#2C2825', sub: '#A99E88', gold: t.accent, cardwash: t.labCard, cardbd: t.labBorder }
  const stops = headerStops(t.header)
  const headerColors = (stops.length >= 2 ? stops : [t.headerLabel, t.headerLabel]) as [string, string, ...string[]]

  return (
    <View style={{ flex: 1, backgroundColor: t.labBg }}>
      {/* ── HEADER BAND (phase gradient) ── */}
      <LinearGradient colors={headerColors} start={{ x: 0.2, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.header}>
        <Svg width={130} height={130} style={styles.orbit}>
          <Circle cx={65} cy={65} r={64} stroke={t.headerLabel} strokeOpacity={0.25} strokeWidth={1} fill="none" />
        </Svg>
        <SafeAreaView edges={['top']} style={styles.headerInner}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
            <Text style={[styles.back, { color: t.headerLabel }]}>← Today</Text>
          </TouchableOpacity>
          <Text style={[styles.context, { color: t.headerLabel }]}>
            {t.label} · Day {day}
          </Text>
          <Text style={[styles.title, { color: t.headerText }]}>Calendar</Text>
          <Text style={[styles.subtitle, { color: t.headerText }]}>your estimated phases, month by month</Text>
        </SafeAreaView>
      </LinearGradient>

      {/* ── TINTED BODY ── */}
      <ScrollView contentContainerStyle={styles.body}>
        <CycleCalendar settings={settings} surface={surface} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  header: { overflow: 'hidden' },
  orbit: { position: 'absolute', right: -34, top: -22 },
  headerInner: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 22 },
  back: { fontFamily: 'Raleway_500Medium', fontSize: 11, marginTop: 6 },
  context: { fontFamily: 'Raleway_600SemiBold', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', marginTop: 14 },
  title: { fontFamily: 'Marcellus_400Regular', fontSize: 30, marginTop: 5 },
  subtitle: { fontFamily: 'Raleway_300Light', fontSize: 12, marginTop: 4, opacity: 0.72 },
  body: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 40 },
})
