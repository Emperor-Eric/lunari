import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@lunari/utils'
import { getPhaseForDay } from '@lunari/phase-data'
import {
  SymptomGrid, MoodPicker, EnergySlider, SleepInput,
  WaterTracker, JournalInput, LogCard, EmptyState, Toast, LoadingSpinner,
} from '@lunari/ui'
import type { SymptomLog } from '@lunari/types'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/v1'
const phase = getPhaseForDay(15) // TODO: from cycle store

export default function Log() {
  const { session } = useAuth()
  const [tab, setTab] = useState<'today' | 'history'>('today')

  // Today state
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [mood, setMood] = useState<number | null>(null)
  const [energy, setEnergy] = useState(5)
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

  const fetchHistory = useCallback(async (pageNum = 1) => {
    if (!session) return
    setHistoryLoading(true)
    try {
      const res = await fetch(`${API_URL}/me/logs?page=${pageNum}&perPage=20`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setLogs((prev) => pageNum === 1 ? data.data : [...prev, ...data.data])
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

  return (
    <SafeAreaView style={styles.safe}>
      {/* Segmented control */}
      <View style={styles.segmented}>
        {(['today', 'history'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.segment, tab === t && styles.segmentActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.segmentText, tab === t && styles.segmentTextActive]}>
              {t === 'today' ? 'Today' : 'History'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'today' ? (
        <ScrollView contentContainerStyle={styles.form}>
          <Text style={styles.heading}>Today's check-in</Text>
          <Text style={styles.sub}>How was your day?</Text>
          <Text style={styles.fieldLabel}>Symptoms</Text>
          <SymptomGrid symptoms={phase.symptoms} selected={symptoms} onToggle={(s) => setSymptoms((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])} phaseColor={phase.color} />
          <Text style={styles.fieldLabel}>Mood</Text>
          <MoodPicker value={mood} onChange={setMood} />
          <EnergySlider value={energy} onChange={setEnergy} phaseColor={phase.color} />
          <SleepInput value={sleep} onChange={setSleep} />
          <WaterTracker value={water} onChange={setWater} />
          <JournalInput value={journal} onChange={setJournal} />
          <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
            <Text style={styles.saveBtnText}>{saving ? 'Saving…' : "Save today's check-in"}</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <>
          {historyLoading && logs.length === 0 ? (
            <LoadingSpinner phaseColor={phase.color} />
          ) : logs.length === 0 ? (
            <EmptyState title="No logs yet" subtitle="Your check-ins will appear here after you start tracking." />
          ) : (
            <FlatList
              data={logs}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.historyList}
              renderItem={({ item }) => <LogCard log={item} />}
              onEndReached={() => { if (hasMore) { const next = page + 1; setPage(next); fetchHistory(next) } }}
              onEndReachedThreshold={0.3}
            />
          )}
        </>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E8' },
  segmented: {
    flexDirection: 'row', margin: 20, marginBottom: 0,
    backgroundColor: '#E8E2D6', borderRadius: 9999, padding: 3,
  },
  segment: { flex: 1, paddingVertical: 8, borderRadius: 9999, alignItems: 'center' },
  segmentActive: { backgroundColor: '#FFFFFF' },
  segmentText: { fontFamily: 'Inter', fontSize: 14, color: '#6B6460' },
  segmentTextActive: { fontWeight: '600', color: '#2C2825' },
  form: { padding: 20, gap: 16, paddingBottom: 48 },
  heading: { fontFamily: 'PlayfairDisplay', fontSize: 24, color: '#2C2825' },
  sub: { fontFamily: 'Inter', fontSize: 14, color: '#6B6460' },
  fieldLabel: { fontFamily: 'Inter', fontSize: 14, fontWeight: '600', color: '#2C2825', marginTop: 4 },
  saveBtn: {
    backgroundColor: '#2C2825', borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontFamily: 'Inter', fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  historyList: { padding: 20, gap: 10 },
})
