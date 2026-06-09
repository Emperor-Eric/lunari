import React from 'react'

interface Props {
  symptoms: string[]
  selected: string[]
  onToggle: (s: string) => void
  phaseColor: string
}

export const SymptomGrid: React.FC<Props> = ({ symptoms, selected, onToggle, phaseColor }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {symptoms.map((symptom) => {
        const active = selected.includes(symptom)
        return (
          <button
            key={symptom}
            onClick={() => onToggle(symptom)}
            className="px-3.5 py-2 rounded-full border-2 text-sm font-medium transition-all"
            style={{
              backgroundColor: active ? phaseColor : '#FFFFFF',
              borderColor: active ? phaseColor : '#E8E2D6',
              color: active ? '#FFFFFF' : '#2C2825',
            }}
          >
            {symptom}
          </button>
        )
      })}
    </div>
  )
}
