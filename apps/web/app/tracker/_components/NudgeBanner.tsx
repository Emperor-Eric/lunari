'use client'
import React from 'react'
import type { NotificationItem } from '@lunari/types'

// Frost-on-flood palette injected by the Today screen (same contract as NextUpCard /
// EducationCard) so the nudge reads on all four phase washes.
export interface NudgeSurface {
  ink: string
  sub: string
  gold: string
  cardwash: string
  cardbd: string
}

/**
 * A single gentle in-app nudge (phase change / period approaching) on the Today
 * flood surface. Session-dismissible — the host owns the dismiss state.
 */
export function NudgeBanner({
  item,
  surface,
  onDismiss,
  onActivate,
}: {
  item: NotificationItem
  surface: NudgeSurface
  onDismiss: () => void
  onActivate?: () => void // when set, tapping the body triggers it (e.g. open Insights)
}) {
  const { ink, sub, gold, cardwash, cardbd } = surface
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '13px 15px',
        borderRadius: 14,
        background: cardwash,
        border: `1px solid ${cardbd}`,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: gold,
          marginTop: 6,
          flexShrink: 0,
        }}
      />
      <div
        onClick={onActivate}
        role={onActivate ? 'button' : undefined}
        style={{ flex: 1, textAlign: 'left', cursor: onActivate ? 'pointer' : 'default' }}
      >
        <div
          className="uppercase"
          style={{ fontSize: 9, letterSpacing: '0.22em', color: gold, fontWeight: 600 }}
        >
          {item.title}
        </div>
        <div style={{ fontSize: 12.5, color: ink, marginTop: 4, fontWeight: 300 }}>{item.body}</div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{ fontSize: 16, color: sub, lineHeight: 1, marginTop: -1 }}
      >
        ×
      </button>
    </div>
  )
}
