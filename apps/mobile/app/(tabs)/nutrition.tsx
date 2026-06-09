import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getPhaseForDay } from '@lunari/phase-data'
import { FoodItem, SupplementCard } from '@lunari/ui'

const CORE_BLEND = [
  { name: 'Myo-Inositol', dosage: '3500mg', purpose: 'Hormonal balance and insulin sensitivity' },
  { name: 'Inulin', dosage: '1000mg', purpose: 'Prebiotic gut support' },
  { name: 'L-Glycine', dosage: '500mg', purpose: 'Sleep quality and collagen synthesis' },
  { name: 'Magnesium Hybrid', dosage: '200mg', purpose: 'Muscle relaxation and sleep' },
  { name: 'Omega-3 Algal', dosage: '300mg', purpose: 'Anti-inflammation and brain health' },
  { name: 'Vitamin D3', dosage: '1000 IU', purpose: 'Immune function and mood regulation' },
  { name: 'Zinc Citrate', dosage: '15mg', purpose: 'Immune support and skin clarity' },
]

export default function Nutrition() {
  const phase = getPhaseForDay(15)
  const [coreExpanded, setCoreExpanded] = useState(false)
  // Phase-specific supplements (skip the first 8 which are core)
  const phaseSupplements = phase.supplements.slice(8)

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.phaseStrip, { backgroundColor: phase.lightColor }]}>
          <View style={[styles.phaseDot, { backgroundColor: phase.color }]} />
          <Text style={[styles.phaseLabel, { color: phase.color }]}>{phase.name} phase</Text>
        </View>

        <Text style={styles.heading}>Fuel</Text>

        {/* Foods */}
        <View style={styles.section}>
          <Text style={styles.subheading}>Eat more of</Text>
          {phase.foods.map((f) => (
            <FoodItem key={f.name} food={f} phaseColor={phase.color} />
          ))}
        </View>

        {/* Phase supplements */}
        <View style={styles.section}>
          <Text style={styles.subheading}>Phase supplements</Text>
          <View style={styles.supplementList}>
            {phaseSupplements.map((s) => (
              <SupplementCard key={s.name} supplement={s} />
            ))}
          </View>
        </View>

        {/* Core blend accordion */}
        <TouchableOpacity
          style={styles.accordion}
          onPress={() => setCoreExpanded((e) => !e)}
          activeOpacity={0.85}
        >
          <Text style={styles.accordionTitle}>Core blend (all phases)</Text>
          <Text style={styles.accordionChevron}>{coreExpanded ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {coreExpanded && (
          <View style={styles.supplementList}>
            {CORE_BLEND.map((s) => (
              <SupplementCard key={s.name} supplement={s} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E8' },
  scroll: { padding: 20, gap: 20, paddingBottom: 40 },
  phaseStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 9999, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start',
  },
  phaseDot: { width: 8, height: 8, borderRadius: 4 },
  phaseLabel: { fontFamily: 'Inter', fontSize: 13, fontWeight: '600' },
  heading: { fontFamily: 'PlayfairDisplay', fontSize: 28, color: '#2C2825' },
  section: { gap: 4 },
  subheading: { fontFamily: 'Inter', fontSize: 15, fontWeight: '600', color: '#2C2825', marginBottom: 4 },
  supplementList: { gap: 8 },
  accordion: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#E8E2D6',
  },
  accordionTitle: { fontFamily: 'Inter', fontSize: 14, fontWeight: '600', color: '#2C2825' },
  accordionChevron: { fontFamily: 'Inter', fontSize: 12, color: '#6B6460' },
})
