'use client'
import React, { useState } from 'react'
import { PageHeader, Card } from '@/src/components/ui'

export default function NotificationsPage() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState('all')

  return (
    <div className="max-w-2xl">
      <PageHeader title="Notifications" />

      <div className="mb-4 rounded-xl bg-phase-luteal-light border border-brand-stone px-4 py-3 text-sm text-brand-ink">
        🔔 <strong>Coming soon.</strong> Push notifications activate at launch.
      </div>

      <Card className="flex flex-col gap-4 opacity-90">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-brand-ink">Audience</label>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="rounded-lg border-2 border-brand-stone bg-white px-3 py-2.5 text-sm"
          >
            <option value="all">All users</option>
            <option value="active30d">Active (30 days)</option>
            <option value="onboarded">Onboarded</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-brand-ink">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Your follicular phase starts today 🌿"
            className="rounded-lg border-2 border-brand-stone bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-brand-gold"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-brand-ink">Message</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Time to lean into rising energy…"
            className="rounded-lg border-2 border-brand-stone bg-white px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-brand-gold"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            disabled
            title="Push notifications activate at launch"
            className="px-5 py-2.5 rounded-lg bg-brand-ink text-white text-sm font-semibold opacity-40 cursor-not-allowed"
          >
            Send
          </button>
          <span className="text-xs text-brand-ink-soft">Sending is disabled until launch.</span>
        </div>
      </Card>
    </div>
  )
}
