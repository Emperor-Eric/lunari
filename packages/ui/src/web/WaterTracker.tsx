import React from 'react'

interface Props {
  value: number
  onChange: (v: number) => void
}

export const WaterTracker: React.FC<Props> = ({ value, onChange }) => {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-brand-ink">Water — {value}/8 glasses</span>
      <div className="flex gap-1.5">
        {Array.from({ length: 8 }, (_, i) => i + 1).map((g) => (
          <button
            key={g}
            onClick={() => onChange(g === value ? g - 1 : g)}
            className="flex-1 text-xl transition-opacity"
            style={{ opacity: g <= value ? 1 : 0.25 }}
          >
            🥛
          </button>
        ))}
      </div>
    </div>
  )
}
