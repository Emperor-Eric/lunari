'use client'
import React, { useEffect, useState } from 'react'

interface Props {
  message: string
  type: 'success' | 'error'
}

export const Toast: React.FC<Props> = ({ message, type }) => {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 3000)
    return () => clearTimeout(t)
  }, [message])

  if (!visible) return null

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full text-white text-sm font-medium shadow-lg transition-all ${
        type === 'error' ? 'bg-phase-menstrual' : 'bg-phase-follicular'
      }`}
    >
      {message}
    </div>
  )
}
