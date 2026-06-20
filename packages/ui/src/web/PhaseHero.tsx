import React from 'react'
import type { Phase } from '@lunari/types'

interface Props {
  phase: Phase
  cycleDay: number
  onPress?: () => void
}

const PHASE_ORDER: Phase['id'][] = ['menstrual', 'follicular', 'ovulatory', 'luteal']

// Sanctuary (navy/gold) tokens — kept literal so @lunari/ui stays app-agnostic.
const INK = '#F5EBD6'
const MUTED = '#8BA0C4'
const GOLD = '#C9A84C'

/**
 * Dark-friendly, gold-framed phase card for the navy onboarding wash. The phase
 * colour reads as an ACCENT (a gold-ringed orb + the active progress bar) over a
 * frosted translucent card, so all four phases stay legible on navy.
 */
export const PhaseHero: React.FC<Props> = ({ phase, cycleDay, onPress }) => {
  return (
    <div
      className="relative rounded-2xl p-6 cursor-pointer select-none overflow-hidden"
      style={{ background: 'rgba(245,235,214,0.06)', border: '1px solid rgba(201,168,76,0.45)' }}
      onClick={onPress}
    >
      {/* Day badge */}
      <span
        className="absolute top-4 right-4 font-body text-xs px-3 py-1 rounded-full"
        style={{ background: 'rgba(201,168,76,0.15)', color: GOLD }}
      >
        Day {cycleDay}
      </span>

      {/* Phase accent orb — phase colour inside a gold ring */}
      <div
        className="rounded-full mb-3"
        style={{ width: 30, height: 30, background: phase.color, border: `1.5px solid ${GOLD}` }}
      />

      {/* Phase name */}
      <h2 className="font-display text-2xl mb-2" style={{ color: INK }}>
        {phase.name}
      </h2>
      <p className="font-body text-sm mb-5 leading-snug" style={{ color: MUTED }}>
        {phase.tagline}
      </p>

      {/* Progress bars — active bar carries the phase colour */}
      <div className="flex gap-1.5">
        {PHASE_ORDER.map((id) => (
          <div
            key={id}
            className="flex-1 h-0.5 rounded-full"
            style={{ background: id === phase.id ? phase.color : 'rgba(245,235,214,0.2)' }}
          />
        ))}
      </div>
    </div>
  )
}
