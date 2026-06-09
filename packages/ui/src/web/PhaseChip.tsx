import React from 'react'
import type { PhaseId } from '@lunari/types'
import { getPhaseById } from '@lunari/phase-data'

interface Props {
  phase: PhaseId
}

export const PhaseChip: React.FC<Props> = ({ phase }) => {
  const phaseData = getPhaseById(phase)
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: phaseData.lightColor, color: phaseData.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: phaseData.color }} />
      {phaseData.name}
    </span>
  )
}
