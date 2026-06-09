import React from 'react'

interface Props {
  total: number
  current: number
  phaseColor?: string
}

export const OnboardingProgress: React.FC<Props> = ({ total, current, phaseColor = '#C9A84C' }) => {
  return (
    <div className="flex justify-center gap-1.5 py-3">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full transition-all"
          style={{ backgroundColor: i < current ? phaseColor : '#E8E2D6' }}
        />
      ))}
    </div>
  )
}
