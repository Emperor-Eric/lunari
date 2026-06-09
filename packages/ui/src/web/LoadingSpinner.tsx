import React from 'react'

interface Props {
  phaseColor?: string
}

export const LoadingSpinner: React.FC<Props> = ({ phaseColor = '#C9A84C' }) => {
  return (
    <div className="flex items-center justify-center p-8">
      <div
        className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: phaseColor, borderTopColor: 'transparent' }}
      />
    </div>
  )
}
