import React, { useCallback, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { format, parseISO } from 'date-fns'
import { useAuth } from '@lunari/utils'
import { Toast } from '@lunari/ui'
import type { RawCycleSettings } from '@lunari/types'
import { DatePicker, onColor } from './LogPeriodCard'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/v1'

const CYCLE_MIN = 21
const CYCLE_MAX = 45
const PERIOD_MIN = 2
const PERIOD_MAX = 10
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

function todayYmd(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

/**
 * Settings row + inline editor for the RAW onboarding cycle (length, period, start).
 * Reads/writes the stored Cycle row (GET /me/cycle/settings · POST /me/cycle), NOT the
 * EFFECTIVE values from GET /me/cycle. Saving recalibrates the app via `onSaved`.
 */
export function CycleSettingsRow({
  ink,
  sub,
  chev,
  gold,
  cardwash,
  cardbd,
  rowBorder,
  isLast,
  onSaved,
}: {
  ink: string
  sub: string
  chev: string
  gold: string
  cardwash: string
  cardbd: string
  rowBorder: string
  isLast?: boolean
  onSaved: () => void
}) {
  const { session } = useAuth()
  const [open, setOpen] = useState(false)
  const [startDate, setStartDate] = useState(() => todayYmd())
  const [cycleLength, setCycleLength] = useState(28)
  const [periodLength, setPeriodLength] = useState(5)
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const surface = { ink, sub, gold, cardwash, cardbd }

  const authHeaders = useCallback(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    }),
    [session]
  )

  const flash = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), type === 'error' ? 2800 : 1600)
  }

  // Lazy-load the RAW baseline the first time the editor opens.
  const openEditor = async () => {
    const next = !open
    setOpen(next)
    if (!next || loaded || !session) return
    try {
      const r = await fetch(`${API_URL}/me/cycle/settings`, { headers: authHeaders() })
      if (!r.ok) return
      const raw: RawCycleSettings = await r.json()
      setStartDate(raw.startDate)
      setCycleLength(raw.cycleLength)
      setPeriodLength(raw.periodLength)
      setLoaded(true)
    } catch {
      /* leave defaults */
    }
  }

  const save = async () => {
    if (!session) return
    setBusy(true)
    try {
      const r = await fetch(`${API_URL}/me/cycle`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ startDate, cycleLength, periodLength }),
      })
      if (!r.ok) throw new Error('save failed')
      onSaved()
      flash('Cycle settings updated', 'success')
      setOpen(false)
    } catch {
      flash("Couldn't save — try again", 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={{ borderBottomColor: rowBorder, borderBottomWidth: isLast ? 0 : 1 }}>
      <Pressable onPress={openEditor} style={styles.row}>
        <Text style={[styles.rowText, { color: ink }]}>Cycle settings</Text>
        <Text style={[styles.chev, { color: chev }]}>{open ? '⌄' : '›'}</Text>
      </Pressable>

      {open && (
        <View style={[styles.panel, { backgroundColor: cardwash, borderColor: cardbd }]}>
          <Stepper
            label="Cycle length"
            unit="days"
            value={cycleLength}
            min={CYCLE_MIN}
            max={CYCLE_MAX}
            onChange={(n) => setCycleLength(clamp(n, CYCLE_MIN, CYCLE_MAX))}
            ink={ink}
            sub={sub}
            gold={gold}
            cardbd={cardbd}
          />
          <View style={{ height: 12 }} />
          <Stepper
            label="Period length"
            unit="days"
            value={periodLength}
            min={PERIOD_MIN}
            max={PERIOD_MAX}
            onChange={(n) => setPeriodLength(clamp(n, PERIOD_MIN, PERIOD_MAX))}
            ink={ink}
            sub={sub}
            gold={gold}
            cardbd={cardbd}
          />

          <Text style={[styles.fieldLabel, { color: sub }]}>Cycle start date</Text>
          <DatePicker
            value={startDate}
            max={todayYmd()}
            onSelect={setStartDate}
            surface={surface}
          />
          <Text style={[styles.anchor, { color: sub }]}>
            Anchored to {format(parseISO(startDate), 'MMM d, yyyy')}
          </Text>

          <Text style={[styles.helper, { color: sub }]}>
            These are your baseline — logged periods refine predictions over time.
          </Text>

          <View style={styles.actions}>
            <Pressable
              onPress={save}
              disabled={busy}
              style={[styles.primaryBtn, { backgroundColor: gold, opacity: busy ? 0.6 : 1 }]}
            >
              <Text style={[styles.primaryText, { color: onColor(gold) }]}>
                {busy ? 'Saving…' : 'Save'}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setOpen(false)}
              style={[styles.ghostBtn, { borderColor: cardbd }]}
            >
              <Text style={[styles.ghostText, { color: ink }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </View>
  )
}

function Stepper({
  label,
  unit,
  value,
  min,
  max,
  onChange,
  ink,
  sub,
  gold,
  cardbd,
}: {
  label: string
  unit: string
  value: number
  min: number
  max: number
  onChange: (n: number) => void
  ink: string
  sub: string
  gold: string
  cardbd: string
}) {
  return (
    <View style={styles.stepperRow}>
      <View>
        <Text style={[styles.stepperLabel, { color: ink }]}>{label}</Text>
        <Text style={[styles.stepperUnit, { color: sub }]}>{unit}</Text>
      </View>
      <View style={styles.stepperControls}>
        <Pressable
          disabled={value <= min}
          onPress={() => onChange(value - 1)}
          style={[styles.stepBtn, { borderColor: cardbd, opacity: value <= min ? 0.35 : 1 }]}
        >
          <Text style={[styles.stepBtnText, { color: gold }]}>−</Text>
        </Pressable>
        <Text style={[styles.stepValue, { color: ink }]}>{value}</Text>
        <Pressable
          disabled={value >= max}
          onPress={() => onChange(value + 1)}
          style={[styles.stepBtn, { borderColor: cardbd, opacity: value >= max ? 0.35 : 1 }]}
        >
          <Text style={[styles.stepBtnText, { color: gold }]}>+</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  rowText: { fontFamily: 'Marcellus_400Regular', fontSize: 15.5 },
  chev: { fontFamily: 'Raleway_400Regular', fontSize: 18 },

  panel: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 14 },
  fieldLabel: {
    fontFamily: 'Raleway_500Medium',
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
  },
  anchor: { fontFamily: 'Raleway_400Regular', fontSize: 11, marginTop: 6 },
  helper: { fontFamily: 'Raleway_300Light', fontSize: 10.5, lineHeight: 16, marginTop: 12 },

  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  primaryBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 11 },
  primaryText: { fontFamily: 'Raleway_600SemiBold', fontSize: 11, color: '#2C2825' },
  ghostBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 11, borderWidth: 1 },
  ghostText: { fontFamily: 'Raleway_500Medium', fontSize: 11 },

  // stepper
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepperLabel: { fontFamily: 'Raleway_400Regular', fontSize: 13 },
  stepperUnit: { fontFamily: 'Raleway_400Regular', fontSize: 10 },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontFamily: 'Raleway_500Medium', fontSize: 18 },
  stepValue: {
    fontFamily: 'Marcellus_400Regular',
    fontSize: 19,
    minWidth: 26,
    textAlign: 'center',
  },
})
