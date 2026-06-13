'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getPhaseForDay, getPhaseById } from '@lunari/phase-data'
import { phases as phaseTheme, phaseKeyFor } from '@lunari/design-tokens'
import { useCycleContext } from '../../cycle-context'

// Mirrors the mobile Log Today/History segmented control: a pill track tinted with
// the phase accent, the active tab filled with the header ink + light text.
const TABS = [
  { label: 'Today', href: '/tracker/log' },
  { label: 'History', href: '/tracker/log/history' },
] as const

export function LogTabs() {
  const pathname = usePathname()
  const { cycleData } = useCycleContext()
  const phase = cycleData ? getPhaseById(cycleData.phase) : getPhaseForDay(1)
  const t = phaseTheme[phaseKeyFor(phase.id)]

  return (
    <div
      className="flex"
      style={{ marginTop: 14, width: '100%', maxWidth: 280, background: `${t.accent}1F`, borderRadius: 9999, padding: 3 }}
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex-1 text-center font-body"
            style={{
              padding: '7px 0',
              borderRadius: 9999,
              fontSize: 11.5,
              fontWeight: 600,
              background: active ? t.headerText : 'transparent',
              color: active ? t.labBg : t.headerText,
            }}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
