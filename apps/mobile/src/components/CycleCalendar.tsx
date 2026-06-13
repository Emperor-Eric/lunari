import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { getDayInCycle, getPhaseForDay, getPhaseRanges } from '@lunari/phase-data'
import { phases as phaseTheme, phaseKeyFor, palette } from '@lunari/design-tokens'
import type { CycleSettings, PhaseId } from '@lunari/types'
import { addMonths, format, getDay, getDaysInMonth, isSameDay, startOfMonth } from 'date-fns'
import type { PredictionSurface } from './NextUpCard'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const phaseColor = (id: PhaseId) => phaseTheme[phaseKeyFor(id)].phase
const NUM = palette.goldOnLight // readable gold for every date number
const TODAY_FILL = `${palette.goldOnLight}26` // subtle gold wash marks today

/**
 * Self-contained month calendar. Each day is tinted by its PREDICTED phase
 * (proportional model, projected forward by repeating the cycle from startDate).
 * Pure aside from its own month-navigation state — trivially relocatable.
 */
export function CycleCalendar({
  settings,
  surface,
}: {
  settings: CycleSettings | null
  surface: PredictionSurface
}) {
  const { ink, sub, gold, cardbd } = surface
  const [view, setView] = useState(() => startOfMonth(new Date()))
  // Blend straight into the Lab body — no white card surface.
  const card = styles.card

  if (!settings) {
    return (
      <View style={card}>
        <Text style={[styles.eyebrow, { color: gold }]}>Cycle calendar</Text>
        <Text style={[styles.placeholder, { color: ink }]}>
          Your predicted phases appear here once your cycle is set up.
        </Text>
      </View>
    )
  }

  const year = view.getFullYear()
  const month = view.getMonth()
  const daysInMonth = getDaysInMonth(view)
  const lead = getDay(startOfMonth(view))
  const today = new Date()

  const cells: (number | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const dayInfo = (dayNum: number) => {
    const date = new Date(year, month, dayNum)
    const cycleDay = getDayInCycle(settings.startDate, format(date, 'yyyy-MM-dd'), settings.cycleLength)
    const id = getPhaseForDay(cycleDay, settings.cycleLength, settings.periodLength).id
    return { date, cycleDay, id }
  }

  // Peak ovulation = ~14 days before the next period, clamped into the proportional
  // ovulation window → exactly ONE starred day per cycle (others get the saffron dot).
  const ovRange = getPhaseRanges(settings.cycleLength, settings.periodLength).find((r) => r.phase === 'ovulatory')
  const peakCycleDay = ovRange
    ? Math.min(Math.max(settings.cycleLength - 13, ovRange.startDay), ovRange.endDay)
    : -1

  return (
    <View style={card}>
      {/* header: month + nav */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => setView((v) => addMonths(v, -1))} hitSlop={10}>
          <Text style={[styles.nav, { color: gold }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.month, { color: ink }]}>{format(view, 'MMMM yyyy')}</Text>
        <TouchableOpacity onPress={() => setView((v) => addMonths(v, 1))} hitSlop={10}>
          <Text style={[styles.nav, { color: gold }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* weekday header */}
      <View style={styles.weekRow}>
        {WEEKDAYS.map((w, i) => (
          <Text key={i} style={[styles.weekday, { color: sub }]}>
            {w}
          </Text>
        ))}
      </View>

      {/* day grid — uniform neutral border; marks: navy/saffron dash + peak star */}
      <View style={styles.grid}>
        {cells.map((dayNum, i) => {
          if (dayNum === null) return <View key={`b${i}`} style={styles.cell} />
          const { date, cycleDay, id } = dayInfo(dayNum)
          const isToday = isSameDay(date, today)
          const isPeak = id === 'ovulatory' && cycleDay === peakCycleDay
          // Only menstrual + ovulation-window days get a dash; peak gets a star.
          const dashColor =
            id === 'menstrual'
              ? phaseColor('menstrual')
              : id === 'ovulatory' && !isPeak
                ? phaseColor('ovulatory')
                : null
          return (
            <View key={dayNum} style={styles.cell}>
              <View style={[styles.cellInner, { borderColor: cardbd, backgroundColor: isToday ? TODAY_FILL : 'transparent' }]}>
                <Text
                  style={[
                    styles.cellNum,
                    { color: NUM, fontFamily: isToday ? 'Marcellus_400Regular' : 'Raleway_500Medium' },
                  ]}
                >
                  {dayNum}
                </Text>
                {/* mark slot — fixed height keeps rows aligned whether dash / star / none */}
                <View style={styles.markSlot}>
                  {isPeak ? (
                    <Text style={[styles.star, { color: phaseColor('ovulatory') }]}>★</Text>
                  ) : dashColor ? (
                    <View style={[styles.dash, { backgroundColor: dashColor }]} />
                  ) : null}
                </View>
              </View>
            </View>
          )
        })}
      </View>

      {/* legend — only the marks that are actually shown */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDash, { backgroundColor: phaseColor('menstrual') }]} />
          <Text style={[styles.legendLabel, { color: sub }]}>Period day</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDash, { backgroundColor: phaseColor('ovulatory') }]} />
          <Text style={[styles.legendLabel, { color: sub }]}>Fertile window</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={[styles.legendStar, { color: phaseColor('ovulatory') }]}>★</Text>
          <Text style={[styles.legendLabel, { color: sub }]}>Peak ovulation (estimated)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendToday, { backgroundColor: TODAY_FILL, borderColor: cardbd }]} />
          <Text style={[styles.legendLabel, { color: sub }]}>Today</Text>
        </View>
      </View>
      <Text style={[styles.note, { color: sub }]}>Estimated from your cycle.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'transparent' },
  eyebrow: { fontFamily: 'Raleway_600SemiBold', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase' },
  placeholder: { fontFamily: 'Raleway_300Light', fontSize: 12, marginTop: 6, opacity: 0.85 },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nav: { fontSize: 22, width: 28, textAlign: 'center' },
  month: { fontFamily: 'Marcellus_400Regular', fontSize: 16 },

  weekRow: { flexDirection: 'row', marginTop: 10 },
  weekday: { flex: 1, textAlign: 'center', fontFamily: 'Raleway_400Regular', fontSize: 8.5 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2 },
  cellInner: { flex: 1, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cellNum: { fontSize: 11.5, lineHeight: 13 },
  markSlot: { height: 7, marginTop: 3, alignItems: 'center', justifyContent: 'center' },
  dash: { width: 11, height: 2.5, borderRadius: 2 },
  star: { fontSize: 10, lineHeight: 10 },

  legend: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 6 },
  legendDash: { width: 11, height: 2.5, borderRadius: 2, marginRight: 5 },
  legendStar: { fontSize: 11, marginRight: 5 },
  legendToday: { width: 12, height: 12, borderRadius: 4, borderWidth: 1, marginRight: 5 },
  legendLabel: { fontFamily: 'Raleway_400Regular', fontSize: 9 },

  note: { fontFamily: 'Raleway_400Regular', fontSize: 9, marginTop: 8, opacity: 0.85 },
})
