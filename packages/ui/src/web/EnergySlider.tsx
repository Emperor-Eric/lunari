import React from 'react'

interface Props {
  value: number
  onChange: (v: number) => void
  phaseColor: string
}

export const EnergySlider: React.FC<Props> = ({ value, onChange, phaseColor }) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-brand-ink">Energy level</label>
        <span
          className="text-xs font-mono text-white px-2.5 py-1 rounded-full"
          style={{ backgroundColor: phaseColor }}
        >
          {value}/10
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${phaseColor} 0%, ${phaseColor} ${(value - 1) * 11.11}%, #E8E2D6 ${(value - 1) * 11.11}%, #E8E2D6 100%)`,
        }}
      />
      <div className="flex justify-between">
        <span className="text-xs text-brand-ink-soft">1</span>
        <span className="text-xs text-brand-ink-soft">10</span>
      </div>
    </div>
  )
}
