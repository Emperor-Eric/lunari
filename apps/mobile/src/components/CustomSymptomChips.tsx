import React, { useState } from 'react'
import {
  View,
  Text,
  Pressable,
  TextInput,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native'
import type { CustomSymptom } from '@lunari/types'

export interface ChipColors {
  activeBg: string
  activeText: string
  idleBg: string
  idleText: string
  idleBorder: string
  dot: string
  accent: string
  inputText: string
}

/**
 * Custom-symptom chips (marked with a small dot) + an inline "+ Add" affordance.
 * Returns a fragment, so it drops into the screen's existing chip-wrap row and reuses
 * the screen's chip/text styles. Toggling stores the plain label (same POST /me/logs).
 */
export function CustomSymptomChips({
  custom,
  builtins,
  selected,
  onToggle,
  onAdd,
  chipStyle,
  textStyle,
  colors,
}: {
  custom: CustomSymptom[]
  builtins: string[]
  selected: string[]
  onToggle: (label: string) => void
  onAdd: (label: string) => Promise<CustomSymptom>
  chipStyle: StyleProp<ViewStyle>
  textStyle: StyleProp<TextStyle>
  colors: ChipColors
}) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)

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
      onToggle(created.label)
      setDraft('')
      setAdding(false)
    } catch {
      /* dupe / error — keep the input open */
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {shown.map((c) => {
        const on = selected.includes(c.label)
        return (
          <Pressable
            key={c.id}
            onPress={() => onToggle(c.label)}
            style={[
              chipStyle,
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: on ? colors.activeBg : colors.idleBg,
                borderColor: on ? 'transparent' : colors.idleBorder,
              },
            ]}
          >
            <View
              style={{
                width: 4,
                height: 4,
                borderRadius: 999,
                backgroundColor: on ? colors.activeText : colors.dot,
              }}
            />
            <Text style={[textStyle, { color: on ? colors.activeText : colors.idleText }]}>
              {c.label}
            </Text>
          </Pressable>
        )
      })}

      {adding ? (
        <TextInput
          autoFocus
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={submit}
          onBlur={submit}
          editable={!busy}
          placeholder="New symptom"
          placeholderTextColor={colors.idleText}
          maxLength={30}
          style={[
            chipStyle,
            textStyle,
            {
              minWidth: 110,
              backgroundColor: colors.idleBg,
              borderColor: colors.accent,
              color: colors.inputText,
            },
          ]}
        />
      ) : (
        <Pressable
          onPress={() => setAdding(true)}
          style={[
            chipStyle,
            { backgroundColor: colors.idleBg, borderColor: colors.accent, borderStyle: 'dashed' },
          ]}
        >
          <Text style={[textStyle, { color: colors.accent }]}>+ Add</Text>
        </Pressable>
      )}
    </>
  )
}
