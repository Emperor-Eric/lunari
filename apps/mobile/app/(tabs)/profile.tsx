import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, Pressable, Switch, Alert, Image, StyleSheet, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Circle } from 'react-native-svg'
import { router } from 'expo-router'
import { useAuth, useUser } from '@lunari/utils'
import { getPhaseForDay, getAllPhases } from '@lunari/phase-data'
import { phases as phaseTheme, phaseKeyFor } from '@lunari/design-tokens'
import type { UserReferralCode, TodayCycleResponse } from '@lunari/types'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/v1'
// Referral entry turns on with the shop — a code only matters once there's a product.
const SHOP_ENABLED = process.env.EXPO_PUBLIC_SHOP_ENABLED === 'true'

// Kit tubes (real PNGs in assets/brand). Heights + order per the reference.
const TUBES: { key: string; src: number; h: number }[] = [
  { key: 'menstrual', src: require('../../assets/brand/tube-menstrual.png'), h: 64 },
  { key: 'follicular', src: require('../../assets/brand/tube-follicular.png'), h: 88 },
  { key: 'ovulation', src: require('../../assets/brand/tube-ovulation.png'), h: 66 },
  { key: 'luteal', src: require('../../assets/brand/tube-luteal.png'), h: 90 },
]

// Settings rows beyond Notifications — no destination screens yet (flagged: not wired).
const EXTRA_SETTINGS = ['Phase predictions', 'Connected apps', 'Privacy & data']

// Fixed Lab neutrals — phase-independent (labBg is light on all four phases).
const N = { section: '#A99E88', text: '#2C2825', chev: '#CDC2AD' }

