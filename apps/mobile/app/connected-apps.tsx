import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Circle } from 'react-native-svg'
import { router } from 'expo-router'
import { useAuth } from '@lunari/utils'
import { getPhaseForDay, getPhaseById } from '@lunari/phase-data'
import { phases as phaseTheme, phaseKeyFor } from '@lunari/design-tokens'
import type { TodayCycleResponse } from '@lunari/types'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/v1'

const N = { section: '#A99E88', text: '#2C2825', sub: '#8A8275' }

const INTEGRATIONS = [
  { name: 'Apple Health', detail: 'Sync cycle, sleep and activity from your iPhone' },
  { name: 'Google Fit / Health Connect', detail: 'Sync activity and health data on Android' },
  { name: 'Oura', detail: 'Bring in sleep, readiness and temperature trends' },
]

function headerStops(css: string): string[] {
  return css.match(/#[0-9a-fA-F]{6}/g) ?? []
}

export default function ConnectedAppsScreen() {
  const { session } = useAuth()
  const [cycleData, setCycleData] = useState<TodayCycleResponse | null>(null)

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
  }, [session, authHeaders])

  const phase = cycleData ? getPhaseById(cycleData.phase) : getPhaseForDay(1)
  const t = phaseTheme[phaseKeyFor(phase.id)]
  const stops = headerStops(t.header)
  const headerColors = (stops.length >= 2 ? stops : [t.headerLabel, t.headerLabel]) as [
    string,
    string,
    ...string[],
  ]

  return (
    <View style={{ flex: 1, backgroundColor: t.labBg }}>
      {/* ── HEADER BAND (phase gradient) ── */}
      <LinearGradient
        colors={headerColors}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.header}
      >
        <Svg width={130} height={130} style={styles.orbit}>
          <Circle
            cx={65}
            cy={65}
            r={64}
            stroke={t.headerLabel}
            strokeOpacity={0.25}
            strokeWidth={1}
            fill="none"
          />
        </Svg>
        <SafeAreaView edges={['top']} style={styles.headerInner}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
            <Text style={[styles.back, { color: t.headerLabel }]}>← Me</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: t.headerText }]}>Connected apps</Text>
          <Text style={[styles.subtitle, { color: t.headerText }]}>
            sync lunari with your other health apps
          </Text>
        </SafeAreaView>
      </LinearGradient>

      {/* ── TINTED BODY ── */}
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={[styles.intro, { color: N.text }]}>
          Connecting other apps will let lunari read your sleep, activity and health signals to
          sharpen your phase predictions. These integrations aren&apos;t available yet —
          they&apos;re on the way.
        </Text>

        <Text style={[styles.sectionLabel, { color: N.section }]}>Planned integrations</Text>

        <View style={{ gap: 10 }}>
          {INTEGRATIONS.map((app) => (
            <View
              key={app.name}
              style={[styles.row, { backgroundColor: t.labCard, borderColor: t.labBorder }]}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={[styles.appName, { color: N.text }]}>{app.name}</Text>
                <Text style={[styles.appDetail, { color: N.sub }]}>{app.detail}</Text>
              </View>
              <View style={[styles.pill, { borderColor: t.labBorder }]}>
                <Text style={[styles.pillText, { color: N.section }]}>Coming soon</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  header: { overflow: 'hidden' },
  orbit: { position: 'absolute', right: -34, top: -22 },
  headerInner: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 22 },
  back: { fontFamily: 'Raleway_500Medium', fontSize: 11, marginTop: 6 },
  title: { fontFamily: 'Marcellus_400Regular', fontSize: 30, marginTop: 14 },
  subtitle: { fontFamily: 'Raleway_300Light', fontSize: 12, marginTop: 4, opacity: 0.72 },
  body: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 40 },
  intro: { fontFamily: 'Raleway_300Light', fontSize: 13, lineHeight: 20 },
  sectionLabel: {
    fontFamily: 'Raleway_500Medium',
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 11,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 13,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    opacity: 0.75,
  },
  appName: { fontFamily: 'Marcellus_400Regular', fontSize: 15.5 },
  appDetail: { fontFamily: 'Raleway_300Light', fontSize: 11, marginTop: 2 },
  pill: { borderWidth: 1, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 9 },
  pillText: {
    fontFamily: 'Raleway_500Medium',
    fontSize: 8.5,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
})
