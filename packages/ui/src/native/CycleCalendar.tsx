import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { getPhaseForDay } from '@lunari/phase-data'

interface Props {
  cycleStartDate: string
  currentDay: number
  logs: { day: number }[]
}

export const CycleCalendar: React.FC<Props> = ({ currentDay, logs }) => {
  const days = Array.from({ length: 28 }, (_, i) => i + 1)
  const logDays = new Set(logs.map((l) => l.day))

  const renderDot = (day: number) => {
    const phase = getPhaseForDay(day)
    const isToday = day === currentDay
    const hasLog = logDays.has(day)

    return (
      <View key={day} style={styles.dotWrapper}>
        <View
          style={[
            styles.dot,
            { backgroundColor: isToday ? phase.color : phase.lightColor },
            isToday && styles.dotToday,
          ]}
        >
          <Text
            style={[
              styles.dotText,
              { color: isToday ? '#FFFFFF' : phase.color },
            ]}
          >
            {day}
          </Text>
        </View>
        {hasLog && <View style={[styles.logIndicator, { backgroundColor: phase.color }]} />}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>{days.slice(0, 14).map(renderDot)}</View>
      <View style={styles.row}>{days.slice(14).map(renderDot)}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  dotWrapper: {
    alignItems: 'center',
    gap: 3,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotToday: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  dotText: {
    fontFamily: 'Inter',
    fontSize: 9,
    fontWeight: '600',
  },
  logIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
})
