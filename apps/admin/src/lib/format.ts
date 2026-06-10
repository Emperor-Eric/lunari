import { format } from 'date-fns'

/** Cents → "$1,234.56" */
export function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/** ISO string → "Jun 9, 2026" (or "—" when null). */
export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return format(new Date(iso), 'MMM d, yyyy')
  } catch {
    return '—'
  }
}

/** "YYYY-MM-DD" → "Jun 9" for compact chart axes. */
export function shortDay(date: string): string {
  try {
    return format(new Date(`${date}T00:00:00`), 'MMM d')
  } catch {
    return date
  }
}

/** "YYYY-MM" → "Jun" for monthly axes. */
export function shortMonth(month: string): string {
  try {
    return format(new Date(`${month}-01T00:00:00`), 'MMM')
  } catch {
    return month
  }
}
