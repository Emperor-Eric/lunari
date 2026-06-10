import React from 'react'

export function PageHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="font-display text-3xl text-brand-ink">{title}</h1>
      {action}
    </div>
  )
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-brand-stone p-5 ${className}`}>{children}</div>
  )
}

export function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <p className="text-xs font-medium text-brand-ink-soft uppercase tracking-wide">{label}</p>
      <p className="font-display text-3xl text-brand-ink mt-2">{value}</p>
    </Card>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-12 text-sm text-brand-ink-soft">{message}</div>
  )
}

export function ExportButton({ onClick, label = 'Export CSV' }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-lg border border-brand-stone bg-white text-sm font-medium text-brand-ink hover:bg-brand-cream"
    >
      ⬇ {label}
    </button>
  )
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-brand-stone text-brand-ink',
  paid: 'bg-phase-follicular-light text-phase-follicular',
  fulfilled: 'bg-phase-ovulatory-light text-phase-ovulatory',
  refunded: 'bg-phase-menstrual-light text-phase-menstrual',
}

export function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? 'bg-brand-stone text-brand-ink'
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${cls}`}>
      {status}
    </span>
  )
}
