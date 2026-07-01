import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { format } from 'date-fns'
import type { SymptomLog } from '@lunari/types'
import { getPhaseById, FLOW_OPTIONS, flowIntensity } from '@lunari/phase-data'

interface Props {
  log: SymptomLog
  onPress?: () => void
}

export const LogCard: React.FC<Props> = ({ log, onPress }) => {
  const phase = getPhaseById(log.phase)
  const flowLabel = log.flow ? FLOW_OPTIONS.find((o) => o.value === log.flow)?.label : null
  const flowShown = !!log.flow && log.flow !== 'none'
  const flowDot = 5 + flowIntensity(log.flow) * 2

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1} style={styles.card}>
      <View style={[styles.phaseBar, { backgroundColor: phase.color }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.date}>{format(new Date(log.loggedAt), 'MMM d')}</Text>
          <Text style={styles.day}>Day {log.cycleDay}</Text>
        </View>
        <View style={styles.symptomsRow}>
          {log.symptoms.slice(0, 3).map((s) => (
            <View key={s} style={[styles.symptomChip, { borderColor: phase.color }]}>
              <Text style={[styles.symptomText, { color: phase.color }]}>{s}</Text>
            </View>
          ))}
          {log.symptoms.length > 3 && <Text style={styles.more}>+{log.symptoms.length - 3}</Text>}
        </View>
        {flowShown && (
          <View style={styles.flowRow}>
            <View
              style={{
                width: flowDot,
                height: flowDot,
                borderRadius: 9999,
                backgroundColor: phase.color,
                opacity: 0.35 + flowIntensity(log.flow) * 0.16,
              }}
            />
            <Text style={[styles.flowText, { color: phase.color }]}>{flowLabel} flow</Text>
          </View>
        )}
        {log.journalNote ? (
          <Text style={styles.note} numberOfLines={1}>
            {log.journalNote}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8E2D6',
  },
  phaseBar: { width: 4 },
  content: { flex: 1, padding: 14, gap: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  date: { fontFamily: 'Inter', fontSize: 14, fontWeight: '600', color: '#2C2825' },
  day: { fontFamily: 'Inter', fontSize: 12, color: '#6B6460' },
  symptomsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  symptomChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    borderWidth: 1,
  },
  symptomText: { fontFamily: 'Inter', fontSize: 11, fontWeight: '500' },
  more: { fontFamily: 'Inter', fontSize: 11, color: '#6B6460', alignSelf: 'center' },
  flowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flowText: { fontFamily: 'Inter', fontSize: 11, fontWeight: '500' },
  note: { fontFamily: 'Inter', fontSize: 12, color: '#6B6460', fontStyle: 'italic' },
})
