import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, RefreshControl, Pressable, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Circle } from 'react-native-svg'
import { useAuth } from '@lunari/utils'
import {
  getPhaseForDay,
  getPhaseById,
  phasePositionForCycleDay,
  getMoveGuidance,
  normalizeTrainingProfile,
  MOVE_OVERRIDE_COPY,
  MOVE_SETUP_COPY,
  TRAINING_STYLE_OPTIONS,
  TRAINING_STYLE_SHORT,
  TRAINING_SERIOUSNESS_OPTIONS,
  TRAINING_DAYS_OPTIONS,
} from '@lunari/phase-data'
import { phases as phaseTheme, phaseKeyFor } from '@lunari/design-tokens'
import { LoadingSpinner } from '@lunari/ui'
import type {
  TodayCycleResponse,
  User,
  TrainingProfile,
  TrainingStyle,
  TrainingSeriousness,
  TrainingDaysPerWeek,
} from '@lunari/types'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/v1'

// Fixed Lab neutrals — phase-independent (labBg is light on all four phases).
const N = {
  label: '#8A8275',
  section: '#A99E88',
  title: '#2C2825',
  text: '#6A655D',
  barOff: '#E5DDCD',
}

type Override = 'strong' | 'normal' | 'low'
type Theme = (typeof phaseTheme)[keyof typeof phaseTheme]

