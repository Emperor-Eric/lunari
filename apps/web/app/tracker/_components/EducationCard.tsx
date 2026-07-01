'use client'
import React, { useState } from 'react'
import { EDUCATION_DISCLAIMER, type EducationCard as EduCard } from '@lunari/phase-data'

// Frost-on-flood palette injected by the Today screen so this block matches the
// current phase wash and stays relocatable (same contract as NextUpCard).
export interface EducationSurface {
  ink: string
  sub: string
  gold: string
  cardwash: string
  cardbd: string
  flood: string // the phase flood gradient — backs the opened modal
  phaseLabel: string // e.g. "Menstrual" — small eyebrow context
}

/**
 * Daily micro-education: a tappable teaser (title + one-line hook) on the Today
 * flood surface that opens a full, phase-colored card with the body, a tip, and a
 * short disclaimer. Static content — the host passes the already-selected card.
 */
export function EducationCard({ card, surface }: { card: EduCard; surface: EducationSurface }) {
  const { ink, sub, gold, cardwash, cardbd, flood, phaseLabel } = surface
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* ── Teaser ── */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          width: '100%',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '14px 16px',
          borderRadius: 14,
          background: cardwash,
          border: `1px solid ${cardbd}`,
          cursor: 'pointer',
          font: 'inherit',
        }}
      >
        <div style={{ flex: 1 }}>
          <span
            className="uppercase"
            style={{ fontSize: 9, letterSpacing: '0.22em', color: gold, fontWeight: 600 }}
          >
            Today&rsquo;s insight · {phaseLabel}
          </span>
          <div className="font-display" style={{ fontSize: 16, color: ink, marginTop: 6 }}>
            {card.title}
          </div>
          <div style={{ fontSize: 12, color: sub, marginTop: 3, fontWeight: 300 }}>
            {card.teaser}
          </div>
        </div>
        {/* sparkle affordance */}
        <span
          className="flex items-center justify-center rounded-full"
          style={{
            width: 30,
            height: 30,
            flexShrink: 0,
            border: `1px solid ${gold}`,
            color: gold,
            fontSize: 14,
          }}
        >
          ✦
        </span>
      </button>

      {/* ── Full card (modal) ── */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 440,
              maxHeight: '86vh',
              overflowY: 'auto',
              borderRadius: 22,
              background: flood,
              color: ink,
              border: `1px solid ${gold}`,
              boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
              padding: '26px 24px',
            }}
          >
            <div className="flex items-start justify-between" style={{ gap: 12 }}>
              <span
                className="uppercase"
                style={{ fontSize: 9, letterSpacing: '0.24em', color: gold, fontWeight: 600 }}
              >
                Today&rsquo;s insight · {phaseLabel}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                style={{ fontSize: 20, color: sub, lineHeight: 1, marginTop: -2 }}
              >
                ×
              </button>
            </div>

            <h2
              className="font-display"
              style={{ fontSize: 30, lineHeight: 1.1, color: ink, marginTop: 14 }}
            >
              {card.title}
            </h2>

            <p
              style={{
                fontSize: 13.5,
                lineHeight: 1.7,
                color: ink,
                opacity: 0.92,
                marginTop: 14,
                fontWeight: 300,
              }}
            >
              {card.body}
            </p>

            {/* Today's tip — visually distinct */}
            <div
              style={{
                marginTop: 18,
                padding: '14px 16px',
                borderRadius: 14,
                background: cardwash,
                border: `1px solid ${cardbd}`,
              }}
            >
              <div
                className="uppercase"
                style={{ fontSize: 9, letterSpacing: '0.22em', color: gold, fontWeight: 600 }}
              >
                Today&rsquo;s tip
              </div>
              <p
                style={{
                  fontSize: 12.5,
                  lineHeight: 1.6,
                  color: ink,
                  marginTop: 6,
                  fontWeight: 300,
                }}
              >
                {card.tip}
              </p>
            </div>

            <p style={{ fontSize: 9.5, color: sub, marginTop: 16, lineHeight: 1.5 }}>
              {EDUCATION_DISCLAIMER}
            </p>

            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                marginTop: 18,
                width: '100%',
                padding: '11px 0',
                borderRadius: 999,
                background: 'transparent',
                color: gold,
                border: `1px solid ${gold}`,
                fontSize: 12,
                letterSpacing: '0.06em',
                fontWeight: 600,
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
