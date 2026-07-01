import type { RhythmNote, RhythmFlag } from '@lunari/types'

// ─── Conservative thresholds (health-sensitive — do NOT loosen) ───────────────
const RECENT_WINDOW = 8 // most-recent gaps considered
const VALID_MIN = 21 // a "cycle" gap is [21, 45] days
const VALID_MAX = 45
const VARIABILITY_MIN_GAPS = 4 // need >=4 valid gaps before commenting on spread
const VARIABILITY_SPREAD = 9 // flag when max-min of recent valid gaps >= 9 days
const LONG_GAP_MIN_GAPS = 2 // need >=2 valid gaps to set a baseline median
const LONG_GAP_RECENT = 3 // only inspect the 3 most recent raw gaps
const LONG_GAP_MARGIN = 14 // flag a raw gap > max(45, median + 14)

/**
 * VERBATIM approved copy — do not paraphrase. Exported as the single source so the
 * Insights UI (web + mobile) and the Today mention all render identical strings.
 * Non-diagnostic and agency-returning by design: observe, normalize, never name a
 * cause or condition.
 */
export const RHYTHM_NOTE_COPY = {
  disclaimer: 'A gentle observation from your logs — not medical advice.',
  variability:
    "Your recent cycles have varied more in length than they usually might. Cycle length naturally shifts with things like stress, sleep, illness, travel, and life changes, so some variation is completely normal. If you're ever curious or something doesn't feel right, a healthcare professional is the best person to talk to.",
  long_gap:
    "There was a longer-than-usual gap between two of your recent logged periods. This can happen for many reasons — including simply not having logged one. If it wasn't a missed log and you find yourself wondering about it, a healthcare professional can help you make sense of it.",
  steady: 'Your recent cycles have been fairly steady.',
  insufficient: 'Log a few cycles to see gentle notes on your rhythm.',
  todayMention: 'A gentle note about your recent cycle rhythm is waiting in your insights.',
} as const

/** Per-flag observation copy (verbatim). */
export const RHYTHM_FLAG_COPY: Record<RhythmFlag, string> = {
  variability: RHYTHM_NOTE_COPY.variability,
  long_gap: RHYTHM_NOTE_COPY.long_gap,
}

/** Normalize a stored start date to "YYYY-MM-DD". */
function toISODate(input: string | Date): string {
  if (input instanceof Date) return input.toISOString().slice(0, 10)
  return input.slice(0, 10)
}

/** Whole-day number for a "YYYY-MM-DD" string (UTC epoch days). */
function dayNumber(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000)
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

/**
 * Conservative, non-diagnostic observation about cycle-length variability and unusually
 * long gaps. Pure. Reconstructs RAW start-to-start gaps directly from logged period
 * starts (the recalibration engine's cycleLengthGaps FILTERS to [21,45]; long-gap
 * detection needs the unfiltered gaps). New/lightly-logged accounts return
 * 'insufficient' (nothing is shown).
 */
export function computeRhythmNote(periodEvents: Array<{ startDate: string | Date }>): RhythmNote {
  const isoStarts = periodEvents.map((e) => toISODate(e.startDate)).sort() // ISO strings sort chronologically
  const days = isoStarts.map(dayNumber)

  const rawGaps: number[] = []
  for (let i = 1; i < days.length; i++) rawGaps.push(days[i] - days[i - 1])
  const validGaps = rawGaps.filter((g) => g >= VALID_MIN && g <= VALID_MAX)

  const recentValid = validGaps.slice(-RECENT_WINDOW)
  const flags: RhythmFlag[] = []

  // VARIABILITY — spread of recent valid gaps.
  if (recentValid.length >= VARIABILITY_MIN_GAPS) {
    const spread = Math.max(...recentValid) - Math.min(...recentValid)
    if (spread >= VARIABILITY_SPREAD) flags.push('variability')
  }

  // LONG_GAP — any of the last 3 raw gaps well above the recent median.
  if (recentValid.length >= LONG_GAP_MIN_GAPS) {
    const baseline = median(recentValid)
    const threshold = Math.max(VALID_MAX, baseline + LONG_GAP_MARGIN)
    const lastRaw = rawGaps.slice(-LONG_GAP_RECENT)
    if (lastRaw.some((g) => g > threshold)) flags.push('long_gap')
  }

  const state: RhythmNote['state'] =
    validGaps.length < 2 ? 'insufficient' : flags.length > 0 ? 'observation' : 'steady'

  // Stable per distinct observation; changes when a new period is logged (moves the most
  // recent start) or the flag set changes. Empty when there are no flags.
  const signature =
    flags.length > 0 ? `${[...flags].sort().join('+')}|${isoStarts[isoStarts.length - 1]}` : ''

  return { state, flags, signature }
}
