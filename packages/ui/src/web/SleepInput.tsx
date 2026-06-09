import React from 'react'

interface Props {
  value: number
  onChange: (v: number) => void
}

export const SleepInput: React.FC<Props> = ({ value, onChange }) => {
  const decrement = () => onChange(Math.max(0, Math.round((value - 0.5) * 2) / 2))
  const increment = () => onChange(Math.min(12, Math.round((value + 0.5) * 2) / 2))

  return (
    <div className="flex justify-between items-center">
      <span className="text-sm font-medium text-brand-ink">Sleep</span>
      <div className="flex items-center gap-4 bg-brand-cream rounded-xl px-3 py-1.5">
        <button
          onClick={decrement}
          className="w-8 h-8 rounded-full bg-white border border-brand-stone flex items-center justify-center text-lg text-brand-ink hover:bg-brand-stone transition-colors"
        >
          −
        </button>
        <span className="font-mono text-sm text-brand-ink w-14 text-center">{value} hrs</span>
        <button
          onClick={increment}
          className="w-8 h-8 rounded-full bg-white border border-brand-stone flex items-center justify-center text-lg text-brand-ink hover:bg-brand-stone transition-colors"
        >
          +
        </button>
      </div>
    </div>
  )
}
