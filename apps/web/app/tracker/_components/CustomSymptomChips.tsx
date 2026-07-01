'use client'
import React, { useState } from 'react'
import type { CustomSymptom } from '@lunari/types'

export interface ChipTheme {
  active: React.CSSProperties // chip when selected
  idle: React.CSSProperties // chip when not selected
  dot: string // small "custom" indicator dot colour
  accent: string // "+ Add" text + input border
  inputBg: string
  inputText: string
}

/**
 * Renders the user's custom-symptom chips (visually consistent with built-ins but
 * marked with a small dot) plus an inline "+ Add" affordance. Returns a fragment so it
 * drops straight into an existing chip flex row. Toggling stores the plain label, so it
 * saves through the same POST /me/logs as built-in symptoms.
 */
export function CustomSymptomChips({
  custom,
  builtins,
  selected,
  onToggle,
  onAdd,
  theme,
  chipClassName,
}: {
  custom: CustomSymptom[]
  builtins: string[]
  selected: string[]
  onToggle: (label: string) => void
  onAdd: (label: string) => Promise<CustomSymptom>
  theme: ChipTheme
  chipClassName?: string
}) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)

  // Skip custom labels that duplicate a built-in already shown in this row.
  const builtinSet = new Set(builtins.map((b) => b.toLowerCase()))
  const shown = custom.filter((c) => !builtinSet.has(c.label.toLowerCase()))

  const submit = async () => {
    const label = draft.trim()
    if (!label) {
      setAdding(false)
      return
    }
    setBusy(true)
    try {
      const created = await onAdd(label)
      onToggle(created.label) // select the new one immediately
      setDraft('')
      setAdding(false)
    } catch {
      /* dupe / error — keep the input open so the user can adjust */
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {shown.map((c) => {
        const on = selected.includes(c.label)
        return (
          <button
            key={c.id}
            onClick={() => onToggle(c.label)}
            className={chipClassName}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              ...(on ? theme.active : theme.idle),
            }}
          >
            <span
              style={{
                width: 4,
                height: 4,
                borderRadius: 999,
                background: on ? 'currentColor' : theme.dot,
              }}
            />
            {c.label}
          </button>
        )
      })}

      {adding ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={submit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
            if (e.key === 'Escape') {
              setDraft('')
              setAdding(false)
            }
          }}
          disabled={busy}
          placeholder="New symptom"
          maxLength={30}
          style={{
            fontSize: 10.5,
            padding: '6px 12px',
            borderRadius: 18,
            background: theme.inputBg,
            color: theme.inputText,
            border: `1px solid ${theme.accent}`,
            outline: 'none',
            width: 120,
          }}
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className={chipClassName}
          style={{ ...theme.idle, borderStyle: 'dashed', color: theme.accent }}
        >
          + Add
        </button>
      )}
    </>
  )
}
