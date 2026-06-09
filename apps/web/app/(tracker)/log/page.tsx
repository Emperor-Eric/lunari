'use client'
import React, { useState } from 'react'
import {
  SymptomGrid, MoodPicker, EnergySlider,
  SleepInput, WaterTracker, JournalInput, Toast,
} from '@lunari/ui'
import { getPhaseForDay } from '@lunari/phase-data'
import { useAuth } from '@lunari/utils'
import { useCycleContext } from '../layout'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/v1'

export default function LogPage() {
  const { session } = useAuth()
  const { cycleData } = useCycleContext()
  const phase = cycleData ? getPhaseForDay(cycleData.day) : getPhaseForDay(1)

  const [symptoms, setSymptoms] = useState<string[]>([])
  const [mood, setMood] = useState<number | null>(null)
  const [energy, setEnergy] = useState(5)
  const [sleep, setSleep] = useState(7.5)
  const [water, setWater] = useState(0)
  const [journal, setJournal] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const toggleSymptom = (s: string) =>
    setSymptoms((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])

  const handleSave = async () => {
    if (!session) return
    setSaving(true)
    try {
      const res = await fetch(`${API_URL}/me/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ symptoms, mood, energyLevel: energy, sleepHours: sleep, waterGlasses: water, journalNote: journal }),
      })
      if (!res.ok) throw new Error('Save failed')
      setToast({ msg: 'Logged ✓', type: 'success' })
      setTimeout(() => setToast(null), 3000)
    } catch {
      setToast({ msg: 'Something went wrong', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="font-display text-3xl text-brand-ink mb-6">Today's check-in</h1>

      {/* 2-column desktop, single column mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="text-sm font-semibold text-brand-ink mb-2">Symptoms</h2>
            <SymptomGrid symptoms={phase.symptoms} selected={symptoms} onToggle={toggleSymptom} phaseColor={phase.color} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-brand-ink mb-2">Mood</h2>
            <MoodPicker value={mood} onChange={setMood} />
          </div>
          <EnergySlider value={energy} onChange={setEnergy} phaseColor={phase.color} />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          <SleepInput value={sleep} onChange={setSleep} />
          <WaterTracker value={water} onChange={setWater} />
          <JournalInput value={journal} onChange={setJournal} />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full mt-6 py-4 rounded-xl text-white font-semibold text-base transition-opacity disabled:opacity-60"
        style={{ backgroundColor: '#2C2825' }}
      >
        {saving ? 'Saving…' : "Save today's check-in"}
      </button>

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  )
}
