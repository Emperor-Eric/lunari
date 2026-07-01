import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native'
import type { CustomSymptom } from '@lunari/types'

export interface ManagerColors {
  ink: string
  sub: string
  card: string
  border: string
  accent: string
  maroon: string
}

/** Rename / archive / delete custom symptoms. Deleting removes only the definition —
 *  past logs keep their stored labels. */
export function CustomSymptomManager({
  items,
  onUpdate,
  onRemove,
  colors,
}: {
  items: CustomSymptom[]
  onUpdate: (id: string, patch: { label?: string; archived?: boolean }) => Promise<CustomSymptom>
  onRemove: (id: string) => Promise<void>
  colors: ManagerColors
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  if (items.length === 0) {
    return <Text style={[styles.empty, { color: colors.sub }]}>No custom symptoms yet.</Text>
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

  const confirmDelete = (c: CustomSymptom) => {
    Alert.alert(
      'Delete symptom',
      `Delete "${c.label}"? Past logs keep the label; it just stops appearing as a chip.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onRemove(c.id).catch(() => {}) },
      ]
    )
  }

  return (
    <View style={{ gap: 8 }}>
      {items.map((c) => (
        <View
          key={c.id}
          style={[
            styles.row,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: c.archived ? 0.6 : 1,
            },
          ]}
        >
          {editingId === c.id ? (
            <TextInput
              autoFocus
              value={draft}
              onChangeText={setDraft}
              onBlur={() => commitRename(c)}
              onSubmitEditing={() => commitRename(c)}
              maxLength={30}
              style={[styles.input, { color: colors.ink, borderBottomColor: colors.accent }]}
            />
          ) : (
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => {
                setEditingId(c.id)
                setDraft(c.label)
              }}
            >
              <Text style={[styles.label, { color: colors.ink }]}>
                {c.label}
                {c.archived ? (
                  <Text style={[styles.archivedTag, { color: colors.sub }]}> · archived</Text>
                ) : null}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => onUpdate(c.id, { archived: !c.archived }).catch(() => {})}
            >
              <Text style={[styles.action, { color: colors.accent }]}>
                {c.archived ? 'Restore' : 'Archive'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => confirmDelete(c)} hitSlop={8}>
              <Text style={[styles.delete, { color: colors.maroon }]}>×</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  empty: { fontFamily: 'Raleway_300Light', fontSize: 11 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 11,
    borderWidth: 1,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  label: { fontFamily: 'Raleway_500Medium', fontSize: 12.5 },
  archivedTag: { fontFamily: 'Raleway_400Regular', fontSize: 10 },
  input: {
    flex: 1,
    fontFamily: 'Raleway_500Medium',
    fontSize: 12.5,
    borderBottomWidth: 1,
    marginRight: 10,
    paddingVertical: 2,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  action: { fontFamily: 'Raleway_600SemiBold', fontSize: 11 },
  delete: { fontFamily: 'Raleway_400Regular', fontSize: 18 },
})
