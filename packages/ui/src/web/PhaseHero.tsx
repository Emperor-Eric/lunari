import React from 'react'
import type { Phase } from '@lunari/types'

interface Props {
  phase: Phase
  cycleDay: number
  onPress?: () => void
}

const PHASE_ORDER: Phase['id'][] = ['menstrual', 'follicular', 'ovulatory', 'luteal']

export const PhaseHero: React.FC<Props> = ({ phase, cycleDay, onPress }) => {
  return (
    <div
      className="relative rounded-2xl p-6 cursor-pointer select-none"
      style={{ backgroundColor: phase.color }}
      onClick={onPress}
    >
      {/* Day badge */}
      <span className="absolute top-4 right-4 bg-white/25 text-white text-xs font-medium px-3 py-1 rounded-full">
        Day {cycleDay}
      </span>

      {/* Phase name */}
      <h2 className="font-display text-white text-2xl font-medium mt-2 mb-2">
        {phase.name}
      </h2>
      <p className="font-body text-white/85 text-sm mb-5 leading-snug">{phase.tagline}</p>

      {/* Progress bars */}
      <div className="flex gap-1.5">
        {PHASE_ORDER.map((id) => (
          <div
            key={id}
            className="flex-1 h-0.5 rounded-full bg-white"
            style={{ opacity: id === phase.id ? 1 : 0.3 }}
          />
        ))}
      </div>
    </div>
  )
}
