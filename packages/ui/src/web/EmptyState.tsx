import React from 'react'

interface Props {
  title: string
  subtitle: string
}

export const EmptyState: React.FC<Props> = ({ title, subtitle }) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 gap-3 text-center">
      <span className="text-5xl">🌙</span>
      <h3 className="font-display text-xl text-brand-ink">{title}</h3>
      <p className="text-sm text-brand-ink-soft max-w-xs leading-relaxed">{subtitle}</p>
    </div>
  )
}
