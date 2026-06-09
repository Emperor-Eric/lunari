import React from 'react'
import type { FoodItem as FoodItemType } from '@lunari/types'

interface Props {
  food: FoodItemType
  phaseColor?: string
}

export const FoodItem: React.FC<Props> = ({ food, phaseColor = '#C9A84C' }) => {
  return (
    <div className="flex gap-3 py-2.5 border-b border-brand-stone last:border-0">
      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: phaseColor }} />
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-brand-ink">{food.name}</span>
        <span className="text-xs text-brand-ink-soft leading-snug">{food.reason}</span>
      </div>
    </div>
  )
}
