import React from 'react'
import type { Phase } from '@lunari/types'
import { getAllPhases } from '@lunari/phase-data'

interface Props {
  phase: Phase
  currentDay: number
}

export const ContainerRow: React.FC<Props> = ({ phase }) => {
  const allPhases = getAllPhases()

  return (
    <div className="flex gap-3 overflow-x-auto py-2">
      {allPhases.map((p) => {
        const isActive = p.id === phase.id
        return (
          <div
            key={p.id}
            className="relative flex flex-col items-center justify-center rounded-xl bg-white border-2 p-4 min-w-[80px] transition-all"
            style={{
              borderColor: isActive ? p.color : 'transparent',
              opacity: isActive ? 1 : 0.45,
              transform: isActive ? 'scale(1.05)' : 'scale(1)',
              boxShadow: isActive ? `0 4px 16px ${p.color}30` : 'none',
            }}
          >
            {isActive && (
              <span
                className="absolute -top-3 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: p.color }}
              >
                Now
              </span>
            )}
            <span
              className="font-display text-5xl leading-none"
              style={{ color: isActive ? p.color : '#2C2825' }}
            >
              {p.containerNumber}
            </span>
            <span className="font-body text-xs text-brand-ink-soft mt-1">{p.name}</span>
          </div>
        )
      })}
    </div>
  )
}