function headerStops(css: string): string[] {
  return css.match(/#[0-9a-fA-F]{6}/g) ?? []
}

export default function Profile() {
  const { signOut, session } = useAuth()
  const { user, updateUser } = useUser()

  const [cycleData, setCycleData] = useState<TodayCycleResponse | null>(null)

  // Referral code state
  const [savedCode, setSavedCode] = useState<string | null>(null)
  const [codeInput, setCodeInput] = useState('')
  const [applying, setApplying] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const authHeaders = useCallback(
    () => ({ Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' }),
    [session]
  )

  useEffect(() => {
    if (!session) return
    fetch(`${API_URL}/me/cycle/today`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: TodayCycleResponse | null) => data && setCycleData(data))
      .catch(() => {})
  }, [session, authHeaders])

  useEffect(() => {
    if (!SHOP_ENABLED || !session) return
    fetch(`${API_URL}/me/referral-code`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: UserReferralCode | null) => setSavedCode(data?.code ?? null))
      .catch(() => {})
  }, [session, authHeaders])

  const applyCode = async () => {
    const code = codeInput.trim()
    if (!code) return
    setApplying(true)
    setFeedback(null)
    try {
      const res = await fetch(`${API_URL}/me/referral-code`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ code }),
      })
      if (!res.ok) {
        setFeedback({ type: 'error', msg: "That code wasn't found." })
        return
      }
      const data = await res.json()
      setSavedCode(data.code)
      setCodeInput('')
      setFeedback({ type: 'success', msg: `Code ${data.code} added to your account` })
    } catch {
      setFeedback({ type: 'error', msg: "That code wasn't found." })
    } finally {
      setApplying(false)
    }
  }

  const removeCode = async () => {
    if (!session) return
    try {
      await fetch(`${API_URL}/me/referral-code`, { method: 'DELETE', headers: authHeaders() })
      setSavedCode(null)
      setFeedback(null)
    } catch {
      /* ignore */
    }
  }

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await signOut()
          router.replace('/(auth)/welcome')
        },
      },
    ])
  }

  const toggleReminder = (v: boolean) => {
    updateUser({
      notificationPrefs: {
        dailyReminder: v,
        reminderTime: user?.notificationPrefs.reminderTime ?? '08:00',
      },
    })
  }

  // Theme follows the current phase.
  const day = cycleData?.day ?? 1
  const phase = cycleData ? getPhaseForDay(cycleData.day) : getPhaseForDay(1)
  const t = phaseTheme[phaseKeyFor(phase.id)]
  const activeKey = phaseKeyFor(phase.id)

  // Cycle stats from real phase-data (fixed 28-day model).
  const allPhases = getAllPhases()
  const cycleDays = Math.max(...allPhases.map((p) => p.cycleDays.end))
  const menstrual = allPhases.find((p) => p.id === 'menstrual')
  const periodDays = menstrual ? menstrual.cycleDays.end - menstrual.cycleDays.start + 1 : 5

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '··'
  const memberSince = user?.createdAt ? new Date(user.createdAt).getFullYear() : null

  const solid12 = `${t.accent}1F`
  const stops = headerStops(t.header)
  const headerColors = (stops.length >= 2 ? stops : [t.headerLabel, t.headerLabel]) as [string, string, ...string[]]

  return (
    <View style={{ flex: 1, backgroundColor: t.labBg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* ── HEADER BAND (avatar + name, orbit bottom-right) ── */}
        <LinearGradient colors={headerColors} start={{ x: 0.2, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.header}>
          <Svg width={130} height={130} style={styles.orbit}>
            <Circle cx={65} cy={65} r={64} stroke={t.headerLabel} strokeOpacity={0.25} strokeWidth={1} fill="none" />
          </Svg>
          <SafeAreaView edges={['top']} style={styles.headerInner}>
            <View style={styles.user}>
              <View style={[styles.avatar, { borderColor: t.headerLabel }]}>
                <Text style={[styles.avatarText, { color: t.headerLabel }]}>{initials}</Text>
              </View>
              <View>
                <Text style={[styles.name, { color: t.headerText }]}>{user?.name ?? 'Loading…'}</Text>
                <Text style={[styles.handle, { color: t.headerLabel }]}>
                  {memberSince ? `member since ${memberSince}` : user?.email ?? ''}
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* ── TINTED BODY ── */}
        <View style={styles.body}>
          {/* Cycle stats */}
          <Text style={[styles.sectionLabel, { color: N.section }]}>Cycle</Text>
          <View style={styles.stats}>
            <StatCard value={cycleDays} caption="cycle days" t={t} />
            <StatCard value={periodDays} caption="period days" t={t} />
            <StatCard value={day} caption="today" today t={t} />
          </View>

          {/* Your kit */}
          <Text style={[styles.sectionLabel, styles.gap, { color: N.section }]}>Your kit</Text>
          <View style={[styles.kit, { backgroundColor: t.labWhy, borderColor: t.labBorder }]}>
            {TUBES.map((tube) => {
              const active = tube.key === activeKey
              return (
                <Image
                  key={tube.key}
                  source={tube.src}
                  resizeMode="contain"
                  style={{
                    height: tube.h,
                    width: 34,
                    opacity: active ? 1 : 0.7,
                    transform: [{ translateY: active ? -6 : 0 }],
                  }}
                />
              )
            })}
          </View>

          {/* Settings */}
          <Text style={[styles.sectionLabel, styles.gap, { color: N.section }]}>Settings</Text>
          <View>
            {/* Notifications row — real wired toggle (persists via PATCH /me) */}
            <View style={[styles.settingsRow, { borderBottomColor: t.labBorder }]}>
              <Text style={[styles.settingsText, { color: N.text }]}>Notifications</Text>
              <Switch
                value={user?.notificationPrefs.dailyReminder ?? true}
                onValueChange={toggleReminder}
                trackColor={{ true: t.accent, false: '#E5DDCD' }}
                thumbColor="#FFFFFF"
              />
            </View>
            {/* Static rows — no destination screens yet */}
            {EXTRA_SETTINGS.map((label, i) => (
              <Pressable
                key={label}
                style={[styles.settingsRow, { borderBottomColor: t.labBorder, borderBottomWidth: i === EXTRA_SETTINGS.length - 1 ? 0 : 1 }]}
              >
                <Text style={[styles.settingsText, { color: N.text }]}>{label}</Text>
                <Text style={[styles.chev, { color: N.chev }]}>›</Text>
              </Pressable>
            ))}
          </View>

          {/* Referral code — gated behind SHOP_ENABLED (off pre-launch) */}
          {SHOP_ENABLED && (
            <>
              <Text style={[styles.sectionLabel, styles.gap, { color: N.section }]}>Referral code</Text>
              <View style={[styles.card, { backgroundColor: t.labCard, borderColor: t.labBorder }]}>
                {savedCode ? (
                  <View style={styles.row}>
                    <Text style={[styles.savedCodeText, { color: N.text }]}>Your code: {savedCode}</Text>
                    <TouchableOpacity onPress={removeCode}>
                      <Text style={[styles.removeLink, { color: t.accent }]}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.codeInputRow}>
                    <TextInput
                      style={[styles.codeInput, { backgroundColor: t.labBg, borderColor: t.labBorder, color: N.text }]}
                      placeholder="e.g. GYMGIRL20"
                      placeholderTextColor={N.section}
                      value={codeInput}
                      onChangeText={setCodeInput}
                      autoCapitalize="characters"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      style={[styles.applyBtn, { backgroundColor: t.accent, opacity: applying ? 0.6 : 1 }]}
                      onPress={applyCode}
                      disabled={applying}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.applyBtnText, { color: t.headerText }]}>{applying ? '…' : 'Apply'}</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {feedback && (
                  <View style={[styles.feedbackCard, { backgroundColor: feedback.type === 'success' ? t.labWhy : '#F5E8EA' }]}>
                    <Text style={[styles.feedbackText, { color: feedback.type === 'success' ? t.accent : '#7A1E2E' }]}>
                      {feedback.msg}
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}

          {/* Sign out */}
          <TouchableOpacity onPress={handleSignOut} activeOpacity={0.7}>
            <Text style={[styles.signOut, { color: t.accent }]}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

function StatCard({
  value,
  caption,
  today,
  t,
}: {
  value: number
  caption: string
  today?: boolean
  t: (typeof phaseTheme)[keyof typeof phaseTheme]
}) {
  return (
    <View
      style={[
        styles.stat,
        { backgroundColor: today ? t.accent : t.labCard, borderColor: today ? 'transparent' : t.labBorder },
      ]}
    >
      <Text style={[styles.statValue, { color: today ? t.headerText : '#2C2825' }]}>{value}</Text>
      <Text style={[styles.statCaption, { color: today ? t.headerText : '#A99E88', opacity: today ? 0.8 : 1 }]}>
        {caption}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  // header band
  header: { overflow: 'hidden' },
  orbit: { position: 'absolute', right: -30, bottom: -44 },
  headerInner: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 22 },
  user: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 10 },
  avatar: { width: 54, height: 54, borderRadius: 27, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'Marcellus_400Regular', fontSize: 22 },
  name: { fontFamily: 'Marcellus_400Regular', fontSize: 21 },
  handle: { fontFamily: 'Raleway_300Light', fontSize: 10.5, marginTop: 1 },

  // tinted body
  body: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 16 },
  sectionLabel: { fontFamily: 'Raleway_500Medium', fontSize: 9, letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 11 },
  gap: { marginTop: 20 },

  // cycle stats
  stats: { flexDirection: 'row', gap: 9 },
  stat: { flex: 1, borderRadius: 13, borderWidth: 1, paddingVertical: 14, alignItems: 'center' },
  statValue: { fontFamily: 'Marcellus_400Regular', fontSize: 23 },
  statCaption: { fontFamily: 'Raleway_400Regular', fontSize: 8.5, marginTop: 2 },

  // kit shelf
  kit: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', gap: 6, borderRadius: 15, borderWidth: 1, paddingHorizontal: 12, paddingTop: 14, paddingBottom: 12, height: 118 },

  // settings
  settingsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  settingsText: { fontFamily: 'Marcellus_400Regular', fontSize: 15.5 },
  chev: { fontFamily: 'Raleway_400Regular', fontSize: 18 },

  // referral card
  card: { borderRadius: 13, borderWidth: 1, padding: 16, gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  savedCodeText: { fontFamily: 'Raleway_400Regular', fontSize: 14 },
  removeLink: { fontFamily: 'Raleway_600SemiBold', fontSize: 13 },
  codeInputRow: { flexDirection: 'row', gap: 8 },
  codeInput: { flex: 1, borderRadius: 11, borderWidth: 1, paddingVertical: 11, paddingHorizontal: 14, fontFamily: 'Raleway_400Regular', fontSize: 14 },
  applyBtn: { borderRadius: 11, paddingHorizontal: 20, justifyContent: 'center' },
  applyBtnText: { fontFamily: 'Raleway_600SemiBold', fontSize: 14 },
  feedbackCard: { borderRadius: 11, padding: 12 },
  feedbackText: { fontFamily: 'Raleway_500Medium', fontSize: 13 },

  // sign out
  signOut: { fontFamily: 'Raleway_600SemiBold', fontSize: 11.5, marginTop: 18 },
})
