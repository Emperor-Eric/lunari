import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, Image, ScrollView, RefreshControl, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Circle } from 'react-native-svg'
import { useAuth } from '@lunari/utils'
import { getPhaseForDay } from '@lunari/phase-data'
import { phases, phaseKeyFor, palette } from '@lunari/design-tokens'
import { LoadingSpinner } from '@lunari/ui'
import type { TodayCycleResponse } from '@lunari/types'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/v1'

export default function Today() {
  const { session } = useAuth()
  const [cycleData, setCycleData] = useState<TodayCycleResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [quickSymptoms, setQuickSymptoms] = useState<string[]>([])

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

  const phase = cycleData ? getPhaseForDay(cycleData.day) : getPhaseForDay(1)
  const t = phases[phaseKeyFor(phase.id)]

  if (loading) return <LoadingSpinner phaseColor={t.accent} />

  const containerNumber = cycleData?.containerNumber ?? 1
  const day = cycleData?.day ?? 1
  const quickTags = phase.symptoms.slice(0, 4)
  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <View style={{ flex: 1, backgroundColor: t.labBg }}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} />
        }
      >
        {/* ─── HERO: floods with the phase gradient ─── */}
        <LinearGradient
          colors={t.floodColors as [string, string, ...string[]]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.hero}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.heroInner}>
              {/* Celestial cluster: gold goddess seal within 2 gold orbit rings */}
              <View style={styles.sealCluster}>
                <Svg width={120} height={120} style={StyleSheet.absoluteFill}>
                  <Circle cx={60} cy={60} r={58} stroke={palette.gold} strokeOpacity={0.3} strokeWidth={1} fill="none" />
                  <Circle cx={60} cy={60} r={50} stroke={palette.gold} strokeOpacity={0.22} strokeWidth={1} fill="none" />
                </Svg>
                {/* Goddess seal — gold line-art on transparent.
                    Asset: apps/mobile/assets/brand/seal-gold.png */}
                <Image
                  source={require('../../assets/brand/seal-gold.png')}
                  style={styles.seal}
                  resizeMode="contain"
                />
              </View>

              <Text style={[styles.vibe, { color: t.headerLabel }]}>{t.vibe.toUpperCase()}</Text>
              <Text style={[styles.phaseName, { color: t.floodText }]}>{t.label}</Text>
              <Text style={[styles.heroSub, { color: t.floodSub }]}>
                Day {day} · {dateLabel}
              </Text>

              {/* Phase progress segments — current = gold */}
              <View style={styles.segments}>
                {[1, 2, 3, 4].map((n) => (
                  <View
                    key={n}
                    style={[
                      styles.segment,
                      { backgroundColor: n === containerNumber ? palette.gold : 'rgba(255,255,255,0.22)' },
                    ]}
                  />
                ))}
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.body}>
          {/* ─── Container selector — 1/2/3/4, active = gold ─── */}
          <View>
            <Text style={[styles.sectionLabel, { color: t.textMuted }]}>
              Container {containerNumber} of 4 — {t.label} phase
            </Text>
            <View style={styles.containerRow}>
              {[1, 2, 3, 4].map((n) => {
                const active = n === containerNumber
                return (
                  <View
                    key={n}
                    style={[
                      styles.containerCard,
                      { backgroundColor: t.labCard, borderColor: active ? palette.gold : t.labBorder },
                    ]}
                  >
                    <Text
                      style={[styles.containerNum, { color: active ? palette.goldOnLight : t.textMuted }]}
                    >
                      {n}
                    </Text>
                  </View>
                )
              })}
            </View>
          </View>

          {/* ─── Symptoms — Lab card ─── */}
          <View style={[styles.card, { backgroundColor: t.labCard, borderColor: t.labBorder }]}>
            <Text style={[styles.cardHeading, { color: t.text }]}>How are you feeling today?</Text>
            <View style={styles.tagRow}>
              {quickTags.map((tag) => {
                const on = quickSymptoms.includes(tag)
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.tag,
                      {
                        backgroundColor: on ? t.accent : t.labCard,
                        borderColor: on ? t.accent : t.labBorder,
                      },
                    ]}
                    onPress={() =>
                      setQuickSymptoms((prev) =>
                        prev.includes(tag) ? prev.filter((s) => s !== tag) : [...prev, tag]
                      )
                    }
                  >
                    <Text style={[styles.tagText, { color: on ? '#FFFFFF' : t.text }]}>{tag}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          {/* ─── Supplement focus — Lab card ─── */}
          <View style={[styles.card, { backgroundColor: t.labCard, borderColor: t.labBorder }]}>
            <Text style={[styles.cardHeading, { color: t.text }]}>Today&apos;s supplement focus</Text>
            <View style={styles.supplementList}>
              {phase.supplements.slice(8, 10).map((s) => (
                <View key={s.name} style={[styles.supplementRow, { backgroundColor: t.labWhy }]}>
                  <View style={styles.supplementInfo}>
                    <Text style={[styles.supplementName, { color: t.text }]}>{s.name}</Text>
                    <Text style={[styles.supplementPurpose, { color: t.textSoft }]} numberOfLines={2}>
                      {s.purpose}
                    </Text>
                  </View>
                  <View style={[styles.dosagePill, { backgroundColor: t.labCard }]}>
                    <Text style={[styles.dosageText, { color: t.accent }]}>{s.dosage}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 40 },
  hero: { paddingBottom: 28 },
  heroInner: { paddingHorizontal: 24, paddingTop: 12, alignItems: 'center' },
  sealCluster: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  seal: { width: 84, height: 84 },
  vibe: {
    fontFamily: 'Raleway_600SemiBold',
    fontSize: 11,
    letterSpacing: 3,
  },
  phaseName: {
    fontFamily: 'Marcellus_400Regular',
    fontSize: 40,
    marginTop: 8,
  },
  heroSub: { fontFamily: 'Raleway_400Regular', fontSize: 13, marginTop: 8 },
  segments: { flexDirection: 'row', gap: 6, marginTop: 20 },
  segment: { height: 4, width: 42, borderRadius: 2 },

  body: { padding: 20, gap: 20, marginTop: 4 },
  sectionLabel: { fontFamily: 'Raleway_400Regular', fontSize: 13, marginBottom: 10, marginLeft: 2 },
  containerRow: { flexDirection: 'row', gap: 10 },
  containerCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    paddingVertical: 16,
    alignItems: 'center',
  },
  containerNum: { fontFamily: 'Marcellus_400Regular', fontSize: 28 },

  card: { borderRadius: 18, borderWidth: 1, padding: 18, gap: 12 },
  cardHeading: { fontFamily: 'Raleway_600SemiBold', fontSize: 15 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9999, borderWidth: 1.5 },
  tagText: { fontFamily: 'Raleway_500Medium', fontSize: 13 },

  supplementList: { gap: 8 },
  supplementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    padding: 14,
  },
  supplementInfo: { flex: 1, gap: 3 },
  supplementName: { fontFamily: 'Raleway_600SemiBold', fontSize: 14 },
  supplementPurpose: { fontFamily: 'Raleway_400Regular', fontSize: 12, lineHeight: 17 },
  dosagePill: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  dosageText: { fontFamily: 'Raleway_600SemiBold', fontSize: 12 },
})
