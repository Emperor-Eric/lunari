import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  Switch,
  Alert,
  StyleSheet,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Circle } from 'react-native-svg'
import { router } from 'expo-router'
import { useAuth, useUser } from '@lunari/utils'
import { getPhaseForDay, getPhaseById, getPhaseRanges } from '@lunari/phase-data'
import { phases as phaseTheme, phaseKeyFor } from '@lunari/design-tokens'
import { Toast } from '@lunari/ui'
import type { UserReferralCode, TodayCycleResponse, NotificationPrefs } from '@lunari/types'
import { CycleSettingsRow } from '../../src/components/CycleSettingsRow'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/v1'
// Referral entry turns on with the shop — a code only matters once there's a product.
const SHOP_ENABLED = process.env.EXPO_PUBLIC_SHOP_ENABLED === 'true'

// Cycle order for the mini phase rail (matches phase-data day ranges).
const PHASE_ORDER = ['menstrual', 'follicular', 'ovulation', 'luteal'] as const

// Settings rows beyond Notifications & the wired Cycle settings row — each pushes a
// dedicated screen.
const EXTRA_SETTINGS: { label: string; href: '/connected-apps' | '/privacy' }[] = [
  { label: 'Connected apps', href: '/connected-apps' },
  { label: 'Privacy & data', href: '/privacy' },
]

// Fixed Lab neutrals — phase-independent (labBg is light on all four phases).
const N = { section: '#A99E88', text: '#2C2825', chev: '#CDC2AD' }

// The part of an email before the @ — a friendly fallback when no name is set.
function emailHandle(email?: string | null): string {
  if (!email) return ''
  const at = email.indexOf('@')
  return at > 0 ? email.slice(0, at) : email
}

