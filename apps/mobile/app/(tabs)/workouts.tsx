import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Circle } from 'react-native-svg'
import { useAuth } from '@lunari/utils'
import { getPhaseForDay } from '@lunari/phase-data'
import { phases as phaseTheme, phaseKeyFor } from '@lunari/design-tokens'
import { LoadingSpinner } from '@lunari/ui'
import type { TodayCycleResponse, PhaseId } from '@lunari/types'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/v1'

// Phase-level Move metadata — sensible per-phase defaults (Ovulation matches the
// design reference exactly). phase-data has no move-intensity/why fields.
const INTENSITY: Record<PhaseId, { bars: number; value: string }> = {
  menstrual: { bars: 1, value: 'Low · restorative' },
  follicular: { bars: 4, value: 'Building · push harder' },
  ovulatory: { bars: 5, value: 'Peak · highest output' },
  luteal: { bars: 3, value: 'Moderate · winding down' },
}
const MOVE_TAGLINE: Record<PhaseId, string> = {
  menstrual: 'rest and restore — keep it gentle',
  follicular: 'energy is rising — start building',
  ovulatory: 'your strongest days — go for it',
  luteal: 'ease off — steady and supportive',
}
const MOVE_WHY: Record<PhaseId, string> = {
  menstrual: 'low energy and higher injury risk — prioritise rest, mobility, and gentle walks.',
  follicular: 'rising estrogen boosts strength and recovery — a great window to build.',
  ovulatory: 'peak estrogen and testosterone make this your highest-output window.',
  luteal: 'progesterone rises and energy dips — favour moderate, steady sessions over max efforts.',
}

// Fixed Lab neutrals — phase-independent (labBg is light on all four phases).
const N = { label: '#8A8275', section: '#A99E88', title: '#2C2825', text: '#6A655D', barOff: '#E5DDCD' }

// The token `header` is a CSS gradient string; pull its hex stops for LinearGradient.
function headerStops(css: string): string[] {
  return css.match(/#[0-9a-fA-F]{6}/g) ?? []
}

export default function Workouts() {
  const { session } = useAuth()
  const [cycleData, setCycleData] = useState<TodayCycleResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchToday = useCallback(async () => {
    if (!session) return
    try {
      const res = await fetch(`${API_URL}/me/cycle/today`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) setCycleData(await res.json())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [session])

  useEffect(() => {
    fetchToday()
  }, [fetchToday])

  const onRefresh = () => {
    setRefreshing(true)
    fetchToday()
  }

  const day = cycleData?.day ?? 1
  const phase = cycleData ? getPhaseForDay(cycleData.day) : getPhaseForDay(1)
  const t = phaseTheme[phaseKeyFor(phase.id)]

  if (loading) return <LoadingSpinner phaseColor={t.accent} />

  const intensity = INTENSITY[phase.id]
  const stops = headerStops(t.header)
  const headerColors = (stops.length >= 2 ? stops : [t.headerLabel, t.headerLabel]) as [string, string, ...string[]]

  return (
    <View style={{ flex: 1, backgroundColor: t.labBg }}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} />}
      >
        {/* ── HEADER BAND (phase gradient) ── */}
        <LinearGradient colors={headerColors} start={{ x: 0.2, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.header}>
          {/* gold orbit arc bleeding off the top-right */}
          <Svg width={130} height={130} style={styles.orbit}>
            <Circle cx={65} cy={65} r={64} stroke={t.headerLabel} strokeOpacity={0.25} strokeWidth={1} fill="none" />
          </Svg>
          <SafeAreaView edges={['top']} style={styles.headerInner}>
            <Text style={[styles.context, { color: t.headerLabel }]}>
              {t.label} · Day {day}
            </Text>
            <Text style={[styles.title, { color: t.headerText }]}>Move</Text>
            <Text style={[styles.tagline, { color: t.headerText }]}>{MOVE_TAGLINE[phase.id]}</Text>
          </SafeAreaView>
        </LinearGradient>

        {/* ── TINTED BODY ── */}
        <View style={styles.body}>
          {/* intensity card */}
          <View style={[styles.intensity, { backgroundColor: t.labCard, borderColor: t.labBorder }]}>
            <Text style={[styles.intensityLabel, { color: N.label }]}>Intensity target today</Text>
            <View style={styles.bars}>
              {[0, 1, 2, 3, 4].map((i) => (
                <View key={i} style={[styles.bar, { backgroundColor: i < intensity.bars ? t.accent : N.barOff }]} />
              ))}
            </View>
            <Text style={[styles.intensityValue, { color: t.accent }]}>{intensity.value}</Text>
          </View>

          {/* recommended sessions */}
          <Text style={[styles.sectionLabel, { color: N.section }]}>Recommended sessions</Text>
          <View>
            {phase.workouts.map((w, i) => {
              const sub = w.description.split(/[—.]/)[0].trim()
              const last = i === phase.workouts.length - 1
              return (
                <View
                  key={w.title}
                  style={[styles.session, { borderBottomColor: t.labBorder, borderBottomWidth: last ? 0 : 1 }]}
                >
                  <View style={styles.sessionInfo}>
                    <Text style={[styles.sessionName, { color: N.title }]}>{w.title}</Text>
                    <Text style={[styles.sessionSub, { color: N.section }]}>{sub}</Text>
                  </View>
                  <Text style={[styles.sessionDur, { color: N.text }]}>{w.duration}</Text>
                </View>
              )
            })}
          </View>

          {/* why note */}
          <View style={[styles.why, { backgroundColor: t.labWhy }]}>
            <Text style={[styles.whyText, { color: N.text }]}>
              <Text style={[styles.whyLead, { color: t.accent }]}>Why · </Text>
              {MOVE_WHY[phase.id]}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 40 },

  // header band
  header: { overflow: 'hidden' },
  orbit: { position: 'absolute', right: -34, top: -22 },
  headerInner: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 22 },
  context: { fontFamily: 'Raleway_600SemiBold', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', marginTop: 16 },
  title: { fontFamily: 'Marcellus_400Regular', fontSize: 30, marginTop: 5 },
  tagline: { fontFamily: 'Raleway_300Light', fontSize: 12, marginTop: 4, opacity: 0.72 },

  // tinted body
  body: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 16 },

  // intensity card
  intensity: { borderRadius: 15, borderWidth: 1, paddingVertical: 15, paddingHorizontal: 17 },
  intensityLabel: { fontFamily: 'Raleway_500Medium', fontSize: 10.5 },
  bars: { flexDirection: 'row', gap: 5, marginTop: 9 },
  bar: { flex: 1, height: 6, borderRadius: 3 },
  intensityValue: { fontFamily: 'Raleway_600SemiBold', fontSize: 9.5, marginTop: 8 },

  // section label
  sectionLabel: { fontFamily: 'Raleway_500Medium', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', marginTop: 22, marginBottom: 12 },

  // sessions
  session: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, marginBottom: 14 },
  sessionInfo: { flex: 1 },
  sessionName: { fontFamily: 'Marcellus_400Regular', fontSize: 16.5 },
  sessionSub: { fontFamily: 'Raleway_300Light', fontSize: 10.5, marginTop: 2 },
  sessionDur: { fontFamily: 'Raleway_500Medium', fontSize: 10.5, marginLeft: 10 },

  // why note
  why: { marginTop: 2, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 15 },
  whyText: { fontFamily: 'Raleway_300Light', fontSize: 10.5, lineHeight: 17 },
  whyLead: { fontFamily: 'Raleway_600SemiBold' },
})
