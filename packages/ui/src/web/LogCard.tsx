import React from 'react'
import { format } from 'date-fns'
import type { SymptomLog } from '@lunari/types'
import { getPhaseById, FLOW_OPTIONS, flowIntensity } from '@lunari/phase-data'

interface Props {
  log: SymptomLog
  onPress?: () => void
}

export const LogCard: React.FC<Props> = ({ log, onPress }) => {
  const phase = getPhaseById(log.phase)
  const flowLabel = log.flow ? FLOW_OPTIONS.find((o) => o.value === log.flow)?.label : null
  const flowShown = log.flow && log.flow !== 'none'
  const flowDot = 5 + flowIntensity(log.flow) * 2

  return (
    <div
      onClick={onPress}
      className={`flex rounded-xl overflow-hidden border border-brand-stone bg-white ${onPress ? 'cursor-pointer hover:shadow-sm transition-shadow' : ''}`}
    >
      <div className="w-1" style={{ backgroundColor: phase.color }} />
      <div className="flex-1 p-3.5 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-brand-ink">
            {format(new Date(log.loggedAt), 'MMM d')}
          </span>
          <span className="text-xs text-brand-ink-soft">Day {log.cycleDay}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {log.symptoms.slice(0, 3).map((s) => (
            <span
              key={s}
              className="px-2 py-0.5 rounded-full text-xs font-medium border"
              style={{ borderColor: phase.color, color: phase.color }}
            >
              {s}
            </span>
          ))}
          {log.symptoms.length > 3 && (
            <span className="text-xs text-brand-ink-soft self-center">
              +{log.symptoms.length - 3}
            </span>
          )}
        </div>
        {flowShown && (
          <div className="flex items-center gap-1.5">
            <span
              style={{
                width: flowDot,
                height: flowDot,
                borderRadius: 9999,
                background: phase.color,
                opacity: 0.35 + flowIntensity(log.flow) * 0.16,
              }}
            />
            <span className="text-xs" style={{ color: phase.color }}>
              {flowLabel} flow
            </span>
          </div>
        )}
        {log.journalNote && (
          <p className="text-xs text-brand-ink-soft italic truncate">{log.journalNote}</p>
        )}
      </div>
    </div>
  )
}
