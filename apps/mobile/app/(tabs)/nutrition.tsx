import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Circle } from 'react-native-svg'
import { useAuth } from '@lunari/utils'
import { getPhaseForDay, getPhaseById } from '@lunari/phase-data'
import { phases as phaseTheme, phaseKeyFor } from '@lunari/design-tokens'
import { LoadingSpinner } from '@lunari/ui'
import type { TodayCycleResponse, PhaseId } from '@lunari/types'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/v1'

// Curated per-phase Fuel metadata (no nutrition-tagline / focus-nutrient data in
// phase-data). Ovulation matches the design reference exactly.
const FUEL_TAGLINE: Record<PhaseId, string> = {
  menstrual: 'iron-rich, warming, replenishing',
  follicular: 'fresh, vibrant, energising',
  ovulatory: 'light, fresh, anti-inflammatory',
  luteal: 'grounding, complex carbs, magnesium',
}
const FUEL_FOCUS: Record<PhaseId, { label: string; sub: string }[]> = {
  menstrual: [
    { label: 'Iron', sub: 'replenish' },
    { label: 'Warm', sub: 'soothe' },
    { label: 'Magnesium', sub: 'ease cramps' },
  ],
  follicular: [
    { label: 'Protein', sub: 'build' },
    { label: 'Probiotics', sub: 'gut' },
    { label: 'Seeds', sub: 'estrogen' },
  ],
  ovulatory: [
    { label: 'Fiber', sub: 'clearance' },
    { label: 'Raw', sub: 'cooling' },
    { label: 'Zinc', sub: 'egg quality' },
  ],
  luteal: [
    { label: 'Complex carbs', sub: 'calm' },
    { label: 'Magnesium', sub: 'mood' },
    { label: 'Fiber', sub: 'anti-bloat' },
  ],
}

const N = { section: '#A99E88', title: '#2C2825', stat: '#6A655D' }

