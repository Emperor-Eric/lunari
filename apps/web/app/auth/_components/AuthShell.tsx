import React from 'react'

// Shared, on-brand auth chrome — Marcellus wordmark, Raleway body, brand neutrals
// with gold accents, and a restrained celestial ring motif. Keeps the login / signup
// / forgot-password screens visually identical siblings of the redesigned tracker.

export const inputClass =
  'w-full rounded-xl border border-brand-stone bg-brand-cream px-4 py-3 font-body text-sm text-brand-ink placeholder-brand-ink-soft focus:outline-none focus:border-brand-gold transition-colors'

export function AuthShell({ subtitle, children }: { subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center p-6">
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-brand-stone bg-white p-8">
        {/* restrained celestial motif — faint gold rings bleeding off the top-right */}
        <svg
          className="pointer-events-none absolute"
          style={{ right: -46, top: -46, width: 150, height: 150 }}
          viewBox="0 0 150 150"
          fill="none"
          aria-hidden
        >
          <circle cx="75" cy="75" r="74" stroke="#C9A84C" strokeOpacity="0.2" strokeWidth="1" />
          <circle cx="75" cy="75" r="56" stroke="#C9A84C" strokeOpacity="0.12" strokeWidth="1" />
        </svg>

        <div className="relative flex flex-col gap-5">
          <div className="text-center">
            <span className="font-display lowercase text-4xl tracking-[0.04em] text-brand-ink">
              lunari
            </span>
            <p className="font-body text-sm text-brand-ink-soft mt-2">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-brand-stone" />
      <span className="font-body text-xs text-brand-ink-soft">{label}</span>
      <div className="flex-1 h-px bg-brand-stone" />
    </div>
  )
}

export function Field({ error, children }: { error?: string; children: React.ReactNode }) {
  return (
    <div>
      {children}
      {error && <p className="font-body text-xs text-phase-menstrual mt-1">{error}</p>}
    </div>
  )
}
