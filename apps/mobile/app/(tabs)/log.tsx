import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, Pressable, FlatList, TextInput, StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Slider from '@react-native-community/slider'
import { useAuth } from '@lunari/utils'
import { getPhaseForDay } from '@lunari/phase-data'
import { phases as phaseTheme, phaseKeyFor } from '@lunari/design-tokens'
import { LogCard, EmptyState, Toast, LoadingSpinner } from '@lunari/ui'
import type { SymptomLog, TodayCycleResponse } from '@lunari/types'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/v1'

// Mood scale stays numeric (1–5) so the saved `mood` field is unchanged — only the
// labels are restyled to the Goddess reference.
const MOODS = ['Low', 'Tender', 'Calm', 'Bright', 'Wired'] // value = index + 1

// Fixed Lab neutrals — phase-independent (labBg is light on all four phases).
const N = {
  section: '#A99E88',
  value: '#2C2825',
  unit: '#B3A890',
  idleText: '#6A655D',
  minusBd: '#D9CDB8',
  minusGlyph: '#8A8275',
}

function headerStops(css: string): string[] {
  return css.match(/#[0-9a-fA-F]{6}/g) ?? []
}

export default function Log() {
  const { session } = useAuth()
  const [tab, setTab] = useState<'today' | 'history'>('today')

  const [cycleData, setCycleData] = useState<TodayCycleResponse | null>(null)

  // Today state
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [mood, setMood] = useState<number | null>(null)
  const [energy, setEnergy] = useState(5) // 1–10
  const [sleep, setSleep] = useState(7.5)
  const [water, setWater] = useState(0)
  const [journal, setJournal] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // History state
  const [logs, setLogs] = useState<SymptomLog[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const fetchToday = useCallback(async () => {
    if (!session) return
    try {
      const res = await fetch(`${API_URL}/me/cycle/today`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) setCycleData(await res.json())
    } catch {
      /* keep day=1 fallback */
    }
  }, [session])

  useEffect(() => {
    fetchToday()
  }, [fetchToday])

  const fetchHistory = useCallback(async (pageNum = 1) => {
    if (!session) return
    setHistoryLoading(true)
    try {
      const res = await fetch(`${API_URL}/me/logs?page=${pageNum}&perPage=20`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setLogs((prev) => (pageNum === 1 ? data.data : [...prev, ...data.data]))
        setHasMore(data.data.length === 20)
      }
    } finally {
      setHistoryLoading(false)
    }
  }, [session])

  useEffect(() => {
    if (tab === 'history') fetchHistory(1)
  }, [tab, fetchHistory])

  const handleSave = async () => {
    if (!session) return
    setSaving(true)
    try {
      const res = await fetch(`${API_URL}/me/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ symptoms, mood, energyLevel: energy, sleepHours: sleep, waterGlasses: water, journalNote: journal }),
      })
      if (!res.ok) throw new Error('Save failed')
      setToast({ msg: 'Logged ✓', type: 'success' })
      setTimeout(() => { setTab('history'); setToast(null) }, 1500)
    } catch {
      setToast({ msg: 'Something went wrong', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const day = cycleData?.day ?? 1
  const phase = cycleData ? getPhaseForDay(cycleData.day) : getPhaseForDay(1)
  const t = phaseTheme[phaseKeyFor(phase.id)]

  const toggleSymptom = (s: string) =>
    setSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))

  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })
  const solid12 = `${t.accent}1F`
  const stops = headerStops(t.header)
  const headerColors = (stops.length >= 2 ? stops : [t.headerLabel, t.headerLabel]) as [string, string, ...string[]]

  return (
    <View style={{ flex: 1, backgroundColor: t.labBg }}>
      {/* ── HEADER BAND (phase gradient — no orbit on Log) ── */}
      <LinearGradient colors={headerColors} start={{ x: 0.2, y: 0 }} end={{ x: 0.5, y: 1 }}>
        <SafeAreaView edges={['top']} style={styles.headerInner}>
          <Text style={[styles.title, { color: t.headerText }]}>Daily check-in</Text>
          <Text style={[styles.sub, { color: t.headerLabel }]}>
            {dateLabel} · {t.label} · Day {day}
          </Text>
          {/* segmented control kept for the existing History view */}
          <View style={[styles.segmented, { backgroundColor: solid12 }]}>
            {(['today', 'history'] as const).map((seg) => {
              const on = tab === seg
              return (
                <TouchableOpacity
                  key={seg}
                  style={[styles.segment, on && { backgroundColor: t.headerText }]}
                  onPress={() => setTab(seg)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentText, { color: on ? t.labBg : t.headerText }]}>
                    {seg === 'today' ? 'Today' : 'History'}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {tab === 'today' ? (
        <ScrollView contentContainerStyle={styles.body}>
          {/* Symptoms */}
          <Text style={[styles.fieldLabel, { color: N.section }]}>Symptoms</Text>
          <View style={styles.chips}>
            {phase.symptoms.map((s) => {
              const active = symptoms.includes(s)
              return (
                <Pressable
                  key={s}
                  onPress={() => toggleSymptom(s)}
                  style={[
                    styles.chip,
                    { backgroundColor: active ? t.accent : t.labCard, borderColor: active ? 'transparent' : t.labBorder },
                  ]}
                >
                  <Text style={[styles.chipText, { color: active ? t.headerText : N.idleText }]}>{s}</Text>
                </Pressable>
              )
            })}
          </View>

          {/* Mood */}
          <Text style={[styles.fieldLabel, styles.gap, { color: N.section }]}>Mood</Text>
          <View style={styles.moods}>
            {MOODS.map((label, i) => {
              const val = i + 1
              const active = mood === val
              return (
                <Pressable
                  key={label}
                  onPress={() => setMood(val)}
                  style={[
                    styles.mood,
                    { backgroundColor: active ? solid12 : t.labCard, borderColor: active ? t.accent : t.labBorder },
                  ]}
                >
                  <Text style={[styles.moodText, { color: active ? t.accent : N.idleText }]}>{label}</Text>
                </Pressable>
              )
            })}
          </View>

          {/* Energy */}
          <Text style={[styles.fieldLabel, styles.gap, { color: N.section }]}>Energy</Text>
          <Slider
            style={{ width: '100%', height: 28 }}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={energy}
            onValueChange={setEnergy}
            minimumTrackTintColor={t.accent}
            maximumTrackTintColor={t.labTrack}
            thumbTintColor={t.accent}
          />
          <View style={styles.sliderEnds}>
            <Text style={[styles.endText, { color: N.section }]}>Drained</Text>
            <Text style={[styles.endText, { color: N.section }]}>Energised</Text>
          </View>

          {/* Sleep + Water readouts */}
          <View style={styles.readouts}>
            <View style={[styles.readout, { backgroundColor: t.labCard, borderColor: t.labBorder }]}>
              <View style={styles.readoutHead}>
                <Text style={[styles.readoutLabel, { color: N.section }]}>Sleep</Text>
                <Stepper
                  onMinus={() => setSleep((v) => Math.max(0, Math.round((v - 0.5) * 2) / 2))}
                  onPlus={() => setSleep((v) => Math.min(12, Math.round((v + 0.5) * 2) / 2))}
                  accent={t.accent}
                  onHdr={t.headerText}
                />
              </View>
              <Text style={[styles.readoutValue, { color: N.value }]}>
                {sleep}
                <Text style={[styles.readoutUnit, { color: N.unit }]}>h</Text>
              </Text>
            </View>

            <View style={[styles.readout, { backgroundColor: t.labCard, borderColor: t.labBorder }]}>
              <View style={styles.readoutHead}>
                <Text style={[styles.readoutLabel, { color: N.section }]}>Water</Text>
                <Stepper
                  onMinus={() => setWater((v) => Math.max(0, v - 1))}
                  onPlus={() => setWater((v) => Math.min(8, v + 1))}
                  accent={t.accent}
                  onHdr={t.headerText}
                />
              </View>
              <Text style={[styles.readoutValue, { color: N.value }]}>
                {water}
                <Text style={[styles.readoutUnit, { color: N.unit }]}> / 8 glasses</Text>
              </Text>
            </View>
          </View>

          {/* Notes (journal) — preserved from existing screen; beyond the reference */}
          <Text style={[styles.fieldLabel, styles.gap, { color: N.section }]}>Notes</Text>
          <TextInput
            value={journal}
            onChangeText={setJournal}
            placeholder="Anything you want to remember about today…"
            placeholderTextColor={N.unit}
            multiline
            style={[styles.notes, { backgroundColor: t.labCard, borderColor: t.labBorder, color: N.value }]}
          />

          {/* Save */}
          <TouchableOpacity
            style={[styles.save, { backgroundColor: t.accent, opacity: saving ? 0.6 : 1 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Text style={[styles.saveText, { color: t.headerText }]}>{saving ? 'Saving…' : 'Save check-in'}</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : historyLoading && logs.length === 0 ? (
        <LoadingSpinner phaseColor={t.accent} />
      ) : logs.length === 0 ? (
        <EmptyState title="No logs yet" subtitle="Your check-ins will appear here after you start tracking." />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.historyList}
          renderItem={({ item }) => <LogCard log={item} />}
          onEndReached={() => {
            if (hasMore) {
              const next = page + 1
              setPage(next)
              fetchHistory(next)
            }
          }}
          onEndReachedThreshold={0.3}
        />
      )}

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </View>
  )
}

function Stepper({
  onMinus,
  onPlus,
  accent,
  onHdr,
}: {
  onMinus: () => void
  onPlus: () => void
  accent: string
  onHdr: string
}) {
  return (
    <View style={styles.stepper}>
      <Pressable onPress={onMinus} style={[styles.stepBtn, { borderWidth: 1, borderColor: N.minusBd }]}>
        <Text style={[styles.stepGlyph, { color: N.minusGlyph }]}>−</Text>
      </Pressable>
      <Pressable onPress={onPlus} style={[styles.stepBtn, { backgroundColor: accent }]}>
        <Text style={[styles.stepGlyph, { color: onHdr }]}>+</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  // header band
  headerInner: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 18 },
  title: { fontFamily: 'Marcellus_400Regular', fontSize: 27, marginTop: 8 },
  sub: { fontFamily: 'Raleway_300Light', fontSize: 10.5, marginTop: 4 },

  // segmented control
  segmented: { flexDirection: 'row', marginTop: 14, borderRadius: 9999, padding: 3 },
  segment: { flex: 1, paddingVertical: 7, borderRadius: 9999, alignItems: 'center' },
  segmentText: { fontFamily: 'Raleway_600SemiBold', fontSize: 11.5 },

  // body
  body: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 40 },
  fieldLabel: { fontFamily: 'Raleway_500Medium', fontSize: 9, letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 10 },
  gap: { marginTop: 20 },

  // chips
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1 },
  chipText: { fontFamily: 'Raleway_500Medium', fontSize: 10.5 },

  // moods
  moods: { flexDirection: 'row', gap: 8 },
  mood: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  moodText: { fontFamily: 'Raleway_500Medium', fontSize: 10 },

  // slider ends
  sliderEnds: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  endText: { fontFamily: 'Raleway_400Regular', fontSize: 9 },

  // readouts
  readouts: { flexDirection: 'row', gap: 11, marginTop: 20 },
  readout: { flex: 1, borderRadius: 13, borderWidth: 1, padding: 13 },
  readoutHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  readoutLabel: { fontFamily: 'Raleway_500Medium', fontSize: 8.5, letterSpacing: 0.8, textTransform: 'uppercase' },
  readoutValue: { fontFamily: 'Marcellus_400Regular', fontSize: 21, marginTop: 3 },
  readoutUnit: { fontFamily: 'Raleway_400Regular', fontSize: 10 },

  // stepper
  stepper: { flexDirection: 'row', gap: 6 },
  stepBtn: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  stepGlyph: { fontSize: 12, lineHeight: 14, fontWeight: '500' },

  // notes
  notes: {
    minHeight: 72,
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'Raleway_400Regular',
    fontSize: 12,
    textAlignVertical: 'top',
  },

  // save
  save: { marginTop: 22, borderRadius: 13, paddingVertical: 15, alignItems: 'center' },
  saveText: { fontFamily: 'Raleway_600SemiBold', fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' },

  // history
  historyList: { padding: 20, gap: 10 },
})