function headerStops(css: string): string[] {
  return css.match(/#[0-9a-fA-F]{6}/g) ?? []
}

export default function Nutrition() {
  const { session } = useAuth()
  const [cycleData, setCycleData] = useState<TodayCycleResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [coreOpen, setCoreOpen] = useState(false)

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
  const phase = cycleData ? getPhaseById(cycleData.phase) : getPhaseForDay(1)
  const t = phaseTheme[phaseKeyFor(phase.id)]

  if (loading) return <LoadingSpinner phaseColor={t.accent} />

  const focus = FUEL_FOCUS[phase.id]
  const phaseSupplements = phase.supplements.slice(8)
  const coreBlend = phase.supplements.slice(0, 8)
  const stops = headerStops(t.header)
  const headerColors = (stops.length >= 2 ? stops : [t.headerLabel, t.headerLabel]) as [string, string, ...string[]]

  return (
    <View style={{ flex: 1, backgroundColor: t.labBg }}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} />}
      >
        {/* ── HEADER BAND ── */}
        <LinearGradient colors={headerColors} start={{ x: 0.2, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.header}>
          <Svg width={130} height={130} style={styles.orbit}>
            <Circle cx={65} cy={65} r={64} stroke={t.headerLabel} strokeOpacity={0.25} strokeWidth={1} fill="none" />
          </Svg>
          <SafeAreaView edges={['top']} style={styles.headerInner}>
            <Text style={[styles.context, { color: t.headerLabel }]}>
              {t.label} · Day {day}
            </Text>
            <Text style={[styles.title, { color: t.headerText }]}>Fuel</Text>
            <Text style={[styles.tagline, { color: t.headerText }]}>{FUEL_TAGLINE[phase.id]}</Text>
          </SafeAreaView>
        </LinearGradient>

        {/* ── TINTED BODY ── */}
        <View style={styles.body}>
          {/* nutrition focus tiles */}
          <View style={styles.focusRow}>
            {focus.map((f) => (
              <View key={f.label} style={[styles.tile, { backgroundColor: t.labCard, borderColor: t.labBorder }]}>
                <Text style={[styles.tileLabel, { color: t.accent }]}>{f.label}</Text>
                <Text style={[styles.tileSub, { color: N.section }]}>{f.sub}</Text>
              </View>
            ))}
          </View>

          {/* foods to prioritize (real) */}
          <Text style={[styles.sectionLabel, { color: N.section }]}>Foods to prioritize</Text>
          <View>
            {phase.foods.map((f, i) => {
              const last = i === phase.foods.length - 1
              return (
                <View key={f.name} style={[styles.row, { borderBottomColor: t.labBorder, borderBottomWidth: last ? 0 : 1 }]}>
                  <Text style={[styles.rowName, { color: N.title }]}>{f.name}</Text>
                  <Text style={[styles.rowSub, { color: N.section }]} numberOfLines={2}>
                    {f.reason}
                  </Text>
                </View>
              )
            })}
          </View>

          {/* phase supplements (real) */}
          <Text style={[styles.sectionLabel, { color: N.section }]}>Phase supplements</Text>
          <View>
            {phaseSupplements.map((s, i) => {
              const last = i === phaseSupplements.length - 1
              return (
                <View key={s.name} style={[styles.rowSplit, { borderBottomColor: t.labBorder, borderBottomWidth: last ? 0 : 1 }]}>
                  <View style={styles.rowInfo}>
                    <Text style={[styles.rowName, { color: N.title }]}>{s.name}</Text>
                    <Text style={[styles.rowSub, { color: N.section }]} numberOfLines={1}>
                      {s.purpose.split('—')[0].trim()}
                    </Text>
                  </View>
                  <Text style={[styles.dose, { color: t.accent }]}>{s.dosage}</Text>
                </View>
              )
            })}
          </View>

          {/* core blend (real, collapsible) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setCoreOpen((o) => !o)}
            style={[styles.coreToggle, { backgroundColor: t.labCard, borderColor: t.labBorder }]}
          >
            <Text style={[styles.coreToggleText, { color: N.title }]}>Core blend · all phases</Text>
            <Text style={[styles.coreChevron, { color: N.section }]}>{coreOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {coreOpen && (
            <View style={{ marginTop: 12 }}>
              {coreBlend.map((s, i) => {
                const last = i === coreBlend.length - 1
                return (
                  <View key={s.name} style={[styles.rowSplit, { borderBottomColor: t.labBorder, borderBottomWidth: last ? 0 : 1 }]}>
                    <View style={styles.rowInfo}>
                      <Text style={[styles.coreName, { color: N.title }]}>{s.name}</Text>
                      <Text style={[styles.rowSub, { color: N.section }]} numberOfLines={1}>
                        {s.purpose.split('—')[0].trim()}
                      </Text>
                    </View>
                    <Text style={[styles.coreDose, { color: t.accent }]}>{s.dosage}</Text>
                  </View>
                )
              })}
            </View>
          )}
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

  // focus tiles
  focusRow: { flexDirection: 'row', gap: 9 },
  tile: { flex: 1, borderRadius: 13, borderWidth: 1, paddingVertical: 13, paddingHorizontal: 9, alignItems: 'center' },
  tileLabel: { fontFamily: 'Marcellus_400Regular', fontSize: 17 },
  tileSub: { fontFamily: 'Raleway_400Regular', fontSize: 8.5, marginTop: 4 },

  // section label
  sectionLabel: { fontFamily: 'Raleway_500Medium', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', marginTop: 22, marginBottom: 12 },

  // food rows (name + benefit)
  row: { paddingBottom: 14, marginBottom: 14 },
  rowName: { fontFamily: 'Marcellus_400Regular', fontSize: 15.5 },
  rowSub: { fontFamily: 'Raleway_300Light', fontSize: 10.5, marginTop: 2, lineHeight: 15 },

  // supplement rows (name + note + dose)
  rowSplit: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, marginBottom: 14 },
  rowInfo: { flex: 1, paddingRight: 12 },
  dose: { fontFamily: 'Marcellus_400Regular', fontSize: 14 },

  // core blend
  coreToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 22,
    borderRadius: 13,
    borderWidth: 1,
    paddingVertical: 13,
    paddingHorizontal: 15,
  },
  coreToggleText: { fontFamily: 'Raleway_600SemiBold', fontSize: 10.5 },
  coreChevron: { fontFamily: 'Raleway_400Regular', fontSize: 10 },
  coreName: { fontFamily: 'Marcellus_400Regular', fontSize: 14.5 },
  coreDose: { fontFamily: 'Marcellus_400Regular', fontSize: 13 },
})
