'use client'
import React, { useEffect, useState } from 'react'
import {
  getPhaseForDay,
  getPhaseById,
  phasePositionForCycleDay,
  getMoveGuidance,
  MOVE_OVERRIDE_COPY,
  MOVE_SETUP_COPY,
  TRAINING_STYLE_OPTIONS,
  TRAINING_SERIOUSNESS_OPTIONS,
  TRAINING_DAYS_OPTIONS,
} from '@lunari/phase-data'
import { phases as phaseTheme, phaseKeyFor } from '@lunari/design-tokens'
import type {
  User,
  TrainingProfile,
  TrainingStyle,
  TrainingSeriousness,
  TrainingDaysPerWeek,
} from '@lunari/types'
import { apiGet, apiPatch } from '@/src/lib/api'
import { useCycleContext } from '../cycle-context'

// Fixed Lab neutrals — phase-independent (labBg is light on all four phases).
const N = {
  label: '#8A8275',
  section: '#A99E88',
  title: '#2C2825',
  text: '#6A655D',
  barOff: '#E5DDCD',
}

type Override = 'strong' | 'normal' | 'low'

export default function WorkoutsPage() {
  const { cycleData } = useCycleContext()
  const day = cycleData?.day ?? 1
  const phase = cycleData ? getPhaseById(cycleData.phase) : getPhaseForDay(1)
  const t = phaseTheme[phaseKeyFor(phase.id)]
  const accent = t.accent

  const [user, setUser] = useState<User | null>(null)
  const [override, setOverride] = useState<Override>('normal')
  const [setupOpen, setSetupOpen] = useState(false)

  useEffect(() => {
    apiGet<User>('/me')
      .then(setUser)
      .catch(() => {})
  }, [])

  // Luteal early/late (and every other phase) via the shared phase-half helper.
  const half = phasePositionForCycleDay(
    day,
    cycleData?.cycleLength ?? 28,
    cycleData?.periodLength ?? 5
  ).half
  const style = user?.trainingProfile?.style ?? null
  const move = getMoveGuidance(style, phase.id, half)

  // "How she feels today" overrides the phase: low energy drops the dial one level.
  const displayBars = override === 'low' ? Math.max(1, move.dial.bars - 1) : move.dial.bars
  const overrideResponse =
    override === 'low'
      ? MOVE_OVERRIDE_COPY.lowResponse
      : override === 'strong'
        ? MOVE_OVERRIDE_COPY.strongResponse
        : null

  const saveTraining = async (patch: Partial<TrainingProfile>) => {
    try {
      const updated = await apiPatch<User>('/me', { trainingProfile: patch })
      setUser(updated)
    } catch {
      /* leave as-is */
    }
  }

  const card: React.CSSProperties = {
    background: t.labCard,
    border: `1px solid ${t.labBorder}`,
    borderRadius: 15,
    padding: '15px 17px',
  }
  const sectionLabel: React.CSSProperties = {
    fontSize: 9,
    letterSpacing: '0.2em',
    color: N.section,
    margin: '22px 0 12px',
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
          className="relative max-w-3xl mx-auto px-6 md:px-10"
          style={{ paddingTop: 18, paddingBottom: 24 }}
        >
          <div
            className="font-body uppercase"
            style={{ fontSize: 9, letterSpacing: '0.24em', color: t.headerLabel, fontWeight: 600 }}
          >
            {t.label} · Day {day}
          </div>
          <h1 className="font-display" style={{ fontSize: 30, marginTop: 5, color: t.headerText }}>
            Move
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
            {move.tagline}
          </div>
        </div>
      </div>

      {/* ── TINTED BODY ── */}
      <div className="max-w-3xl mx-auto px-6 md:px-10 pt-4 pb-12 font-body">
        {/* dial card */}
        <div style={card}>
          <div style={{ fontSize: 10.5, color: N.label, fontWeight: 500 }}>Intensity today</div>
          <div className="flex" style={{ gap: 5, marginTop: 9 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex-1"
                style={{
                  height: 6,
                  borderRadius: 3,
                  background: i < displayBars ? accent : N.barOff,
                }}
              />
            ))}
          </div>
          <div style={{ fontSize: 9.5, color: accent, marginTop: 8, fontWeight: 600 }}>
            {move.dial.label}
          </div>
          {/* Always-visible micro-copy */}
          <div
            style={{ fontSize: 9.5, color: N.text, marginTop: 8, fontWeight: 300, lineHeight: 1.5 }}
          >
            {MOVE_OVERRIDE_COPY.microcopy}
          </div>

          {/* THE OVERRIDE */}
          <div style={{ borderTop: `1px solid ${t.labBorder}`, marginTop: 12, paddingTop: 12 }}>
            <div style={{ fontSize: 10.5, color: N.label, fontWeight: 500, marginBottom: 8 }}>
              {MOVE_OVERRIDE_COPY.control}
            </div>
            <div className="flex flex-wrap" style={{ gap: 7 }}>
              {(
                [
                  ['strong', MOVE_OVERRIDE_COPY.strong],
                  ['normal', MOVE_OVERRIDE_COPY.normal],
                  ['low', MOVE_OVERRIDE_COPY.low],
                ] as [Override, string][]
              ).map(([value, label]) => {
                const on = override === value
                return (
                  <button
                    key={value}
                    onClick={() => setOverride(value)}
                    style={{
                      fontSize: 11,
                      padding: '7px 13px',
                      borderRadius: 20,
                      background: on ? accent : 'transparent',
                      color: on ? '#F5EBD6' : N.text,
                      border: `1px solid ${on ? 'transparent' : t.labBorder}`,
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            {overrideResponse && (
              <div
                style={{
                  fontSize: 11,
                  color: accent,
                  marginTop: 10,
                  fontWeight: 500,
                  lineHeight: 1.5,
                }}
              >
                {overrideResponse}
              </div>
            )}
          </div>
        </div>

        {/* why note */}
        <div
          style={{
            marginTop: 16,
            fontSize: 10.5,
            color: N.text,
            lineHeight: 1.6,
            fontWeight: 300,
            background: t.labWhy,
            borderRadius: 12,
            padding: '13px 15px',
          }}
        >
          <span style={{ color: accent, fontWeight: 600 }}>Why ·</span> {move.why}
        </div>

        {/* guidance OR "make this yours" prompt */}
        {move.guidance ? (
          <>
            <div className="uppercase" style={sectionLabel}>
              For you today
            </div>
            <div style={card}>
              <div className="font-display" style={{ fontSize: 19, color: N.title }}>
                {move.guidance.headline}
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: N.text,
                  marginTop: 6,
                  fontWeight: 300,
                  lineHeight: 1.6,
                }}
              >
                {move.guidance.body}
              </div>
            </div>

            <div className="uppercase" style={sectionLabel}>
              Session ideas
            </div>
            <div className="flex flex-col" style={{ gap: 14 }}>
              {move.guidance.sessions.map((s, i) => {
                const last = i === move.guidance!.sessions.length - 1
                return (
                  <div
                    key={s}
                    className="flex items-center"
                    style={{
                      gap: 12,
                      paddingBottom: 14,
                      borderBottom: last ? 'none' : `1px solid ${t.labBorder}`,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 999,
                        background: accent,
                        flexShrink: 0,
                      }}
                    />
                    <div className="font-display" style={{ fontSize: 15.5, color: N.title }}>
                      {s}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : setupOpen ? (
          <TrainingSetup
            t={t}
            onSkip={() => setSetupOpen(false)}
            onSave={async (p) => {
              await saveTraining(p)
              setSetupOpen(false)
            }}
          />
        ) : (
          <div style={{ ...card, marginTop: 22 }}>
            <div className="font-display" style={{ fontSize: 18, color: N.title }}>
              {MOVE_SETUP_COPY.promptHeading}
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: N.text,
                marginTop: 6,
                fontWeight: 300,
                lineHeight: 1.6,
              }}
            >
              {MOVE_SETUP_COPY.promptBody}
            </div>
            <button
              onClick={() => setSetupOpen(true)}
              style={{
                marginTop: 12,
                fontSize: 11,
                fontWeight: 600,
                padding: '9px 18px',
                borderRadius: 11,
                background: accent,
                color: '#F5EBD6',
              }}
            >
              {MOVE_SETUP_COPY.promptButton}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Inline 3-question setup panel ─────────────────────────────────────────────
function TrainingSetup({
  t,
  onSave,
  onSkip,
}: {
  t: (typeof phaseTheme)[keyof typeof phaseTheme]
  onSave: (p: Partial<TrainingProfile>) => void | Promise<void>
  onSkip: () => void
}) {
  const [style, setStyle] = useState<TrainingStyle | undefined>()
  const [seriousness, setSeriousness] = useState<TrainingSeriousness | undefined>()
  const [days, setDays] = useState<TrainingDaysPerWeek | undefined>()

  const q: React.CSSProperties = {
    fontSize: 12,
    color: '#2C2825',
    fontWeight: 500,
    margin: '14px 0 8px',
  }

  return (
    <div
      style={{
        marginTop: 22,
        background: t.labCard,
        border: `1px solid ${t.labBorder}`,
        borderRadius: 15,
        padding: '16px 17px',
      }}
    >
      <div style={{ fontSize: 11.5, color: N.text, fontWeight: 300, lineHeight: 1.6 }}>
        {MOVE_SETUP_COPY.intro}
      </div>

      <div style={q}>{MOVE_SETUP_COPY.q1}</div>
      <ChipRow
        t={t}
        options={TRAINING_STYLE_OPTIONS}
        selected={style}
        onSelect={(v) => setStyle(v as TrainingStyle)}
      />
      <div style={q}>{MOVE_SETUP_COPY.q2}</div>
      <ChipRow
        t={t}
        options={TRAINING_SERIOUSNESS_OPTIONS}
        selected={seriousness}
        onSelect={(v) => setSeriousness(v as TrainingSeriousness)}
      />
      <div style={q}>{MOVE_SETUP_COPY.q3}</div>
      <ChipRow
        t={t}
        options={TRAINING_DAYS_OPTIONS}
        selected={days}
        onSelect={(v) => setDays(v as TrainingDaysPerWeek)}
      />

      <div className="flex items-center" style={{ gap: 14, marginTop: 16 }}>
        <button
          onClick={() =>
            onSave({
              ...(style && { style }),
              ...(seriousness && { seriousness }),
              ...(days && { daysPerWeek: days }),
            })
          }
          disabled={!style}
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '9px 18px',
            borderRadius: 11,
            background: t.accent,
            color: '#F5EBD6',
            opacity: style ? 1 : 0.45,
          }}
        >
          Save
        </button>
        <button onClick={onSkip} style={{ fontSize: 11, color: N.text, fontWeight: 500 }}>
          {MOVE_SETUP_COPY.skip}
        </button>
      </div>
    </div>
  )
}

function ChipRow({
  t,
  options,
  selected,
  onSelect,
}: {
  t: (typeof phaseTheme)[keyof typeof phaseTheme]
  options: { value: string; label: string }[]
  selected: string | undefined
  onSelect: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap" style={{ gap: 7 }}>
      {options.map((o) => {
        const on = selected === o.value
        return (
          <button
            key={o.value}
            onClick={() => onSelect(o.value)}
            style={{
              fontSize: 11,
              padding: '7px 13px',
              borderRadius: 20,
              background: on ? t.accent : 'transparent',
              color: on ? '#F5EBD6' : N.text,
              border: `1px solid ${on ? 'transparent' : t.labBorder}`,
              textAlign: 'left',
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
