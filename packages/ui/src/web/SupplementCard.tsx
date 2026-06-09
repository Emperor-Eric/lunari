import React from 'react'
import type { Supplement } from '@lunari/types'

interface Props {
  supplement: Supplement
}

export const SupplementCard: React.FC<Props> = ({ supplement }) => {
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl p-3.5 border border-brand-stone">
      <div className="flex-1 flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-brand-ink">{supplement.name}</span>
        <span className="text-xs text-brand-ink-soft leading-snug">{supplement.purpose}</span>
      </div>
      <span className="font-mono text-xs font-medium text-brand-ink bg-brand-cream px-2.5 py-1.5 rounded-lg whitespace-nowrap">
        {supplement.dosage}
      </span>
    </div>
  )
}
