'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@lunari/utils'
import { getPhaseById, getPhaseForDay } from '@lunari/phase-data'
import { phases as phaseTheme, phaseKeyFor } from '@lunari/design-tokens'
import { Toast } from '@lunari/ui'
import { apiGet, apiDelete } from '@/src/lib/api'
import { useCycleContext } from '../cycle-context'

// Swap this for the real policy URL when it exists. Empty string → "coming soon".
const PRIVACY_POLICY_URL = ''

const N = { section: '#A99E88', text: '#2C2825', sub: '#8A8275' }
const MAROON = '#7A1E2E'

export default function PrivacyPage() {
  const { signOut } = useAuth()
  const { cycleData } = useCycleContext()
  const phase = cycleData ? getPhaseById(cycleData.phase) : getPhaseForDay(1)
  const t = phaseTheme[phaseKeyFor(phase.id)]

  const [exporting, setExporting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const flash = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), type === 'error' ? 2800 : 2000)
  }

  const exportData = async () => {
    setExporting(true)
    try {
      const data = await apiGet('/me/export')
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'lunari-data.json'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      flash('Your data has been downloaded', 'success')
    } catch {
      flash("Couldn't export — try again", 'error')
    } finally {
      setExporting(false)
    }
  }

  const deleteAccount = async () => {
    setDeleting(true)
    try {
      await apiDelete('/me')
      await signOut()
      window.location.assign('/auth/login')
    } catch {
      flash("Couldn't delete — try again", 'error')
      setDeleting(false)
    }
  }

  const card: React.CSSProperties = {
    background: t.labCard,
    border: `1px solid ${t.labBorder}`,
    borderRadius: 13,
    padding: 16,
  }
  const sectionLabel: React.CSSProperties = {
    fontSize: 9,
    letterSpacing: '0.2em',
    color: N.section,
    margin: '24px 0 11px',
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: t.labBg }}>
      {/* ── HEADER BAND (phase gradient) ── */}
      <div
        className="relative overflow-hidden"
        style={{ background: t.header, color: t.headerText }}
      >
        <svg
          className="absolute pointer-events-none"
          style={{ right: -34, top: -22, width: 130, height: 130 }}
          viewBox="0 0 130 130"
          fill="none"
          aria-hidden
        >
          <circle
            cx="65"
            cy="65"
            r="64"
            stroke={t.headerLabel}
            strokeOpacity="0.25"
            strokeWidth="1"
          />
        </svg>
        <div
          className="relative max-w-2xl mx-auto px-6 md:px-10"
          style={{ paddingTop: 18, paddingBottom: 24 }}
        >
          <Link
            href="/tracker/profile"
            className="font-body"
            style={{ fontSize: 11, color: t.headerLabel }}
          >
            ← Me
          </Link>
          <h1 className="font-display" style={{ fontSize: 30, marginTop: 12, color: t.headerText }}>
            Privacy &amp; data
          </h1>
          <div
            className="font-body"
            style={{
              fontSize: 12,
              marginTop: 4,
              fontWeight: 300,
              color: t.headerText,
              opacity: 0.72,
            }}
          >
            what we keep, and your control over it
          </div>
        </div>
      </div>

      {/* ── TINTED BODY ── */}
      <div className="max-w-2xl mx-auto px-6 md:px-10 pt-6 pb-12 font-body">
        {/* a) Plain-language data summary */}
        <div className="uppercase" style={sectionLabel}>
          Your data
        </div>
        <div style={card}>
          <p style={{ fontSize: 13, color: N.text, fontWeight: 300, lineHeight: 1.6 }}>
            Lunari stores your account email and the cycle and check-in data you log — your period
            dates, symptoms, mood, energy, sleep and notes. We keep it to power your tracker and
            predictions. We don&apos;t sell your data.
          </p>
          <p
            style={{ fontSize: 12, color: N.sub, fontWeight: 300, lineHeight: 1.6, marginTop: 10 }}
          >
            Your data lives in our database, hosted on Supabase. You can download a copy or delete
            your account and data at any time below.
          </p>
        </div>

        {/* b) Privacy policy */}
        <div className="uppercase" style={sectionLabel}>
          Privacy policy
        </div>
        <div style={card}>
          {PRIVACY_POLICY_URL ? (
            <a
              href={PRIVACY_POLICY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between"
              style={{ fontSize: 14, color: N.text }}
            >
              <span className="font-display" style={{ fontSize: 15.5 }}>
                Read our privacy policy
              </span>
              <span style={{ color: t.accent, fontSize: 13, fontWeight: 600 }}>Open ↗</span>
            </a>
          ) : (
            <div className="flex items-center justify-between">
              <span className="font-display" style={{ fontSize: 15.5, color: N.text }}>
                Privacy policy
              </span>
              <span
                className="uppercase"
                style={{
                  fontSize: 8.5,
                  letterSpacing: '0.12em',
                  color: N.section,
                  border: `1px solid ${t.labBorder}`,
                  borderRadius: 999,
                  padding: '4px 9px',
                }}
              >
                Coming soon
              </span>
            </div>
          )}
        </div>

        {/* c) Export */}
        <div className="uppercase" style={sectionLabel}>
          Export
        </div>
        <div style={card}>
          <div className="flex items-center justify-between" style={{ gap: 12 }}>
            <div>
              <div className="font-display" style={{ fontSize: 15.5, color: N.text }}>
                Export my data
              </div>
              <div style={{ fontSize: 11, color: N.sub, fontWeight: 300, marginTop: 2 }}>
                Download everything we store as a JSON file
              </div>
            </div>
            <button
              onClick={exportData}
              disabled={exporting}
              style={{
                background: t.accent,
                color: t.headerText,
                borderRadius: 11,
                padding: '9px 16px',
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                opacity: exporting ? 0.6 : 1,
              }}
            >
              {exporting ? 'Preparing…' : 'Download'}
            </button>
          </div>
        </div>

        {/* d) Delete account — destructive, confirm-gated */}
        <div className="uppercase" style={sectionLabel}>
          Danger zone
        </div>
        <div style={card}>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="font-display"
              style={{ fontSize: 15.5, color: MAROON }}
            >
              Delete my account &amp; data
            </button>
          ) : (
            <>
              <div style={{ fontSize: 12, color: N.text, fontWeight: 300, lineHeight: 1.5 }}>
                This permanently deletes your account and all your data — cycle, periods, logs and
                settings. This can&apos;t be undone. Continue?
              </div>
              <div className="flex" style={{ gap: 8, marginTop: 12 }}>
                <button
                  onClick={deleteAccount}
                  disabled={deleting}
                  style={{
                    background: MAROON,
                    color: '#FBF6EC',
                    borderRadius: 11,
                    padding: '8px 16px',
                    fontSize: 12,
                    fontWeight: 600,
                    opacity: deleting ? 0.6 : 1,
                  }}
                >
                  {deleting ? 'Deleting…' : 'Delete everything'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  style={{
                    background: 'transparent',
                    color: N.text,
                    border: `1px solid ${t.labBorder}`,
                    borderRadius: 11,
                    padding: '8px 14px',
                    fontSize: 12,
                  }}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  )
}
