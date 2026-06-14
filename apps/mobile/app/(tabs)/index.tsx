import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, Image, ScrollView, RefreshControl, StyleSheet, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Circle } from 'react-native-svg'
import { router } from 'expo-router'
import { useAuth } from '@lunari/utils'
import { getPhaseForDay, getAllPhases, getPhaseById, getPhaseRanges } from '@lunari/phase-data'
import { phases as phaseTheme, phaseKeyFor, palette } from '@lunari/design-tokens'
import { LoadingSpinner, Toast } from '@lunari/ui'
import type { TodayCycleResponse, PhaseId, CycleSettings, SymptomLog } from '@lunari/types'
import { NextUpCard } from '../../src/components/NextUpCard'
import { LogPeriodCard } from '../../src/components/LogPeriodCard'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/v1'

// Short progress labels per phase.
const SHORT: Record<PhaseId, string> = {
  menstrual: 'MENS',
  follicular: 'FOLL',
  ovulatory: 'OVUL',
  luteal: 'LUT',
}

// Light phases (Ovulation) take dark text + dark-gold linework; dark phases take
// light text + bright gold. (Same rule as the web build.)
function isLightHex(hex: string): boolean {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return 0.299 * r + 0.587 * g + 0.114 * b > 150
}

export default function Today() {
  const { session } = useAuth()
  const insets = useSafeAreaInsets()
  const [cycleData, setCycleData] = useState<TodayCycleResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [quickSymptoms, setQuickSymptoms] = useState<string[]>([])
  const [viewedPhaseId, setViewedPhaseId] = useState<PhaseId | null>(null)
  const [settings, setSettings] = useState<CycleSettings | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

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

  // Raw cycle settings (start date + lengths) for client-side prediction. One fetch.
  const loadSettings = useCallback(() => {
    if (!session) return
    fetch(`${API_URL}/me/cycle`, { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: CycleSettings | null) => setSettings(d))
      .catch(() => setSettings(null))
  }, [session])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // Re-pull the effective cycle (day/phase + settings) so the whole screen recalibrates
  // after a period start is logged/undone.
  const recalibrate = useCallback(() => {
    fetchToday()
    loadSettings()
  }, [fetchToday, loadSettings])

  // Prefill "How are you feeling?" chips from today's saved entry (survives refresh).
  useEffect(() => {
    if (!session) return
    fetch(`${API_URL}/me/logs/today`, { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((log: SymptomLog | null) => {
        if (log?.symptoms) setQuickSymptoms(log.symptoms)
      })
      .catch(() => {})
  }, [session])

  const onRefresh = () => {
    setRefreshing(true)
    fetchToday()
  }

  // Tapping a chip IS the save: optimistic toggle, then persist (merge keeps other fields).
  const toggleSymptom = (s: string) => {
    if (!session) return
    const prev = quickSymptoms
    const next = prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    setQuickSymptoms(next)
    fetch(`${API_URL}/me/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ symptoms: next }),
    })
      .then((r) => {
        if (!r.ok) throw new Error('save failed')
        setToast({ msg: 'Saved ✓', type: 'success' })
        setTimeout(() => setToast(null), 1200)
      })
      .catch(() => {
        setQuickSymptoms(prev) // revert on failure
        setToast({ msg: "Couldn't save — try again", type: 'error' })
        setTimeout(() => setToast(null), 2500)
      })
  }

  const allPhases = getAllPhases()

  // The user's REAL position — drives day + progress (never faked).
  const day = cycleData?.day ?? 1
  const currentPhase = cycleData ? getPhaseById(cycleData.phase) : getPhaseForDay(1)

  // Which phase the screen previews. null = follow current phase.
  const viewedPhase = viewedPhaseId ? getPhaseById(viewedPhaseId) : currentPhase
  const previewing = viewedPhaseId !== null && viewedPhaseId !== currentPhase.id
  const t = phaseTheme[phaseKeyFor(viewedPhase.id)]

  if (loading) return <LoadingSpinner phaseColor={t.accent} />

  // ── Derive theme from the VIEWED phase's tokens (same as web) ──
  const light = isLightHex(t.phase)
  const gold = light ? palette.goldOnLight : palette.gold
  const ink = t.floodText
  const sub = t.floodSub
  const cardwash = light ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.10)'
  const cardbd = light ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.20)'
  const chipIdleBd = light ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.30)'
  const chipOnText = light ? '#F8E2A8' : t.accent
  const halo = 'rgba(201,168,76,0.40)'
  const baseColor = t.floodColors[t.floodColors.length - 1]

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  const segFill = (p: (typeof allPhases)[number]): number => {
    if (day > p.cycleDays.end) return 100
    if (day < p.cycleDays.start) return 0
    const span = p.cycleDays.end - p.cycleDays.start + 1
    return Math.round(((day - p.cycleDays.start + 1) / span) * 100)
  }

  const supps = viewedPhase.supplements.slice(8, 11)

  // Phase day-ranges scaled to the user's real cycle — the SAME source the calendar
  // uses (getPhaseRanges). Falls back to the static model before settings load.
  const dynRanges = settings ? getPhaseRanges(settings.cycleLength, settings.periodLength) : null
  const railLabel = (p: (typeof allPhases)[number]): string => {
    const r = dynRanges?.find((x) => x.phase === p.id)
    const start = r ? r.startDay : p.cycleDays.start
    const end = r ? r.endDay : p.cycleDays.end
    return start === end ? `D${start}` : `D${start}–${end}`
  }

  return (
    // CONTINUOUS FLOOD — re-washes to whichever phase is being viewed.
    <View style={{ flex: 1, backgroundColor: baseColor }}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ink} />}
      >
        <LinearGradient
          colors={t.floodColors as [string, string, ...string[]]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.flood}
        >
          <View style={[styles.safe, { paddingTop: insets.top + 6 }]}>
            {/* ── Top bar ── */}
            <View style={styles.topbar}>
              <View>
                <Text style={[styles.date, { color: sub }]}>{dateLabel}</Text>
                <Text style={[styles.todayHeading, { color: ink }]}>Today</Text>
              </View>
              {/* TODO: seal-ink on light phases once we have a transparent ink seal. */}
              <Image source={require('../../assets/brand/seal-gold.png')} style={styles.avatar} resizeMode="contain" />
            </View>

            {/* ── HERO (themed to the viewed phase) ── */}
            <View style={styles.hero}>
              <View style={styles.sealCluster}>
                <Svg width={150} height={150} style={StyleSheet.absoluteFill}>
                  <Circle cx={75} cy={75} r={72} stroke={gold} strokeOpacity={0.18} strokeWidth={1} fill="none" />
                  <Circle cx={75} cy={75} r={56} stroke={gold} strokeOpacity={0.14} strokeWidth={1} fill="none" />
                </Svg>
                <Image source={require('../../assets/brand/seal-gold.png')} style={styles.seal} resizeMode="contain" />
              </View>

              <Text style={[styles.eyebrow, { color: gold }]}>
                Phase {String(viewedPhase.containerNumber).padStart(2, '0')} / 04 · Day {day}
              </Text>
              <Text style={[styles.phaseName, { color: ink }]}>{t.label}</Text>
              <Text style={[styles.tagline, { color: sub }]}>{t.vibe}</Text>
              <Text style={[styles.line, { color: ink }]}>{viewedPhase.tagline}</Text>

              {/* progress segments — reflect the REAL current day */}
              <View style={styles.progress}>
                {allPhases.map((p) => (
                  <View key={p.id} style={[styles.seg, { backgroundColor: cardbd }]}>
                    <View style={{ height: '100%', width: `${segFill(p)}%`, backgroundColor: gold }} />
                  </View>
                ))}
              </View>
              <View style={styles.progressLabels}>
                {allPhases.map((p) => {
                  const isNow = p.id === currentPhase.id
                  return (
                    <Text
                      key={p.id}
                      style={[
                        styles.segLabel,
                        { color: isNow ? gold : sub, fontFamily: isNow ? 'Raleway_600SemiBold' : 'Raleway_400Regular' },
                      ]}
                    >
                      {SHORT[p.id]}
                    </Text>
                  )
                })}
              </View>
            </View>

            {/* ── Preview banner (only when viewing a non-current phase) ── */}
            {previewing && (
              <View style={[styles.banner, { backgroundColor: cardwash, borderColor: cardbd }]}>
                <Text style={[styles.bannerText, { color: ink }]}>
                  Previewing {t.label} · You&apos;re in {phaseTheme[phaseKeyFor(currentPhase.id)].label} today
                </Text>
                <TouchableOpacity onPress={() => setViewedPhaseId(null)}>
                  <Text style={[styles.bannerBack, { color: gold }]}>Back to today</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── Phase rail (tap to preview) ── */}
            <Text style={[styles.sectionLabel, { color: sub }]}>Your four phases · tap to explore</Text>
            <View style={styles.rail}>
              {allPhases.map((p) => {
                const active = p.id === viewedPhase.id
                const isNow = p.id === currentPhase.id
                const pt = phaseTheme[phaseKeyFor(p.id)]
                return (
                  <TouchableOpacity
                    key={p.id}
                    activeOpacity={0.8}
                    onPress={() => setViewedPhaseId(p.id)}
                    style={[styles.railCard, { borderColor: active ? gold : cardbd, backgroundColor: active ? cardwash : 'transparent' }]}
                  >
                    {active ? (
                      <View style={[styles.dotHalo, { backgroundColor: halo }]}>
                        <View style={[styles.dot, { backgroundColor: pt.phase }]} />
                      </View>
                    ) : (
                      <View style={[styles.dot, { backgroundColor: pt.phase }]} />
                    )}
                    <Text style={[styles.railName, { color: ink }]}>{pt.label}</Text>
                    <Text style={[styles.railDays, { color: sub }]}>{railLabel(p)}</Text>
                    {isNow && <Text style={[styles.railNow, { color: gold }]}>NOW</Text>}
                  </TouchableOpacity>
                )
              })}
            </View>

            {/* ── Feeling chips (viewed phase's symptoms) ── */}
            <Text style={[styles.sectionLabel, { color: sub }]}>How are you feeling?</Text>
            <View style={styles.chips}>
              {viewedPhase.symptoms.slice(0, 5).map((s) => {
                const on = quickSymptoms.includes(s)
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => toggleSymptom(s)}
                    style={[styles.chip, { backgroundColor: on ? ink : 'transparent', borderColor: on ? 'transparent' : chipIdleBd }]}
                  >
                    <Text style={[styles.chipText, { color: on ? chipOnText : ink }]}>{s}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            {/* ── Predictions: Next up (taps through to the Calendar screen) ── */}
            <Text style={[styles.sectionLabel, { color: sub }]}>Looking ahead</Text>
            <NextUpCard
              settings={settings}
              surface={{ ink, sub, gold, cardwash, cardbd }}
              onOpen={() => router.push('/calendar')}
            />
            {/* Log a real period start → recalibrates the whole screen. */}
            <View style={{ marginTop: 12 }}>
              <LogPeriodCard surface={{ ink, sub, gold, cardwash, cardbd }} onChange={recalibrate} />
            </View>

            {/* ── Supplement focus (viewed phase's actives) ── */}
            <View style={styles.suppHead}>
              <Text style={[styles.sectionLabel, { color: sub, marginBottom: 0 }]}>Today&apos;s supplement focus</Text>
              <Text style={[styles.suppCount, { color: gold }]}>{supps.length} actives</Text>
            </View>
            <View style={styles.suppList}>
              {supps.map((s) => {
                const note = s.purpose.split('—')[0].trim()
                return (
                  <View key={s.name} style={[styles.supp, { backgroundColor: cardwash, borderColor: cardbd }]}>
                    <View style={styles.suppLeft}>
                      <View style={[styles.suppCheck, { backgroundColor: gold }]}>
                        <Text style={[styles.suppCheckMark, { color: t.phase }]}>✓</Text>
                      </View>
                      <View style={styles.suppInfo}>
                        <Text style={[styles.suppName, { color: ink }]}>{s.name}</Text>
                        <Text style={[styles.suppNote, { color: sub }]} numberOfLines={1}>
                          {note}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.suppDose, { color: gold }]}>{s.dosage}</Text>
                  </View>
                )
              })}
            </View>
          </View>
        </LinearGradient>
      </ScrollView>
      {toast && <Toast message={toast.msg} type={toast.type} />}
    </View>
  )
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1 },
  flood: { flexGrow: 1, paddingBottom: 32 },
  safe: { paddingHorizontal: 22 },

  // top bar
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 6, marginBottom: 6 },
  date: { fontFamily: 'Raleway_400Regular', fontSize: 9.5, letterSpacing: 2, textTransform: 'uppercase' },
  todayHeading: { fontFamily: 'Marcellus_400Regular', fontSize: 24, marginTop: 3 },
  avatar: { width: 34, height: 34 },

  // hero
  hero: { alignItems: 'center', paddingTop: 4 },
  sealCluster: { width: 150, height: 150, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  seal: { width: 84, height: 84 },
  eyebrow: { fontFamily: 'Raleway_600SemiBold', fontSize: 9.5, letterSpacing: 3, textTransform: 'uppercase' },
  phaseName: { fontFamily: 'Marcellus_400Regular', fontSize: 52, marginTop: 12, lineHeight: 54 },
  tagline: { fontFamily: 'Raleway_400Regular', fontSize: 13, letterSpacing: 3.5, textTransform: 'uppercase', marginTop: 12 },
  line: { fontFamily: 'Raleway_300Light', fontSize: 12, opacity: 0.82, marginTop: 12, textAlign: 'center' },

  // progress
  progress: { flexDirection: 'row', gap: 6, marginTop: 20, alignSelf: 'stretch' },
  seg: { flex: 1, height: 4, borderRadius: 4, overflow: 'hidden' },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 9, alignSelf: 'stretch' },
  segLabel: { fontSize: 8, letterSpacing: 1 },

  // preview banner
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 16,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
  },
  bannerText: { fontFamily: 'Raleway_400Regular', fontSize: 11, flex: 1 },
  bannerBack: { fontFamily: 'Raleway_600SemiBold', fontSize: 11 },

  // section label
  sectionLabel: { fontFamily: 'Raleway_500Medium', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', marginTop: 22, marginBottom: 10 },

  // phase rail
  rail: { flexDirection: 'row', gap: 8 },
  railCard: { flex: 1, borderRadius: 13, borderWidth: 1, paddingVertical: 11, paddingHorizontal: 6, alignItems: 'center' },
  dotHalo: { width: 19, height: 19, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 13, height: 13, borderRadius: 999 },
  railName: { fontFamily: 'Marcellus_400Regular', fontSize: 12, marginTop: 8 },
  railDays: { fontFamily: 'Raleway_400Regular', fontSize: 8, marginTop: 1 },
  railNow: { fontFamily: 'Raleway_600SemiBold', fontSize: 7.5, letterSpacing: 1.2, marginTop: 3 },

  // chips
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontFamily: 'Raleway_500Medium', fontSize: 11 },

  // supplement focus
  suppHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 22, marginBottom: 10 },
  suppCount: { fontFamily: 'Raleway_600SemiBold', fontSize: 9, letterSpacing: 0.5 },
  suppList: { gap: 9 },
  supp: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 15, borderRadius: 14, borderWidth: 1 },
  suppLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  suppCheck: { width: 21, height: 21, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  suppCheckMark: { fontSize: 11, fontWeight: '700' },
  suppInfo: { flex: 1 },
  suppName: { fontFamily: 'Marcellus_400Regular', fontSize: 14.5 },
  suppNote: { fontFamily: 'Raleway_300Light', fontSize: 9.5, marginTop: 2 },
  suppDose: { fontFamily: 'Marcellus_400Regular', fontSize: 15, marginLeft: 10 },
})
