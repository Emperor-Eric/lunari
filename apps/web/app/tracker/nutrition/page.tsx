'use client'
import React, { useState } from 'react'
import { FoodItem, SupplementCard } from '@lunari/ui'
import { getPhaseForDay } from '@lunari/phase-data'
import { useCycleContext } from '../layout'

const CORE_BLEND = [
  { name: 'Myo-Inositol', dosage: '3500mg', purpose: 'Hormonal balance and insulin sensitivity' },
  { name: 'Inulin', dosage: '1000mg', purpose: 'Prebiotic gut support' },
  { name: 'L-Glycine', dosage: '500mg', purpose: 'Sleep quality and collagen synthesis' },
  { name: 'Magnesium Hybrid', dosage: '200mg', purpose: 'Muscle relaxation and sleep' },
  { name: 'Omega-3 Algal', dosage: '300mg', purpose: 'Anti-inflammation and brain health' },
  { name: 'Vitamin D3', dosage: '1000 IU', purpose: 'Immune function and mood regulation' },
  { name: 'Zinc Citrate', dosage: '15mg', purpose: 'Immune support and skin clarity' },
]

export default function NutritionPage() {
  const { cycleData } = useCycleContext()
  const phase = cycleData ? getPhaseForDay(cycleData.day) : getPhaseForDay(1)
  const [coreOpen, setCoreOpen] = useState(false)
  const phaseSupplements = phase.supplements.slice(8)

  return (
    <div className="max-w-3xl mx-auto p-6 flex flex-col gap-6">
      <div
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-semibold self-start"
        style={{ backgroundColor: phase.lightColor, color: phase.color }}
      >
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: phase.color }} />
        {phase.name} phase
      </div>

      <h1 className="font-display text-3xl text-brand-ink">Fuel</h1>

      {/* 2-column desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Foods */}
        <div>
          <h2 className="text-base font-semibold text-brand-ink mb-3">Eat more of</h2>
          <div className="bg-white rounded-xl p-4 border border-brand-stone">
            {phase.foods.map((f) => (
              <FoodItem key={f.name} food={f} phaseColor={phase.color} />
            ))}
          </div>
        </div>

        {/* Supplements */}
        <div>
          <h2 className="text-base font-semibold text-brand-ink mb-3">Phase supplements</h2>
          <div className="flex flex-col gap-2">
            {phaseSupplements.map((s) => (
              <SupplementCard key={s.name} supplement={s} />
            ))}
          </div>
        </div>
      </div>

      {/* Core blend accordion */}
      <div>
        <button
          onClick={() => setCoreOpen((o) => !o)}
          className="w-full flex justify-between items-center bg-white rounded-xl p-4 border border-brand-stone text-sm font-semibold text-brand-ink"
        >
          Core blend (all phases)
          <span className="text-brand-ink-soft">{coreOpen ? '▲' : '▼'}</span>
        </button>
        {coreOpen && (
          <div className="flex flex-col gap-2 mt-2">
            {CORE_BLEND.map((s) => (
              <SupplementCard key={s.name} supplement={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
