import React from 'react'

interface Props {
  value: number | null
  onChange: (v: number) => void
}

const MOODS = [
  { value: 1, emoji: '😞', label: 'Rough' },
  { value: 2, emoji: '😐', label: 'Okay' },
  { value: 3, emoji: '🙂', label: 'Good' },
  { value: 4, emoji: '😊', label: 'Great' },
  { value: 5, emoji: '🌟', label: 'Amazing' },
]

export const MoodPicker: React.FC<Props> = ({ value, onChange }) => {
  return (
    <div className="flex gap-2">
      {MOODS.map((mood) => (
        <button
          key={mood.value}
          onClick={() => onChange(mood.value)}
          className={`flex flex-col items-center gap-1 flex-1 py-2 px-1 rounded-xl border-2 transition-all ${
            value === mood.value
              ? 'bg-white border-brand-gold'
              : 'bg-brand-cream border-transparent'
          }`}
        >
          <span className="text-2xl">{mood.emoji}</span>
          <span className={`text-xs font-medium ${value === mood.value ? 'text-brand-ink' : 'text-brand-ink-soft'}`}>
            {mood.label}
          </span>
        </button>
      ))}
    </div>
  )
}
