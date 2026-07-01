import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  FlatList,
  TextInput,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import Slider from '@react-native-community/slider'
import { useAuth } from '@lunari/utils'
import { getPhaseForDay, getPhaseById, FLOW_OPTIONS, flowIntensity } from '@lunari/phase-data'
import { phases as phaseTheme, phaseKeyFor } from '@lunari/design-tokens'
import { LogCard, EmptyState, Toast, LoadingSpinner } from '@lunari/ui'
import type { SymptomLog, TodayCycleResponse, FlowValue } from '@lunari/types'
import { InsightsView } from '../../src/components/InsightsView'
import { useCustomSymptoms } from '../../src/hooks/useCustomSymptoms'
import { CustomSymptomChips } from '../../src/components/CustomSymptomChips'
import { CustomSymptomManager } from '../../src/components/CustomSymptomManager'

type LogTab = 'today' | 'history' | 'insights'
const SEG_LABEL: Record<LogTab, string> = {
  today: 'Today',
  history: 'History',
  insights: 'Insights',
}

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
  const {
    items: customItems,
    active: customActive,
    refresh: refreshCustom,
    add,
    update,
    remove,
  } = useCustomSymptoms()
  const [manageOpen, setManageOpen] = useState(false)
  const [tab, setTab] = useState<LogTab>('today')

  // Tabs stay mounted, so re-pull custom symptoms on focus — otherwise ones added on
  // another tab (or the Today surface) wouldn't appear here until an app restart.
  useFocusEffect(
    useCallback(() => {
      refreshCustom()
    }, [refreshCustom])
  )

  const [cycleData, setCycleData] = useState<TodayCycleResponse | null>(null)

  // Today state
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [flow, setFlow] = useState<FlowValue | null>(null)
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
  const [historyError, setHistoryError] = useState(false)
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

  // Prefill the form from today's saved entry — edit it instead of starting blank.
  useEffect(() => {
    if (!session) return
    fetch(`${API_URL}/me/logs/today`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((log: SymptomLog | null) => {
        if (!log) return
        setSymptoms(log.symptoms ?? [])
        if (log.flow != null) setFlow(log.flow)
        if (log.mood != null) setMood(log.mood)
        if (log.energyLevel != null) setEnergy(log.energyLevel)
        if (log.sleepHours != null) setSleep(Number(log.sleepHours))
        if (log.waterGlasses != null) setWater(log.waterGlasses)
        if (log.journalNote) setJournal(log.journalNote)
      })
      .catch(() => {})
  }, [session])

  const fetchHistory = useCallback(
    async (pageNum = 1) => {
      if (!session) return
      setHistoryLoading(true)
      if (pageNum === 1) setHistoryError(false)
      // Time out a hanging request so it surfaces as an error instead of an
      // endless spinner.
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)
      try {
        const res = await fetch(`${API_URL}/me/logs?page=${pageNum}&perPage=20`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`Request failed (${res.status})`)
        const data = await res.json()
        const rows: SymptomLog[] = Array.isArray(data?.data) ? data.data : []
        setLogs((prev) => (pageNum === 1 ? rows : [...prev, ...rows]))
        setHasMore(rows.length === 20)
      } catch {
        // Any failure (non-OK, network, timeout, bad shape) → recoverable error,
        // never an infinite spinner.
        if (pageNum === 1) setHistoryError(true)
        setHasMore(false)
      } finally {
        clearTimeout(timeout)
        setHistoryLoading(false)
      }
    },
    [session]
  )

  const loadHistory = useCallback(() => {
    setPage(1)
    fetchHistory(1)
  }, [fetchHistory])

  useEffect(() => {
    if (tab === 'history') loadHistory()
  }, [tab, loadHistory])

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
        body: JSON.stringify({
          symptoms,
          ...(flow != null && { flow }),
          mood,
          energyLevel: energy,
          sleepHours: sleep,
          waterGlasses: water,
          journalNote: journal,
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      setToast({ msg: 'Logged ✓', type: 'success' })
      setTimeout(() => {
        setTab('history')
        setToast(null)
      }, 1500)
    } catch {
      setToast({ msg: 'Something went wrong', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const day = cycleData?.day ?? 1
  const phase = cycleData ? getPhaseById(cycleData.phase) : getPhaseForDay(1)
  const t = phaseTheme[phaseKeyFor(phase.id)]

  const toggleSymptom = (s: string) =>
    setSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
  })
  const solid12 = `${t.accent}1F`
  const stops = headerStops(t.header)
  const headerColors = (stops.length >= 2 ? stops : [t.headerLabel, t.headerLabel]) as [
    string,
    string,
    ...string[],
  ]

  // Flow — emphasized at the top during the menstrual phase, otherwise just below
  // symptoms. Each chip's dot scales with intensity (none → faint, heavy → solid).
  const menstrual = phase.id === 'menstrual'
  const flowSection = (
    <View style={styles.flowWrap}>
      <Text style={[styles.fieldLabel, { color: N.section }]}>
        Flow{menstrual ? ' · today' : ''}
      </Text>
      <View style={styles.flowRow}>
        {FLOW_OPTIONS.map((o) => {
          const active = flow === o.value
          const intensity = flowIntensity(o.value)
          const dot = 5 + intensity * 2
          return (
            <Pressable
              key={o.value}
              onPress={() => setFlow(o.value)}
              style={[
                styles.flowChip,
                {
                  backgroundColor: active ? solid12 : t.labCard,
                  borderColor: active ? t.accent : t.labBorder,
                },
              ]}
            >
              <View
                style={{
                  width: dot,
                  height: dot,
                  borderRadius: 999,
                  backgroundColor: t.accent,
                  opacity: 0.25 + intensity * 0.185,
                }}
              />
              <Text style={[styles.flowChipText, { color: active ? t.accent : N.idleText }]}>
                {o.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )

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
            {(['today', 'history', 'insights'] as const).map((seg) => {
              const on = tab === seg
              return (
                <TouchableOpacity
                  key={seg}
                  style={[styles.segment, on && { backgroundColor: t.labBg }]}
                  onPress={() => setTab(seg)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentText, { color: on ? t.accent : t.headerText }]}>
                    {SEG_LABEL[seg]}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {tab === 'today' ? (
        <ScrollView contentContainerStyle={styles.body}>
          {/* Flow — emphasized at the top during the menstrual phase */}
          {menstrual && flowSection}

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
                    {
                      backgroundColor: active ? t.accent : t.labCard,
                      borderColor: active ? 'transparent' : t.labBorder,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: active ? t.headerText : N.idleText }]}>
                    {s}
                  </Text>
                </Pressable>
              )
            })}
            <CustomSymptomChips
              custom={customActive}
              builtins={phase.symptoms}
              selected={symptoms}
              onToggle={toggleSymptom}
              onAdd={add}
              chipStyle={styles.chip}
              textStyle={styles.chipText}
              colors={{
                activeBg: t.accent,
                activeText: t.headerText,
                idleBg: t.labCard,
                idleText: N.idleText,
                idleBorder: t.labBorder,
                dot: t.accent,
                accent: t.accent,
                inputText: N.value,
              }}
            />
          </View>

          {/* Flow — non-emphasized position (outside the menstrual phase) */}
          {!menstrual && <View style={styles.gap}>{flowSection}</View>}

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
                    {
                      backgroundColor: active ? solid12 : t.labCard,
                      borderColor: active ? t.accent : t.labBorder,
                    },
                  ]}
                >
                  <Text style={[styles.moodText, { color: active ? t.accent : N.idleText }]}>
                    {label}
                  </Text>
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
            <View
              style={[styles.readout, { backgroundColor: t.labCard, borderColor: t.labBorder }]}
            >
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

            <View
              style={[styles.readout, { backgroundColor: t.labCard, borderColor: t.labBorder }]}
            >
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
            style={[
              styles.notes,
              { backgroundColor: t.labCard, borderColor: t.labBorder, color: N.value },
            ]}
          />

          {/* Manage custom symptoms (collapsible) */}
          <TouchableOpacity onPress={() => setManageOpen((o) => !o)}>
            <Text style={[styles.fieldLabel, styles.gap, { color: N.section }]}>
              Custom symptoms {manageOpen ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>
          {manageOpen && (
            <CustomSymptomManager
              items={customItems}
              onUpdate={update}
              onRemove={remove}
              colors={{
                ink: N.value,
                sub: N.section,
                card: t.labCard,
                border: t.labBorder,
                accent: t.accent,
                maroon: '#7A1E2E',
              }}
            />
          )}

          {/* Save */}
          <TouchableOpacity
            style={[styles.save, { backgroundColor: t.accent, opacity: saving ? 0.6 : 1 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Text style={[styles.saveText, { color: t.headerText }]}>
              {saving ? 'Saving…' : 'Save check-in'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : tab === 'insights' ? (
        <InsightsView t={t} />
      ) : historyLoading && logs.length === 0 ? (
        <LoadingSpinner phaseColor={t.accent} />
      ) : historyError && logs.length === 0 ? (
        <View style={styles.historyState}>
          <EmptyState
            title="Couldn't load history"
            subtitle="Something went wrong fetching your check-ins. Please try again."
          />
          <TouchableOpacity
            style={[styles.retryBtn, { borderColor: t.accent }]}
            onPress={loadHistory}
            activeOpacity={0.85}
          >
            <Text style={[styles.retryText, { color: t.accent }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : logs.length === 0 ? (
        <EmptyState
          title="No logs yet"
          subtitle="Your check-ins will appear here after you start tracking."
        />
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
      <Pressable
        onPress={onMinus}
        style={[styles.stepBtn, { borderWidth: 1, borderColor: N.minusBd }]}
      >
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
  fieldLabel: {
    fontFamily: 'Raleway_500Medium',
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  gap: { marginTop: 20 },

  // chips
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1 },
  chipText: { fontFamily: 'Raleway_500Medium', fontSize: 10.5 },

  // flow
  flowWrap: { marginBottom: 0 },
  flowRow: { flexDirection: 'row', gap: 6 },
  flowChip: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  flowChipText: { fontFamily: 'Raleway_500Medium', fontSize: 9.5 },

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
  readoutLabel: {
    fontFamily: 'Raleway_500Medium',
    fontSize: 8.5,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  readoutValue: { fontFamily: 'Marcellus_400Regular', fontSize: 21, marginTop: 3 },
  readoutUnit: { fontFamily: 'Raleway_400Regular', fontSize: 10 },

  // stepper
  stepper: { flexDirection: 'row', gap: 6 },
  stepBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  saveText: {
    fontFamily: 'Raleway_600SemiBold',
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  // history
  historyList: { padding: 20, gap: 10 },
  historyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  retryBtn: {
    marginTop: 4,
    borderWidth: 1.5,
    borderRadius: 9999,
    paddingVertical: 10,
    paddingHorizontal: 26,
  },
  retryText: { fontFamily: 'Raleway_600SemiBold', fontSize: 13 },
})
