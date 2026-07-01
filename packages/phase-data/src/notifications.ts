import type { PhaseId, NotificationItem, NotificationPrefs, RhythmNote } from '@lunari/types'
import { getCyclePrediction } from './helpers'
import { RHYTHM_NOTE_COPY } from './rhythm-note'
import type { EffectiveCycle } from './helpers'

// Natural, lowercase phase words for gentle copy (design-tokens owns display labels;
// this stays dependency-free). "ovulation" reads better than "ovulatory" in a sentence.
const PHASE_WORD: Record<PhaseId, string> = {
  menstrual: 'menstrual',
  follicular: 'follicular',
  ovulatory: 'ovulation',
  luteal: 'luteal',
}

// Defaults applied when a stored notificationPrefs is missing the newer keys, so
// existing users behave sensibly with no migration.
const DEFAULT_PHASE_CHANGE = true
const DEFAULT_PERIOD_APPROACHING = true
const DEFAULT_PERIOD_DAYS = 2
const PERIOD_DAYS_MIN = 1
const PERIOD_DAYS_MAX = 5

const MS_PER_DAY = 86_400_000

/** Parse "YYYY-MM-DD" as LOCAL midnight (matches getCyclePrediction's date handling). */
function parseYMD(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

function atMidnight(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function diffDays(a: Date, b: Date): number {
  return Math.round((atMidnight(a).getTime() - atMidnight(b).getTime()) / MS_PER_DAY)
}

const plural = (n: number) => (n === 1 ? '' : 's')

/**
 * Derives today's gentle in-app nudges from the user's EFFECTIVE cycle + notification
 * prefs. Pure and side-effect-free — the same engine the later native/push layer will
 * reuse to decide what (and whether) to deliver. Never stores anything.
 *
 * Priority order in the returned array: period-approaching before phase-change, so a
 * single-banner surface can just take the first item.
 */
export function computeNotifications(
  eff: EffectiveCycle,
  prefs: NotificationPrefs,
  today: Date = new Date(),
  rhythmNote?: RhythmNote
): NotificationItem[] {
  const phaseChangeOn = prefs.phaseChangeAlerts ?? DEFAULT_PHASE_CHANGE
  const periodOn = prefs.periodApproachingAlerts ?? DEFAULT_PERIOD_APPROACHING
  const periodDays = Math.min(
    PERIOD_DAYS_MAX,
    Math.max(PERIOD_DAYS_MIN, Math.round(prefs.periodApproachingDays ?? DEFAULT_PERIOD_DAYS))
  )

  const todayMid = atMidnight(today)
  const todayISO = toISO(todayMid)

  // Reuse the shared prediction — dated phase ranges + current phase for THIS cycle.
  const pred = getCyclePrediction(
    {
      startDate: eff.anchorDate,
      cycleLength: eff.cycleLength,
      periodLength: eff.currentPeriodLength,
    },
    todayMid
  )

  const periodItems: NotificationItem[] = []
  const phaseItems: NotificationItem[] = []
  const rhythmItems: NotificationItem[] = []

  // ── PERIOD APPROACHING ──────────────────────────────────────────────────────
  // Project the next predicted start by stepping cycleLength from the anchor until it
  // lands on/after today. Unlike getCyclePrediction's roll-forward start (always
  // strictly future), this can equal today so "starting around now" can fire.
  if (periodOn) {
    let next = addDays(parseYMD(eff.anchorDate), eff.cycleLength)
    while (diffDays(next, todayMid) < 0) next = addDays(next, eff.cycleLength)
    const daysUntil = diffDays(next, todayMid)

    if (daysUntil === 0) {
      periodItems.push({
        id: `period_approaching|${eff.anchorDate}|${todayISO}`,
        type: 'period_approaching',
        title: 'Period approaching',
        body: 'Your period may be starting around now.',
        date: todayISO,
      })
    } else if (daysUntil >= 1 && daysUntil <= periodDays) {
      periodItems.push({
        id: `period_approaching|${eff.anchorDate}|${todayISO}`,
        type: 'period_approaching',
        title: 'Period approaching',
        body: `Your period is likely in about ${daysUntil} day${plural(daysUntil)}.`,
        date: todayISO,
      })
    }
  }

  // ── PHASE CHANGE ────────────────────────────────────────────────────────────
  // Only at the transition moment: the last day of the current phase ("starts
  // tomorrow"), or the first day of a phase ("you've entered…").
  if (phaseChangeOn) {
    const idx = pred.phaseRanges.findIndex((r) => r.phase === pred.currentPhase)
    const cur = idx >= 0 ? pred.phaseRanges[idx] : undefined
    if (cur) {
      if (cur.endDate === todayISO) {
        // Wrap past luteal into the next cycle's menstrual phase.
        const nextPhase: PhaseId =
          idx + 1 < pred.phaseRanges.length ? pred.phaseRanges[idx + 1].phase : 'menstrual'
        phaseItems.push({
          id: `phase_change|${eff.anchorDate}|${todayISO}|${nextPhase}`,
          type: 'phase_change',
          title: 'A new phase begins tomorrow',
          body: `Your ${PHASE_WORD[nextPhase]} phase starts tomorrow.`,
          phase: nextPhase,
          date: todayISO,
        })
      } else if (cur.startDate === todayISO) {
        phaseItems.push({
          id: `phase_change|${eff.anchorDate}|${todayISO}|${pred.currentPhase}`,
          type: 'phase_change',
          title: 'A new phase',
          body: `You've entered your ${PHASE_WORD[pred.currentPhase]} phase.`,
          phase: pred.currentPhase,
          date: todayISO,
        })
      }
    }
  }

  // ── RHYTHM NOTE (lowest priority) ────────────────────────────────────────────
  // A one-time gentle mention that an observation is waiting in Insights. Shown only
  // for a genuinely new observation the user hasn't acknowledged. Never time-critical,
  // never alarming — it always yields to period/phase items.
  if (
    rhythmNote &&
    rhythmNote.state === 'observation' &&
    rhythmNote.signature &&
    rhythmNote.signature !== prefs.rhythmNoteAck
  ) {
    rhythmItems.push({
      id: `rhythm_note|${rhythmNote.signature}`,
      type: 'rhythm_note',
      title: 'A gentle note',
      body: RHYTHM_NOTE_COPY.todayMention,
      date: todayISO,
      signature: rhythmNote.signature,
    })
  }

  return [...periodItems, ...phaseItems, ...rhythmItems]
}
