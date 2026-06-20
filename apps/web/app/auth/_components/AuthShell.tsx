import React from 'react'

// ─── Sanctuary (navy + gold) auth theme — EXACT tokens, auth/entrance screens only ──
export const NAVY_GRADIENT = 'linear-gradient(168deg, #16385f 0%, #0d1f3d 58%, #091830 100%)'
export const INK = '#F5EBD6' // primary text / cream
export const MUTED = '#8BA0C4' // muted subtext
export const GOLD = '#C9A84C' // links, outlines, dividers
export const BTN_TEXT = '#102B53' // text on the gold primary button
const ERROR = '#E5A3A3' // soft rose — legible on navy

// Dark-theme field: translucent fill, cream text, gold focus ring.
export const darkInputClass =
  'w-full rounded-xl px-4 py-3 font-body text-sm text-[#F5EBD6] placeholder-[#8BA0C4] bg-[rgba(245,235,214,0.06)] border border-[rgba(201,168,76,0.35)] focus:outline-none focus:border-[#C9A84C] focus:shadow-[0_0_0_3px_rgba(201,168,76,0.20)] transition'

export function AuthShell({
  subtitle,
  children,
}: {
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden p-6"
      style={{ background: NAVY_GRADIENT }}
    >
      {/* restrained celestial layer — faint orbital arc + a few gold sparkles */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden
        preserveAspectRatio="xMidYMid slice"
      >
        <circle
          cx="50%"
          cy="42%"
          r="320"
          fill="none"
          stroke={GOLD}
          strokeOpacity="0.06"
          strokeWidth="1"
        />
        <circle
          cx="50%"
          cy="42%"
          r="210"
          fill="none"
          stroke={GOLD}
          strokeOpacity="0.05"
          strokeWidth="1"
        />
        <g fill={GOLD}>
          <circle cx="18%" cy="22%" r="1.3" opacity="0.5" />
          <circle cx="82%" cy="30%" r="1.1" opacity="0.4" />
          <circle cx="74%" cy="68%" r="1.4" opacity="0.45" />
          <circle cx="24%" cy="74%" r="1" opacity="0.35" />
          <circle cx="88%" cy="52%" r="1" opacity="0.3" />
          <circle cx="12%" cy="48%" r="1.1" opacity="0.35" />
        </g>
      </svg>

      <div className="relative w-full max-w-sm flex flex-col items-center text-center gap-5">
        {/* Goddess seal → script wordmark → tagline → gold rule */}
        <img
          src="/brand/seal-gold.png"
          alt=""
          width={76}
          height={76}
          style={{ width: 76, height: 76 }}
        />
        <img
          src="/brand/wordmark-gold.png"
          alt="lunari"
          width={176}
          height={48}
          style={{ width: 176, height: 'auto', marginTop: -2 }}
        />
        <p
          className="font-body uppercase"
          style={{ color: MUTED, fontSize: 11, letterSpacing: '0.32em' }}
        >
          Fuelled for every phase
        </p>
        <div style={{ width: 56, height: 1, background: GOLD, opacity: 0.6 }} />

        {subtitle && (
          <p className="font-body" style={{ color: MUTED, fontSize: 13, marginTop: -2 }}>
            {subtitle}
          </p>
        )}

        <div className="w-full flex flex-col gap-3.5">{children}</div>
      </div>
    </div>
  )
}

// ─── Reusable dark-theme primitives ──────────────────────────────────────────

export function GoldButton({
  children,
  onClick,
  type = 'button',
  disabled,
}: {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full py-3.5 rounded-xl font-body text-sm font-semibold disabled:opacity-60 transition-opacity"
      style={{ background: GOLD, color: BTN_TEXT }}
    >
      {children}
    </button>
  )
}

export function OutlineButton({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full py-3.5 rounded-xl font-body text-sm font-semibold transition-colors hover:bg-[rgba(201,168,76,0.08)]"
      style={{ background: 'transparent', border: `1px solid ${GOLD}`, color: GOLD }}
    >
      {children}
    </button>
  )
}

export function Field({ error, children }: { error?: string; children: React.ReactNode }) {
  return (
    <div className="text-left">
      {children}
      {error && (
        <p className="font-body" style={{ color: ERROR, fontSize: 12, marginTop: 4 }}>
          {error}
        </p>
      )}
    </div>
  )
}