// The token `header` is a CSS gradient string; pull its hex stops for LinearGradient.
function headerStops(css: string): string[] {
  return css.match(/#[0-9a-fA-F]{6}/g) ?? []
}

export default function Workouts() {
  const { session } = useAuth()
  const [cycleData, setCycleData] = useState<TodayCycleResponse | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [override, setOverride] = useState<Override>('normal')
  const [setupOpen, setSetupOpen] = useState(false)
  // Which of the user's styles is showing (multi-style profiles); null = first.
  const [activeStyle, setActiveStyle] = useState<TrainingStyle | null>(null)
  // Which session accordion is expanded — collapsed by default, one open at a time.
  const [openSession, setOpenSession] = useState<number | null>(null)

  const fetchAll = useCallback(async () => {
    if (!session) return
    const headers = { Authorization: `Bearer ${session.access_token}` }
    try {
      const [c, u] = await Promise.all([
        fetch(`${API_URL}/me/cycle/today`, { headers }).then((r) => (r.ok ? r.json() : null)),
        fetch(`${API_URL}/me`, { headers }).then((r) => (r.ok ? r.json() : null)),
      ])
      if (c) setCycleData(c)
      if (u) setUser(u)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [session])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Tabs stay mounted — re-pull on focus so training-profile edits made on the Me tab
  // (or elsewhere) personalize this screen without a pull-to-refresh.
  useFocusEffect(
    useCallback(() => {
      fetchAll()
    }, [fetchAll])
  )

  const onRefresh = () => {
    setRefreshing(true)
    fetchAll()
  }

  const saveTraining = async (patch: Partial<TrainingProfile>) => {
    if (!session) return
    try {
      const res = await fetch(`${API_URL}/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ trainingProfile: patch }),
      })
      if (res.ok) setUser(await res.json())
    } catch {
      /* leave as-is */
    }
  }

  const day = cycleData?.day ?? 1
  const phase = cycleData ? getPhaseById(cycleData.phase) : getPhaseForDay(1)
  const t = phaseTheme[phaseKeyFor(phase.id)]

  // Legacy { style } / { style: 'mix' } resolve through the shared normalizer.
  // (Computed before the loading return so the hygiene hooks below run unconditionally.)
  const trainingStyles = normalizeTrainingProfile(user?.trainingProfile).styles
  const active =
    activeStyle && trainingStyles.includes(activeStyle) ? activeStyle : (trainingStyles[0] ?? null)

  // State hygiene: collapse the accordions whenever the rendered session list changes
  // for ANY reason (style switch, phase rollover, profile edits), and drop a remembered
  // style once it leaves the profile so it can't silently reclaim the view later.
  const stylesKey = trainingStyles.join(',')
  useEffect(() => {
    setOpenSession(null)
  }, [active, phase.id])
  useEffect(() => {
    if (activeStyle && !stylesKey.split(',').includes(activeStyle)) setActiveStyle(null)
  }, [stylesKey, activeStyle])

  if (loading) return <LoadingSpinner phaseColor={t.accent} />

  const accent = t.accent
  const half = phasePositionForCycleDay(
    day,
    cycleData?.cycleLength ?? 28,
    cycleData?.periodLength ?? 5
  ).half
  const move = getMoveGuidance(active, phase.id, half)

  const displayBars = override === 'low' ? Math.max(1, move.dial.bars - 1) : move.dial.bars
  const overrideResponse =
    override === 'low'
      ? MOVE_OVERRIDE_COPY.lowResponse
      : override === 'strong'
        ? MOVE_OVERRIDE_COPY.strongResponse
        : null

  const stops = headerStops(t.header)
  const headerColors = (stops.length >= 2 ? stops : [t.headerLabel, t.headerLabel]) as [
    string,
    string,
    ...string[],
  ]
  const cardStyle = [styles.card, { backgroundColor: t.labCard, borderColor: t.labBorder }]

  return (
    <View style={{ flex: 1, backgroundColor: t.labBg }}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />
        }
      >
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
            <Text style={[styles.context, { color: t.headerLabel }]}>
              {t.label} · Day {day}
            </Text>
            <Text style={[styles.title, { color: t.headerText }]}>Move</Text>
            <Text style={[styles.tagline, { color: t.headerText }]}>{move.tagline}</Text>
          </SafeAreaView>
        </LinearGradient>

        {/* ── TINTED BODY ── */}
        <View style={styles.body}>
          {/* dial card */}
          <View style={cardStyle}>
            <Text style={[styles.dialLabel, { color: N.label }]}>Intensity today</Text>
            <View style={styles.bars}>
              {[0, 1, 2, 3, 4].map((i) => (
                <View
                  key={i}
                  style={[styles.bar, { backgroundColor: i < displayBars ? accent : N.barOff }]}
                />
              ))}
            </View>
            <Text style={[styles.dialValue, { color: accent }]}>{move.dial.label}</Text>
            <Text style={[styles.microcopy, { color: N.text }]}>
              {MOVE_OVERRIDE_COPY.microcopy}
            </Text>

            {/* THE OVERRIDE */}
            <View style={[styles.overrideBlock, { borderTopColor: t.labBorder }]}>
              <Text style={[styles.dialLabel, { color: N.label, marginBottom: 8 }]}>
                {MOVE_OVERRIDE_COPY.control}
              </Text>
              <View style={styles.chips}>
                {(
                  [
                    ['strong', MOVE_OVERRIDE_COPY.strong],
                    ['normal', MOVE_OVERRIDE_COPY.normal],
                    ['low', MOVE_OVERRIDE_COPY.low],
                  ] as [Override, string][]
                ).map(([value, label]) => {
                  const on = override === value
                  return (
                    <Pressable
                      key={value}
                      onPress={() => setOverride(value)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: on ? accent : 'transparent',
                          borderColor: on ? 'transparent' : t.labBorder,
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: on ? '#F5EBD6' : N.text }]}>
                        {label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
              {overrideResponse && (
                <Text style={[styles.overrideResponse, { color: accent }]}>{overrideResponse}</Text>
              )}
            </View>
          </View>

          {/* why note */}
          <View style={[styles.why, { backgroundColor: t.labWhy }]}>
            <Text style={[styles.whyText, { color: N.text }]}>
              <Text style={[styles.whyLead, { color: accent }]}>Why · </Text>
              {move.why}
            </Text>
          </View>

          {/* guidance OR "make this yours" prompt */}
          {move.guidance ? (
            <>
              {/* style switcher — only when the profile has 2+ styles */}
              {trainingStyles.length >= 2 && (
                <View style={[styles.chips, { marginTop: 22 }]}>
                  {trainingStyles.map((s) => {
                    const on = s === active
                    return (
                      <Pressable
                        key={s}
                        onPress={() => {
                          setActiveStyle(s)
                          setOpenSession(null)
                        }}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: on ? accent : 'transparent',
                            borderColor: on ? 'transparent' : t.labBorder,
                          },
                        ]}
                      >
                        <Text style={[styles.chipText, { color: on ? '#F5EBD6' : N.text }]}>
                          {TRAINING_STYLE_SHORT[s]}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              )}

              <Text style={[styles.sectionLabel, { color: N.section }]}>For you today</Text>
              <View style={cardStyle}>
                <Text style={[styles.guidanceHead, { color: N.title }]}>
                  {move.guidance.headline}
                </Text>
                <Text style={[styles.guidanceBody, { color: N.text }]}>{move.guidance.body}</Text>
              </View>

              <Text style={[styles.sectionLabel, { color: N.section }]}>Session ideas</Text>
              <View>
                {move.guidance.sessions.map((s, i) => {
                  const last = i === move.guidance!.sessions.length - 1
                  const expandable = Boolean(s.how || s.tip)
                  const open = openSession === i
                  return (
                    <View
                      key={s.name}
                      style={[
                        styles.session,
                        { borderBottomColor: t.labBorder, borderBottomWidth: last ? 0 : 1 },
                      ]}
                    >
                      <Pressable
                        onPress={expandable ? () => setOpenSession(open ? null : i) : undefined}
                        disabled={!expandable}
                        style={styles.sessionHead}
                      >
                        <View style={[styles.sessionDot, { backgroundColor: accent }]} />
                        <Text style={[styles.sessionName, { color: N.title }]}>{s.name}</Text>
                        {expandable && (
                          <Text
                            style={[
                              styles.sessionChev,
                              { color: accent, transform: [{ rotate: open ? '90deg' : '0deg' }] },
                            ]}
                          >
                            ›
                          </Text>
                        )}
                      </Pressable>
                      {open && (
                        <View style={styles.sessionDetail}>
                          {s.how && (
                            <Text style={[styles.sessionHow, { color: N.text }]}>{s.how}</Text>
                          )}
                          {s.tip && (
                            <>
                              <Text style={[styles.sessionTipLabel, { color: accent }]}>TIP</Text>
                              <Text style={[styles.sessionTip, { color: N.text }]}>{s.tip}</Text>
                            </>
                          )}
                        </View>
                      )}
                    </View>
                  )
                })}
              </View>
            </>
          ) : setupOpen ? (
            <TrainingSetup
              t={t}
              onSkip={() => setSetupOpen(false)}
              onSave={async (p) => {
                await saveTraining(p)
                setSetupOpen(false)
              }}
            />
          ) : (
            <View style={[cardStyle, { marginTop: 22 }]}>
              <Text style={[styles.promptHead, { color: N.title }]}>
                {MOVE_SETUP_COPY.promptHeading}
              </Text>
              <Text style={[styles.guidanceBody, { color: N.text }]}>
                {MOVE_SETUP_COPY.promptBody}
              </Text>
              <Pressable
                onPress={() => setSetupOpen(true)}
                style={[styles.primaryBtn, { backgroundColor: accent }]}
              >
                <Text style={styles.primaryBtnText}>{MOVE_SETUP_COPY.promptButton}</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

// ── Inline 3-question setup panel ─────────────────────────────────────────────
function TrainingSetup({
  t,
  onSave,
  onSkip,
}: {
  t: Theme
  onSave: (p: Partial<TrainingProfile>) => void | Promise<void>
  onSkip: () => void
}) {
  const [selStyles, setSelStyles] = useState<TrainingStyle[]>([])
  const [seriousness, setSeriousness] = useState<TrainingSeriousness | undefined>()
  const [days, setDays] = useState<TrainingDaysPerWeek | undefined>()

  const toggleStyle = (v: string) => {
    const s = v as TrainingStyle
    setSelStyles((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  }

  return (
    <View
      style={[styles.card, { backgroundColor: t.labCard, borderColor: t.labBorder, marginTop: 22 }]}
    >
      <Text style={[styles.guidanceBody, { color: N.text }]}>{MOVE_SETUP_COPY.intro}</Text>

      <Text style={[styles.q, { color: N.title }]}>{MOVE_SETUP_COPY.q1}</Text>
      <ChipRow
        t={t}
        options={TRAINING_STYLE_OPTIONS}
        selectedValues={selStyles}
        onSelect={toggleStyle}
      />
      <Text style={[styles.q, { color: N.title }]}>{MOVE_SETUP_COPY.q2}</Text>
      <ChipRow
        t={t}
        options={TRAINING_SERIOUSNESS_OPTIONS}
        selectedValues={seriousness ? [seriousness] : []}
        onSelect={(v) => setSeriousness(v as TrainingSeriousness)}
      />
      <Text style={[styles.q, { color: N.title }]}>{MOVE_SETUP_COPY.q3}</Text>
      <ChipRow
        t={t}
        options={TRAINING_DAYS_OPTIONS}
        selectedValues={days ? [days] : []}
        onSelect={(v) => setDays(v as TrainingDaysPerWeek)}
      />

      <View style={styles.setupActions}>
        <Pressable
          disabled={selStyles.length < 1}
          onPress={() =>
            onSave({
              styles: selStyles,
              ...(seriousness && { seriousness }),
              ...(days && { daysPerWeek: days }),
            })
          }
          style={[
            styles.primaryBtn,
            { backgroundColor: t.accent, opacity: selStyles.length >= 1 ? 1 : 0.45 },
          ]}
        >
          <Text style={styles.primaryBtnText}>Save</Text>
        </Pressable>
        <Pressable onPress={onSkip}>
          <Text style={[styles.skip, { color: N.text }]}>{MOVE_SETUP_COPY.skip}</Text>
        </Pressable>
      </View>
    </View>
  )
}

function ChipRow({
  t,
  options,
  selectedValues,
  onSelect,
}: {
  t: Theme
  options: { value: string; label: string }[]
  selectedValues: string[]
  onSelect: (v: string) => void
}) {
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const on = selectedValues.includes(o.value)
        return (
          <Pressable
            key={o.value}
            onPress={() => onSelect(o.value)}
            style={[
              styles.chip,
              {
                backgroundColor: on ? t.accent : 'transparent',
                borderColor: on ? 'transparent' : t.labBorder,
              },
            ]}
          >
            <Text style={[styles.chipText, { color: on ? '#F5EBD6' : N.text }]}>{o.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 40 },

  // header band
  header: { overflow: 'hidden' },
  orbit: { position: 'absolute', right: -34, top: -22 },
  headerInner: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 22 },
  context: {
    fontFamily: 'Raleway_600SemiBold',
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 16,
  },
  title: { fontFamily: 'Marcellus_400Regular', fontSize: 30, marginTop: 5 },
  tagline: { fontFamily: 'Raleway_300Light', fontSize: 12, marginTop: 4, opacity: 0.72 },

  // tinted body
  body: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 16 },
  card: { borderRadius: 15, borderWidth: 1, paddingVertical: 15, paddingHorizontal: 17 },

  // dial card
  dialLabel: { fontFamily: 'Raleway_500Medium', fontSize: 10.5 },
  bars: { flexDirection: 'row', gap: 5, marginTop: 9 },
  bar: { flex: 1, height: 6, borderRadius: 3 },
  dialValue: { fontFamily: 'Raleway_600SemiBold', fontSize: 9.5, marginTop: 8 },
  microcopy: { fontFamily: 'Raleway_300Light', fontSize: 9.5, lineHeight: 15, marginTop: 8 },
  overrideBlock: { borderTopWidth: 1, marginTop: 12, paddingTop: 12 },
  overrideResponse: {
    fontFamily: 'Raleway_500Medium',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 10,
  },

  // chips
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontFamily: 'Raleway_500Medium', fontSize: 11 },

  // why note
  why: { marginTop: 16, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 15 },
  whyText: { fontFamily: 'Raleway_300Light', fontSize: 10.5, lineHeight: 17 },
  whyLead: { fontFamily: 'Raleway_600SemiBold' },

  // section label
  sectionLabel: {
    fontFamily: 'Raleway_500Medium',
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 22,
    marginBottom: 12,
  },

  // guidance
  guidanceHead: { fontFamily: 'Marcellus_400Regular', fontSize: 19 },
  guidanceBody: { fontFamily: 'Raleway_300Light', fontSize: 11.5, lineHeight: 18, marginTop: 6 },

  // sessions (accordion rows — collapsed by default)
  session: { paddingBottom: 14, marginBottom: 14 },
  sessionHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sessionDot: { width: 6, height: 6, borderRadius: 999 },
  sessionName: { fontFamily: 'Marcellus_400Regular', fontSize: 15.5, flex: 1 },
  sessionChev: { fontFamily: 'Raleway_600SemiBold', fontSize: 13 },
  sessionDetail: { marginTop: 10, paddingLeft: 18 },
  sessionHow: { fontFamily: 'Raleway_300Light', fontSize: 11.5, lineHeight: 18 },
  sessionTipLabel: {
    fontFamily: 'Raleway_600SemiBold',
    fontSize: 8.5,
    letterSpacing: 1.5,
    marginTop: 8,
    marginBottom: 3,
  },
  sessionTip: { fontFamily: 'Raleway_300Light', fontSize: 11, lineHeight: 17 },

  // prompt + setup
  promptHead: { fontFamily: 'Marcellus_400Regular', fontSize: 18 },
  primaryBtn: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 11,
  },
  primaryBtnText: { fontFamily: 'Raleway_600SemiBold', fontSize: 11, color: '#F5EBD6' },
  q: { fontFamily: 'Raleway_500Medium', fontSize: 12, marginTop: 14, marginBottom: 8 },
  setupActions: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 },
  skip: { fontFamily: 'Raleway_500Medium', fontSize: 11 },
})