function headerStops(css: string): string[] {
  return css.match(/#[0-9a-fA-F]{6}/g) ?? []
}

export default function Profile() {
  const { signOut, session } = useAuth()
  const { user, updateUser, fetchUser, isLoading: userLoading } = useUser()

  const [cycleData, setCycleData] = useState<TodayCycleResponse | null>(null)

  // Referral code state
  const [savedCode, setSavedCode] = useState<string | null>(null)
  const [codeInput, setCodeInput] = useState('')
  const [applying, setApplying] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const authHeaders = useCallback(
    () => ({
      Authorization: `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    }),
    [session]
  )

  const loadCycle = useCallback(() => {
    if (!session) return
    fetch(`${API_URL}/me/cycle/today`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: TodayCycleResponse | null) => data && setCycleData(data))
      .catch(() => {})
  }, [session, authHeaders])

  useEffect(() => {
    loadCycle()
  }, [loadCycle])

  // The user store is only populated during login/onboarding; on a cold start it's
  // empty, which is why the header name was stuck on "Loading…". Fetch it here too.
  // (fetchUser no-ops without a session, so it's safe to call whenever session changes.)
  useEffect(() => {
    fetchUser()
  }, [session, fetchUser])

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

  // Persist a partial change while preserving the other prefs. Sends the full object
  // (the type requires dailyReminder/reminderTime); the API also merges server-side.
  const savePrefs = (patch: Partial<NotificationPrefs>) => {
    const p = user?.notificationPrefs
    updateUser({
      notificationPrefs: {
        dailyReminder: p?.dailyReminder ?? true,
        reminderTime: p?.reminderTime ?? '08:00',
        phaseChangeAlerts: p?.phaseChangeAlerts ?? true,
        periodApproachingAlerts: p?.periodApproachingAlerts ?? true,
        periodApproachingDays: p?.periodApproachingDays ?? 2,
        ...patch,
      },
    })
  }

  const prefs = user?.notificationPrefs
  const notifPeriodDays = prefs?.periodApproachingDays ?? 2

  // Clear all logged period starts/ends → predictions fall back to onboarding.
  const [confirmClear, setConfirmClear] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const clearPeriodHistory = async () => {
    if (!session) return
    setClearing(true)
    try {
      const r = await fetch(`${API_URL}/me/period-events`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!r.ok) throw new Error('clear failed')
      setConfirmClear(false)
      loadCycle() // recalibrate this screen's stats back to the onboarding fallback
      setToast({ msg: 'Period history cleared', type: 'success' })
      setTimeout(() => setToast(null), 2200)
    } catch {
      setToast({ msg: "Couldn't clear — try again", type: 'error' })
      setTimeout(() => setToast(null), 2600)
    } finally {
      setClearing(false)
    }
  }

  // Theme follows the current phase (authoritative phase id from the API).
  const day = cycleData?.day ?? 1
  const phase = cycleData ? getPhaseById(cycleData.phase) : getPhaseForDay(1)
  const t = phaseTheme[phaseKeyFor(phase.id)]
  const activeKey = phaseKeyFor(phase.id)

  // Real per-user cycle stats.
  const cycleDays = cycleData?.cycleLength ?? 28
  const periodDays = cycleData?.periodLength ?? 5

  // "Where you are" — derived from the real proportional phase windows.
  const ranges = getPhaseRanges(cycleDays, periodDays)
  const currentRange = ranges.find((r) => r.phase === phase.id) ?? {
    startDay: 1,
    endDay: cycleDays,
  }
  const dayOfPhase = day - currentRange.startDay + 1
  const phaseLength = currentRange.endDay - currentRange.startDay + 1
  const daysUntilNext = currentRange.endDay - day
  const currentIndex = PHASE_ORDER.indexOf(activeKey as (typeof PHASE_ORDER)[number])
  const nextLabel = phaseTheme[PHASE_ORDER[(currentIndex + 1) % PHASE_ORDER.length]].label

  // Three distinct states for the header name (don't conflate "still loading" with
  // "loaded but the account has no name"): name → email handle → "Welcome" (loaded)
  // / "Loading…" (only while genuinely fetching).
  const email = user?.email ?? session?.user?.email ?? null
  const handle = emailHandle(email)
  const trimmedName = user?.name?.trim() ?? ''
  const displayName = trimmedName || handle || (userLoading ? 'Loading…' : 'Welcome')

  // Monogram derives from the real name/handle only — never from a placeholder.
  const monogramSource = trimmedName || handle
  const initials = monogramSource
    ? monogramSource
        .split(/\s+/)
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '··'
  const memberSince = user?.createdAt ? new Date(user.createdAt).getFullYear() : null

  const stops = headerStops(t.header)
  const headerColors = (stops.length >= 2 ? stops : [t.headerLabel, t.headerLabel]) as [
    string,
    string,
    ...string[],
  ]

  return (
    <View style={{ flex: 1, backgroundColor: t.labBg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* ── HEADER BAND (avatar + name, orbit bottom-right) ── */}
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
            <View style={styles.user}>
              <View style={[styles.avatar, { borderColor: t.headerLabel }]}>
                <Text style={[styles.avatarText, { color: t.headerLabel }]}>{initials}</Text>
              </View>
              <View>
                <Text style={[styles.name, { color: t.headerText }]}>{displayName}</Text>
                <Text style={[styles.handle, { color: t.headerLabel }]}>
                  {memberSince ? `member since ${memberSince}` : (email ?? '')}
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

          {/* Where you are — non-product cycle summary (real data only) */}
          <Text style={[styles.sectionLabel, styles.gap, { color: N.section }]}>Where you are</Text>
          <View style={[styles.summary, { backgroundColor: t.labCard, borderColor: t.labBorder }]}>
            <View style={styles.summaryHead}>
              <Text style={[styles.summaryPhase, { color: t.accent }]}>{t.label}</Text>
              <Text style={[styles.summaryDay, { color: N.text }]}>
                Day {dayOfPhase}
                <Text style={[styles.summaryDayOf, { color: N.section }]}> of {phaseLength}</Text>
              </Text>
            </View>
            <Text style={[styles.summaryVibe, { color: N.section }]}>{t.vibe}</Text>

            {/* mini phase rail */}
            <View style={styles.rail}>
              {PHASE_ORDER.map((key) => (
                <View
                  key={key}
                  style={[
                    styles.railSeg,
                    {
                      backgroundColor: phaseTheme[key].phase,
                      opacity: key === activeKey ? 1 : 0.28,
                    },
                  ]}
                />
              ))}
            </View>

            <Text style={[styles.summaryMeta, { color: N.section }]}>
              Phase {currentIndex + 1} of {PHASE_ORDER.length}
              {daysUntilNext > 0
                ? ` · ${daysUntilNext} ${daysUntilNext === 1 ? 'day' : 'days'} until ${nextLabel}`
                : ' · last day of this phase'}
            </Text>
          </View>

          {/* Notifications — grouped, real wired toggles (each persists via PATCH /me) */}
          <Text style={[styles.sectionLabel, styles.gap, { color: N.section }]}>Notifications</Text>
          <View
            style={[styles.notifGroup, { backgroundColor: t.labCard, borderColor: t.labBorder }]}
          >
            <View style={[styles.settingsRow, { borderBottomColor: t.labBorder }]}>
              <Text style={[styles.settingsText, { color: N.text }]}>Daily reminder</Text>
              <Switch
                value={prefs?.dailyReminder ?? true}
                onValueChange={(v) => savePrefs({ dailyReminder: v })}
                trackColor={{ true: t.accent, false: '#E5DDCD' }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={[styles.settingsRow, { borderBottomColor: t.labBorder }]}>
              <Text style={[styles.settingsText, { color: N.text }]}>Phase change alerts</Text>
              <Switch
                value={prefs?.phaseChangeAlerts ?? true}
                onValueChange={(v) => savePrefs({ phaseChangeAlerts: v })}
                trackColor={{ true: t.accent, false: '#E5DDCD' }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View
              style={[
                styles.settingsRow,
                {
                  borderBottomColor: t.labBorder,
                  borderBottomWidth: (prefs?.periodApproachingAlerts ?? true) ? 1 : 0,
                },
              ]}
            >
              <Text style={[styles.settingsText, { color: N.text }]}>
                Period approaching alerts
              </Text>
              <Switch
                value={prefs?.periodApproachingAlerts ?? true}
                onValueChange={(v) => savePrefs({ periodApproachingAlerts: v })}
                trackColor={{ true: t.accent, false: '#E5DDCD' }}
                thumbColor="#FFFFFF"
              />
            </View>
            {(prefs?.periodApproachingAlerts ?? true) && (
              <View
                style={[
                  styles.settingsRow,
                  { borderBottomColor: t.labBorder, borderBottomWidth: 0 },
                ]}
              >
                <Text style={[styles.settingsText, { color: N.text }]}>Days before period</Text>
                <View style={styles.stepper}>
                  <Pressable
                    onPress={() =>
                      savePrefs({ periodApproachingDays: Math.max(1, notifPeriodDays - 1) })
                    }
                    disabled={notifPeriodDays <= 1}
                    style={[
                      styles.stepBtn,
                      { borderColor: t.labBorder, opacity: notifPeriodDays <= 1 ? 0.4 : 1 },
                    ]}
                  >
                    <Text style={[styles.stepSign, { color: N.text }]}>−</Text>
                  </Pressable>
                  <Text style={[styles.stepValue, { color: N.text }]}>{notifPeriodDays}</Text>
                  <Pressable
                    onPress={() =>
                      savePrefs({ periodApproachingDays: Math.min(5, notifPeriodDays + 1) })
                    }
                    disabled={notifPeriodDays >= 5}
                    style={[
                      styles.stepBtn,
                      { borderColor: t.labBorder, opacity: notifPeriodDays >= 5 ? 0.4 : 1 },
                    ]}
                  >
                    <Text style={[styles.stepSign, { color: N.text }]}>+</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {/* Settings */}
          <Text style={[styles.sectionLabel, styles.gap, { color: N.section }]}>Settings</Text>
          <View>
            {/* Wired: edit the RAW onboarding cycle, then recalibrate. */}
            <CycleSettingsRow
              ink={N.text}
              sub={N.section}
              chev={N.chev}
              gold={t.accent}
              cardwash={t.labCard}
              cardbd={t.labBorder}
              rowBorder={t.labBorder}
              onSaved={loadCycle}
            />
            {/* Wired rows → dedicated pushed screens */}
            {EXTRA_SETTINGS.map((row, i) => (
              <Pressable
                key={row.label}
                onPress={() => router.push(row.href)}
                style={[
                  styles.settingsRow,
                  {
                    borderBottomColor: t.labBorder,
                    borderBottomWidth: i === EXTRA_SETTINGS.length - 1 ? 0 : 1,
                  },
                ]}
              >
                <Text style={[styles.settingsText, { color: N.text }]}>{row.label}</Text>
                <Text style={[styles.chev, { color: N.chev }]}>›</Text>
              </Pressable>
            ))}
          </View>

          {/* Data — destructive reset, confirm-gated */}
          <Text style={[styles.sectionLabel, styles.gap, { color: N.section }]}>Data</Text>
          <View style={[styles.card, { backgroundColor: t.labCard, borderColor: t.labBorder }]}>
            {!confirmClear ? (
              <Pressable onPress={() => setConfirmClear(true)}>
                <Text style={styles.dataAction}>Clear period history</Text>
              </Pressable>
            ) : (
              <>
                <Text style={[styles.dataWarn, { color: N.text }]}>
                  This deletes all your logged periods and resets predictions to your onboarding
                  cycle. Continue?
                </Text>
                <View style={styles.dataActions}>
                  <Pressable
                    onPress={clearPeriodHistory}
                    disabled={clearing}
                    style={[styles.destructiveBtn, { opacity: clearing ? 0.6 : 1 }]}
                  >
                    <Text style={styles.destructiveText}>
                      {clearing ? 'Clearing…' : 'Clear history'}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setConfirmClear(false)}
                    style={[styles.cancelBtn, { borderColor: t.labBorder }]}
                  >
                    <Text style={[styles.cancelText, { color: N.text }]}>Cancel</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>

          {/* Referral code — gated behind SHOP_ENABLED (off pre-launch) */}
          {SHOP_ENABLED && (
            <>
              <Text style={[styles.sectionLabel, styles.gap, { color: N.section }]}>
                Referral code
              </Text>
              <View style={[styles.card, { backgroundColor: t.labCard, borderColor: t.labBorder }]}>
                {savedCode ? (
                  <View style={styles.row}>
                    <Text style={[styles.savedCodeText, { color: N.text }]}>
                      Your code: {savedCode}
                    </Text>
                    <TouchableOpacity onPress={removeCode}>
                      <Text style={[styles.removeLink, { color: t.accent }]}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.codeInputRow}>
                    <TextInput
                      style={[
                        styles.codeInput,
                        { backgroundColor: t.labBg, borderColor: t.labBorder, color: N.text },
                      ]}
                      placeholder="e.g. GYMGIRL20"
                      placeholderTextColor={N.section}
                      value={codeInput}
                      onChangeText={setCodeInput}
                      autoCapitalize="characters"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      style={[
                        styles.applyBtn,
                        { backgroundColor: t.accent, opacity: applying ? 0.6 : 1 },
                      ]}
                      onPress={applyCode}
                      disabled={applying}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.applyBtnText, { color: t.headerText }]}>
                        {applying ? '…' : 'Apply'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                {feedback && (
                  <View
                    style={[
                      styles.feedbackCard,
                      { backgroundColor: feedback.type === 'success' ? t.labWhy : '#F5E8EA' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.feedbackText,
                        { color: feedback.type === 'success' ? t.accent : '#7A1E2E' },
                      ]}
                    >
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

      {toast && <Toast message={toast.msg} type={toast.type} />}
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
        {
          backgroundColor: today ? t.accent : t.labCard,
          borderColor: today ? 'transparent' : t.labBorder,
        },
      ]}
    >
      <Text style={[styles.statValue, { color: today ? t.headerText : '#2C2825' }]}>{value}</Text>
      <Text
        style={[
          styles.statCaption,
          { color: today ? t.headerText : '#A99E88', opacity: today ? 0.8 : 1 },
        ]}
      >
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
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: 'Marcellus_400Regular', fontSize: 22 },
  name: { fontFamily: 'Marcellus_400Regular', fontSize: 21 },
  handle: { fontFamily: 'Raleway_300Light', fontSize: 10.5, marginTop: 1 },

  // tinted body
  body: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 16 },
  sectionLabel: {
    fontFamily: 'Raleway_500Medium',
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 11,
  },
  gap: { marginTop: 20 },

  // cycle stats
  stats: { flexDirection: 'row', gap: 9 },
  stat: { flex: 1, borderRadius: 13, borderWidth: 1, paddingVertical: 14, alignItems: 'center' },
  statValue: { fontFamily: 'Marcellus_400Regular', fontSize: 23 },
  statCaption: { fontFamily: 'Raleway_400Regular', fontSize: 8.5, marginTop: 2 },

  // where-you-are summary
  summary: { borderRadius: 15, borderWidth: 1, padding: 16 },
  summaryHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  summaryPhase: { fontFamily: 'Marcellus_400Regular', fontSize: 19 },
  summaryDay: { fontFamily: 'Marcellus_400Regular', fontSize: 15 },
  summaryDayOf: { fontFamily: 'Raleway_400Regular', fontSize: 11 },
  summaryVibe: { fontFamily: 'Raleway_400Regular', fontSize: 11, marginTop: 2 },
  rail: { flexDirection: 'row', gap: 5, marginTop: 14 },
  railSeg: { flex: 1, height: 6, borderRadius: 3 },
  summaryMeta: { fontFamily: 'Raleway_400Regular', fontSize: 10.5, marginTop: 10 },

  // settings
  notifGroup: { borderRadius: 15, borderWidth: 1, paddingHorizontal: 16 },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  settingsText: { fontFamily: 'Marcellus_400Regular', fontSize: 15.5 },
  chev: { fontFamily: 'Raleway_400Regular', fontSize: 18 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepSign: { fontFamily: 'Raleway_500Medium', fontSize: 16, lineHeight: 18 },
  stepValue: {
    fontFamily: 'Marcellus_400Regular',
    fontSize: 16,
    minWidth: 16,
    textAlign: 'center',
  },

  // data action (clear period history)
  dataAction: { fontFamily: 'Marcellus_400Regular', fontSize: 15.5, color: '#7A1E2E' },
  dataWarn: { fontFamily: 'Raleway_300Light', fontSize: 12, lineHeight: 18 },
  dataActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  destructiveBtn: {
    backgroundColor: '#7A1E2E',
    borderRadius: 11,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  destructiveText: { fontFamily: 'Raleway_600SemiBold', fontSize: 12, color: '#FBF6EC' },
  cancelBtn: { borderWidth: 1, borderRadius: 11, paddingVertical: 9, paddingHorizontal: 14 },
  cancelText: { fontFamily: 'Raleway_500Medium', fontSize: 12 },

  // referral card
  card: { borderRadius: 13, borderWidth: 1, padding: 16, gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  savedCodeText: { fontFamily: 'Raleway_400Regular', fontSize: 14 },
  removeLink: { fontFamily: 'Raleway_600SemiBold', fontSize: 13 },
  codeInputRow: { flexDirection: 'row', gap: 8 },
  codeInput: {
    flex: 1,
    borderRadius: 11,
    borderWidth: 1,
    paddingVertical: 11,
    paddingHorizontal: 14,
    fontFamily: 'Raleway_400Regular',
    fontSize: 14,
  },
  applyBtn: { borderRadius: 11, paddingHorizontal: 20, justifyContent: 'center' },
  applyBtnText: { fontFamily: 'Raleway_600SemiBold', fontSize: 14 },
  feedbackCard: { borderRadius: 11, padding: 12 },
  feedbackText: { fontFamily: 'Raleway_500Medium', fontSize: 13 },

  // sign out
  signOut: { fontFamily: 'Raleway_600SemiBold', fontSize: 11.5, marginTop: 18 },
})
