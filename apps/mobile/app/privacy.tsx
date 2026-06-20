import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Circle } from 'react-native-svg'
import { router } from 'expo-router'
import { File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import * as Clipboard from 'expo-clipboard'
import { useAuth } from '@lunari/utils'
import { getPhaseForDay, getPhaseById } from '@lunari/phase-data'
import { phases as phaseTheme, phaseKeyFor } from '@lunari/design-tokens'
import { Toast } from '@lunari/ui'
import type { TodayCycleResponse } from '@lunari/types'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/v1'

// Swap this for the real policy URL when it exists. Empty string → "coming soon".
const PRIVACY_POLICY_URL = ''

const N = { section: '#A99E88', text: '#2C2825', sub: '#8A8275' }
const MAROON = '#7A1E2E'

function headerStops(css: string): string[] {
  return css.match(/#[0-9a-fA-F]{6}/g) ?? []
}

export default function PrivacyScreen() {
  const { signOut, session } = useAuth()
  const [cycleData, setCycleData] = useState<TodayCycleResponse | null>(null)
  const [exporting, setExporting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

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

  const flash = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), type === 'error' ? 2800 : 2000)
  }

  const exportData = async () => {
    if (!session) return
    setExporting(true)
    try {
      const res = await fetch(`${API_URL}/me/export`, { headers: authHeaders() })
      if (!res.ok) throw new Error('export failed')
      const data = await res.json()
      const json = JSON.stringify(data, null, 2)

      const file = new File(Paths.cache, 'lunari-data.json')
      try {
        file.create({ overwrite: true })
      } catch {
        /* already exists — write() overwrites contents */
      }
      file.write(json)

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Export your lunari data',
          UTI: 'public.json',
        })
      } else {
        await Clipboard.setStringAsync(json)
        flash('Copied your data to the clipboard', 'success')
      }
    } catch {
      flash("Couldn't export — try again", 'error')
    } finally {
      setExporting(false)
    }
  }

  const deleteAccount = async () => {
    if (!session) return
    setDeleting(true)
    try {
      const r = await fetch(`${API_URL}/me`, { method: 'DELETE', headers: authHeaders() })
      if (!r.ok) throw new Error('delete failed')
      await signOut()
      router.replace('/(auth)/welcome')
    } catch {
      flash("Couldn't delete — try again", 'error')
      setDeleting(false)
    }
  }

  const phase = cycleData ? getPhaseById(cycleData.phase) : getPhaseForDay(1)
  const t = phaseTheme[phaseKeyFor(phase.id)]
  const stops = headerStops(t.header)
  const headerColors = (stops.length >= 2 ? stops : [t.headerLabel, t.headerLabel]) as [
    string,
    string,
    ...string[],
  ]

  const cardStyle = [styles.card, { backgroundColor: t.labCard, borderColor: t.labBorder }]

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
          <Text style={[styles.title, { color: t.headerText }]}>Privacy &amp; data</Text>
          <Text style={[styles.subtitle, { color: t.headerText }]}>
            what we keep, and your control over it
          </Text>
        </SafeAreaView>
      </LinearGradient>

      {/* ── TINTED BODY ── */}
      <ScrollView contentContainerStyle={styles.body}>
        {/* a) Plain-language data summary */}
        <Text style={[styles.sectionLabel, { color: N.section }]}>Your data</Text>
        <View style={cardStyle}>
          <Text style={[styles.bodyText, { color: N.text }]}>
            Lunari stores your account email and the cycle and check-in data you log — your period
            dates, symptoms, mood, energy, sleep and notes. We keep it to power your tracker and
            predictions. We don&apos;t sell your data.
          </Text>
          <Text style={[styles.subText, { color: N.sub }]}>
            Your data lives in our database, hosted on Supabase. You can download a copy or delete
            your account and data at any time below.
          </Text>
        </View>

        {/* b) Privacy policy */}
        <Text style={[styles.sectionLabel, { color: N.section }]}>Privacy policy</Text>
        <View style={cardStyle}>
          {PRIVACY_POLICY_URL ? (
            <TouchableOpacity
              style={styles.rowBetween}
              onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
            >
              <Text style={[styles.rowTitle, { color: N.text }]}>Read our privacy policy</Text>
              <Text style={[styles.openLink, { color: t.accent }]}>Open ↗</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.rowBetween}>
              <Text style={[styles.rowTitle, { color: N.text }]}>Privacy policy</Text>
              <View style={[styles.pill, { borderColor: t.labBorder }]}>
                <Text style={[styles.pillText, { color: N.section }]}>Coming soon</Text>
              </View>
            </View>
          )}
        </View>

        {/* c) Export */}
        <Text style={[styles.sectionLabel, { color: N.section }]}>Export</Text>
        <View style={cardStyle}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.rowTitle, { color: N.text }]}>Export my data</Text>
              <Text style={[styles.subText, { color: N.sub, marginTop: 2 }]}>
                Download everything we store as a JSON file
              </Text>
            </View>
            <TouchableOpacity
              onPress={exportData}
              disabled={exporting}
              style={[
                styles.primaryBtn,
                { backgroundColor: t.accent, opacity: exporting ? 0.6 : 1 },
              ]}
              activeOpacity={0.85}
            >
              <Text style={[styles.primaryBtnText, { color: t.headerText }]}>
                {exporting ? 'Preparing…' : 'Download'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* d) Delete — destructive, confirm-gated */}
        <Text style={[styles.sectionLabel, { color: N.section }]}>Danger zone</Text>
        <View style={cardStyle}>
          {!confirmDelete ? (
            <Pressable onPress={() => setConfirmDelete(true)}>
              <Text style={styles.dataAction}>Delete my account &amp; data</Text>
            </Pressable>
          ) : (
            <>
              <Text style={[styles.dataWarn, { color: N.text }]}>
                This permanently deletes your account and all your data — cycle, periods, logs and
                settings. This can&apos;t be undone. Continue?
              </Text>
              <View style={styles.dataActions}>
                <Pressable
                  onPress={deleteAccount}
                  disabled={deleting}
                  style={[styles.destructiveBtn, { opacity: deleting ? 0.6 : 1 }]}
                >
                  <Text style={styles.destructiveText}>
                    {deleting ? 'Deleting…' : 'Delete everything'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setConfirmDelete(false)}
                  disabled={deleting}
                  style={[styles.cancelBtn, { borderColor: t.labBorder }]}
                >
                  <Text style={[styles.cancelText, { color: N.text }]}>Cancel</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {toast && <Toast message={toast.msg} type={toast.type} />}
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
  body: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 40 },

  sectionLabel: {
    fontFamily: 'Raleway_500Medium',
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginTop: 22,
    marginBottom: 11,
  },
  card: { borderRadius: 13, borderWidth: 1, padding: 16 },
  bodyText: { fontFamily: 'Raleway_300Light', fontSize: 13, lineHeight: 20 },
  subText: { fontFamily: 'Raleway_300Light', fontSize: 12, lineHeight: 19, marginTop: 10 },

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowTitle: { fontFamily: 'Marcellus_400Regular', fontSize: 15.5 },
  openLink: { fontFamily: 'Raleway_600SemiBold', fontSize: 13 },
  pill: { borderWidth: 1, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 9 },
  pillText: {
    fontFamily: 'Raleway_500Medium',
    fontSize: 8.5,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  primaryBtn: { borderRadius: 11, paddingVertical: 9, paddingHorizontal: 16 },
  primaryBtnText: { fontFamily: 'Raleway_600SemiBold', fontSize: 12 },

  dataAction: { fontFamily: 'Marcellus_400Regular', fontSize: 15.5, color: MAROON },
  dataWarn: { fontFamily: 'Raleway_300Light', fontSize: 12, lineHeight: 18 },
  dataActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  destructiveBtn: {
    backgroundColor: MAROON,
    borderRadius: 11,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  destructiveText: { fontFamily: 'Raleway_600SemiBold', fontSize: 12, color: '#FBF6EC' },
  cancelBtn: { borderWidth: 1, borderRadius: 11, paddingVertical: 9, paddingHorizontal: 14 },
  cancelText: { fontFamily: 'Raleway_500Medium', fontSize: 12 },
})
