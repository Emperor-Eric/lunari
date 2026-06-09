import React from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  maxLength?: number
}

export const JournalInput: React.FC<Props> = ({ value, onChange, maxLength = 500 }) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between">
        <label className="text-sm font-medium text-brand-ink">Journal</label>
        <span className="text-xs text-brand-ink-soft">{value.length}/{maxLength}</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        rows={4}
        placeholder="How are you really feeling today..."
        className="w-full rounded-xl border-2 border-brand-stone bg-white p-3.5 text-sm text-brand-ink placeholder-brand-ink-soft resize-none focus:outline-none focus:border-brand-gold transition-colors"
      />
    </div>
  )
}
