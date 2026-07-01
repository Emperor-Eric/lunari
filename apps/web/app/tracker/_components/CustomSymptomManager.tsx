'use client'
import React, { useState } from 'react'
import type { CustomSymptom } from '@lunari/types'

export interface ManagerTheme {
  ink: string
  sub: string
  card: string
  border: string
  accent: string
  maroon: string
}

/** Inline list to rename / archive / delete custom symptoms. Deleting removes only the
 *  definition — past logs keep their stored labels. */
export function CustomSymptomManager({
  items,
  onUpdate,
  onRemove,
  theme,
}: {
  items: CustomSymptom[]
  onUpdate: (id: string, patch: { label?: string; archived?: boolean }) => Promise<CustomSymptom>
  onRemove: (id: string) => Promise<void>
  theme: ManagerTheme
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  if (items.length === 0) {
    return (
      <div style={{ fontSize: 11, color: theme.sub, fontWeight: 300 }}>No custom symptoms yet.</div>
    )
  }

  const commitRename = async (c: CustomSymptom) => {
    const label = draft.trim()
    setEditingId(null)
    if (!label || label === c.label) return
    try {
      await onUpdate(c.id, { label })
    } catch {
      /* dupe / error — leave as-is */
    }
  }

  return (
    <div className="flex flex-col" style={{ gap: 8 }}>
      {items.map((c) => (
        <div
          key={c.id}
          className="flex items-center justify-between"
          style={{
            background: theme.card,
            border: `1px solid ${theme.border}`,
            borderRadius: 11,
            padding: '9px 12px',
            opacity: c.archived ? 0.6 : 1,
          }}
        >
          {editingId === c.id ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => commitRename(c)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename(c)
                if (e.key === 'Escape') setEditingId(null)
              }}
              maxLength={30}
              style={{
                flex: 1,
                fontSize: 12.5,
                color: theme.ink,
                background: 'transparent',
                border: 'none',
                borderBottom: `1px solid ${theme.accent}`,
                outline: 'none',
                marginRight: 10,
              }}
            />
          ) : (
            <button
              onClick={() => {
                setEditingId(c.id)
                setDraft(c.label)
              }}
              style={{ fontSize: 12.5, color: theme.ink, textAlign: 'left', flex: 1 }}
              title="Rename"
            >
              {c.label}
              {c.archived && <span style={{ fontSize: 10, color: theme.sub }}> · archived</span>}
            </button>
          )}

          <div className="flex items-center" style={{ gap: 12 }}>
            <button
              onClick={() => onUpdate(c.id, { archived: !c.archived }).catch(() => {})}
              style={{ fontSize: 11, color: theme.accent, fontWeight: 600 }}
            >
              {c.archived ? 'Restore' : 'Archive'}
            </button>
            <button
              onClick={() => {
                if (
                  window.confirm(
                    `Delete "${c.label}"? Past logs keep the label; it just stops appearing as a chip.`
                  )
                ) {
                  onRemove(c.id).catch(() => {})
                }
              }}
              style={{ fontSize: 15, color: theme.maroon, lineHeight: 1 }}
              title="Delete"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
