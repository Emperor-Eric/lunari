import React from 'react'
import type { Workout } from '@lunari/types'

interface Props {
  workout: Workout
}

const INTENSITY_COLOR: Record<Workout['intensity'], string> = {
  low: '#3D6B4A',
  moderate: '#7A4A2A',
  high: '#5B3E8C',
}

export const WorkoutCard: React.FC<Props> = ({ workout }) => {
  const color = INTENSITY_COLOR[workout.intensity]
  return (
    <div className="bg-white rounded-xl p-4 border border-brand-stone flex flex-col gap-1.5">
      <div className="flex justify-between items-start gap-2">
        <span className="text-sm font-semibold text-brand-ink">{workout.title}</span>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize shrink-0"
          style={{ backgroundColor: color + '20', color }}
        >
          {workout.intensity}
        </span>
      </div>
      <span className="text-xs text-brand-ink-soft">{workout.duration}</span>
      <p className="text-xs text-brand-ink-soft leading-snug">{workout.description}</p>
    </div>
  )
}
