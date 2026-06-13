'use client'
import React, { useRef, useState } from 'react'
import { getPhaseForDay, getPhaseById } from '@lunari/phase-data'
import { phases as phaseTheme, phaseKeyFor } from '@lunari/design-tokens'
import { Toast } from '@lunari/ui'
import { useCycleContext } from '../cycle-context'
import { apiPost } from '@/src/lib/api'

// Mood scale stays numeric (1–5) so the saved `mood` field is unchanged — only the
// labels are restyled to the Goddess reference.
const MOODS = ['Low', 'Tender', 'Calm', 'Bright', 'Wired'] // value = index + 1

// Fixed Lab neutrals — phase-independent (labBg is light on all four phases).
const N = {
  section: '#A99E88',
  value: '#2C2825',
  unit: '#B3A890',
  idleText: '#6A655D',
  minusBd: '#D9CDB8',
  minusGlyph: '#8A8275',
}

export default function LogPage() {
  const { cycleData } = useCycleContext()
  const day = cycleData?.day ?? 1
  const phase = cycleData ? getPhaseById(cycleData.phase) : getPhaseForDay(1)
  const t = phaseTheme[phaseKeyFor(phase.id)]

  const [symptoms, setSymptoms] = useState<string[]>([])
  const [mood, setMood] = useState<number | null>(null)
  const [energy, setEnergy] = useState(5) // 1–10
  const [sleep, setSleep] = useState(7.5)
  const [water, setWater] = useState(0)
  const [journal, setJournal] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const trackRef = useRef<HTMLDivElement>(null)

  const toggleSymptom = (s: string) =>
    setSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))

  const setEnergyFromPointer = (clientX: number) => {
    const el = trackRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const frac = Math.min(1, Math.max(0, (clientX - r.left) / r.width))
    setEnergy(Math.max(1, Math.round(frac * 10)))
  }

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
  })
  const solid12 = `${t.accent}1F` // ~12% tint of the phase accent

  const handleSave = async () => {
    setSaving(true)
    try {
      await apiPost('/me/logs', {
        symptoms,
        mood,
        energyLevel: energy,
        sleepHours: sleep,
        waterGlasses: water,
        journalNote: journal,
      })
      setToast({ msg: 'Logged ✓', type: 'success' })
      setTimeout(() => setToast(null), 3000)
    } catch {
      setToast({ msg: 'Something went wrong', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const energyPct = energy * 10

  return (
    <div className="min-h-screen" style={{ backgroundColor: t.labBg }}>
      {/* ── HEADER BAND (phase gradient — no orbit on Log) ── */}
      <div style={{ background: t.header, color: t.headerText }}>
        <div className="max-w-xl mx-auto px-6 md:px-10" style={{ paddingTop: 18, paddingBottom: 20 }}>
          <h1 className="font-display" style={{ fontSize: 27, color: t.headerText }}>
            Daily check-in
          </h1>
          <div className="font-body" style={{ fontSize: 10.5, marginTop: 4, fontWeight: 300, color: t.headerLabel }}>
            {dateLabel} · {t.label} · Day {day}
          </div>
        </div>
      </div>

      {/* ── TINTED BODY ── */}
      <div className="max-w-xl mx-auto px-6 md:px-10 pt-4 pb-10 font-body">
        {/* Symptoms (multi-select chips) */}
        <div className="uppercase" style={{ fontSize: 9, letterSpacing: '0.2em', color: N.section, margin: '0 0 10px' }}>
          Symptoms
        </div>
        <div className="flex flex-wrap" style={{ gap: 7 }}>
          {phase.symptoms.map((s) => {
            const active = symptoms.includes(s)
            return (
              <button
                key={s}
                onClick={() => toggleSymptom(s)}
                style={{
                  fontSize: 10.5,
                  padding: '6px 12px',
                  borderRadius: 18,
                  background: active ? t.accent : t.labCard,
                  color: active ? t.headerText : N.idleText,
                  border: `1px solid ${active ? 'transparent' : t.labBorder}`,
                }}
              >
                {s}
              </button>
            )
          })}
        </div>

        {/* Mood (single-select) */}
        <div className="uppercase" style={{ fontSize: 9, letterSpacing: '0.2em', color: N.section, margin: '20px 0 10px' }}>
          Mood
        </div>
        <div className="flex" style={{ gap: 8 }}>
          {MOODS.map((label, i) => {
            const val = i + 1
            const active = mood === val
            return (
              <button
                key={label}
                onClick={() => setMood(val)}
                className="flex-1"
                style={{
                  fontSize: 10,
                  textAlign: 'center',
                  padding: '9px 0',
                  borderRadius: 10,
                  background: active ? solid12 : t.labCard,
                  color: active ? t.accent : N.idleText,
                  border: `1px solid ${active ? t.accent : t.labBorder}`,
                }}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Energy (slider) */}
        <div className="uppercase" style={{ fontSize: 9, letterSpacing: '0.2em', color: N.section, margin: '20px 0 10px' }}>
          Energy
        </div>
        <div
          ref={trackRef}
          onPointerDown={(e) => {
            ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
            setEnergyFromPointer(e.clientX)
          }}
          onPointerMove={(e) => {
            if (e.buttons === 1) setEnergyFromPointer(e.clientX)
          }}
          className="relative cursor-pointer"
          style={{ height: 6, background: t.labTrack, borderRadius: 4 }}
        >
          <div className="absolute left-0 top-0 bottom-0" style={{ width: `${energyPct}%`, background: t.accent, borderRadius: 4 }} />
          <div
            className="absolute"
            style={{
              top: '50%',
              left: `${energyPct}%`,
              transform: 'translate(-50%, -50%)',
              width: 17,
              height: 17,
              borderRadius: '50%',
              background: t.labBg,
              border: `2px solid ${t.accent}`,
            }}
          />
        </div>
        <div className="flex justify-between" style={{ fontSize: 9, color: N.section, marginTop: 7 }}>
          <span>Drained</span>
          <span>Energised</span>
        </div>

        {/* Sleep + Water readouts */}
        <div className="flex" style={{ gap: 11, marginTop: 20 }}>
          {/* Sleep — kept editable via stepper (reference shows readout only) */}
          <div className="flex-1" style={{ background: t.labCard, border: `1px solid ${t.labBorder}`, borderRadius: 13, padding: 13 }}>
            <div className="flex justify-between items-center">
              <div className="uppercase" style={{ fontSize: 8.5, letterSpacing: '0.1em', color: N.section }}>
                Sleep
              </div>
              <Stepper
                onMinus={() => setSleep((v) => Math.max(0, Math.round((v - 0.5) * 2) / 2))}
                onPlus={() => setSleep((v) => Math.min(12, Math.round((v + 0.5) * 2) / 2))}
                accent={t.accent}
                onHdr={t.headerText}
              />
            </div>
            <div className="font-display" style={{ fontSize: 21, marginTop: 3, color: N.value }}>
              {sleep}
              <span className="font-body" style={{ fontSize: 10, color: N.unit }}>h</span>
            </div>
          </div>

          {/* Water — stepper */}
          <div className="flex-1" style={{ background: t.labCard, border: `1px solid ${t.labBorder}`, borderRadius: 13, padding: 13 }}>
            <div className="flex justify-between items-center">
              <div className="uppercase" style={{ fontSize: 8.5, letterSpacing: '0.1em', color: N.section }}>
                Water
              </div>
              <Stepper
                onMinus={() => setWater((v) => Math.max(0, v - 1))}
                onPlus={() => setWater((v) => Math.min(8, v + 1))}
                accent={t.accent}
                onHdr={t.headerText}
              />
            </div>
            <div className="font-display" style={{ fontSize: 21, marginTop: 3, color: N.value }}>
              {water}
              <span className="font-body" style={{ fontSize: 10, color: N.unit }}> / 8 glasses</span>
            </div>
          </div>
        </div>

        {/* Notes (journal) — preserved from existing screen; beyond the reference */}
        <div className="uppercase" style={{ fontSize: 9, letterSpacing: '0.2em', color: N.section, margin: '20px 0 10px' }}>
          Notes
        </div>
        <textarea
          value={journal}
          onChange={(e) => setJournal(e.target.value)}
          placeholder="Anything you want to remember about today…"
          rows={3}
          className="w-full resize-none"
          style={{
            background: t.labCard,
            border: `1px solid ${t.labBorder}`,
            borderRadius: 13,
            padding: '12px 14px',
            fontSize: 12,
            color: N.value,
            outline: 'none',
          }}
        />

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full uppercase"
          style={{
            marginTop: 22,
            background: t.accent,
            color: t.headerText,
            borderRadius: 13,
            padding: 15,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.1em',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Saving…' : 'Save check-in'}
        </button>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  )
}

function Stepper({
  onMinus,
  onPlus,
  accent,
  onHdr,
}: {
  onMinus: () => void
  onPlus: () => void
  accent: string
  onHdr: string
}) {
  const base: React.CSSProperties = {
    width: 18,
    height: 18,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    lineHeight: 1,
  }
  return (
    <div className="flex" style={{ gap: 6 }}>
      <button onClick={onMinus} style={{ ...base, border: '1px solid #D9CDB8', color: '#8A8275' }}>
        −
      </button>
      <button onClick={onPlus} style={{ ...base, background: accent, color: onHdr }}>
        +
      </button>
    </div>
  )
}
