import type { PhaseId } from '@lunari/types'

// ─── Daily micro-education content ───────────────────────────────────────────
// Static, approved copy — no DB, no API. Each phase carries an `early` and a
// `late` card; the selector picks one from where the user sits within the phase.

export interface EducationCard {
  title: string
  teaser: string // one-line hook shown on the Today teaser
  body: string // the full explanation shown in the opened card
  tip: string // an actionable "Today's tip"
}

export interface PhaseEducation {
  early: EducationCard
  late: EducationCard
}

export const PHASE_EDUCATION: Record<PhaseId, PhaseEducation> = {
  menstrual: {
    early: {
      title: 'Day one, low tide',
      teaser: 'Your cycle begins — and your hormones are at their lowest.',
      body: "Your period marks day one of a brand-new cycle, with estrogen and progesterone both at their lowest point of the month. That's a big reason energy can feel thin and motivation quiet right now — and if you're crampy, that's prostaglandins helping your body do its work. None of it is you falling behind; it's the natural low tide before everything builds back up.",
      tip: 'Permission to go slow. Warmth and gentle movement — a walk, easy stretching, a hot drink — often feel better than pushing.',
    },
    late: {
      title: 'Turning outward',
      teaser: 'Estrogen is beginning to climb, and energy may start to return.',
      body: 'As your period winds down, flow lightens and estrogen begins its slow climb as new follicles develop. Many people notice the first hints of energy and brighter mood returning, though some still want rest — both are fine. The inward, restful stretch is quietly handing off to a more energized one.',
      tip: "If a spark of motivation shows up, follow it gently. A good moment to think about what you'd like to start this cycle.",
    },
  },
  follicular: {
    early: {
      title: 'Building',
      teaser: 'Estrogen is rising, and your energy often rides along with it.',
      body: "You're in the follicular phase, where rising estrogen (with a hormone called FSH maturing a follicle) is often felt as more energy, better mood, and a clearer head. Your body is in a building, outward-facing mode. This is often when new things feel easiest and fresh-start energy is at its highest.",
      tip: 'A naturally motivated window — a good time to begin projects, brainstorm, or say yes to plans.',
    },
    late: {
      title: 'Near the peak',
      teaser: 'Strength, skin, and focus often feel their best right now.',
      body: 'Estrogen is climbing toward its peak, which for many brings sharper focus, clearer skin, better strength and recovery, and rising confidence and libido. Your body is finishing its preparation for ovulation. This is often one of the most capable, vibrant stretches of the whole cycle.',
      tip: 'A strong window for anything demanding — hard workouts, big conversations, creative or focused work.',
    },
  },
  ovulatory: {
    early: {
      title: 'Peak',
      teaser: 'Ovulation — often the highest-energy point of your cycle.',
      body: 'Around now an egg is released: estrogen peaks, a little testosterone lifts drive, and many people feel their most energetic, confident, and social. This is the summer of your cycle. (Ovulation timing varies a lot person to person — this is a typical map, not a guarantee.)',
      tip: 'A natural time for connection, big asks, and putting yourself out there. If you track fertility, this is part of your fertile window.',
    },
    late: {
      title: 'The turn',
      teaser: 'Progesterone is stepping in — the wind-down begins.',
      body: 'Just after ovulation, estrogen dips and progesterone starts to rise as your body shifts toward the luteal phase. Progesterone has a steadying, sometimes sedating quality, so you may feel the outward energy gently pulling inward. The peak has passed, and a slower rhythm is beginning.',
      tip: 'A good time to start wrapping up the big, outward pushes of this cycle.',
    },
  },
  luteal: {
    early: {
      title: 'Settling in',
      teaser: 'A calmer, more grounded phase — and yes, more appetite.',
      body: 'Progesterone is climbing, bringing a steadier, more inward feeling and a pull toward comfort and routine. Your metabolism runs a little higher now, so feeling hungrier is normal — not a lack of willpower. This is the autumn of your cycle: productive, but in a quieter, more nurturing way.',
      tip: "Honor the hunger with satisfying, steady meals — this isn't the phase to under-fuel. Great for focused, heads-down work.",
    },
    late: {
      title: 'The premenstrual window',
      teaser: 'Falling hormones can bring cravings, bloating, or mood shifts.',
      body: "In the days before your period, progesterone and estrogen decline, and that drop is a common driver of classic premenstrual experiences — cravings, bloating, irritability, or low mood. These are real, physiological, and shared by many; naming what's happening can take some of the sting out of it. Your body is preparing to begin again.",
      tip: 'Extra gentleness with yourself pays off now. Lower the bar on the non-essentials, and lean on comfort and rest.',
    },
  },
}

/** Short disclaimer surfaced on the full card. */
export const EDUCATION_DISCLAIMER =
  "General education about a typical cycle — everyone's different, and this isn't medical advice."

/**
 * Picks the education card for where the user sits within their current phase.
 * `dayWithinPhase` is 1-indexed; the first half of the phase returns `early`,
 * the second half returns `late`. A 1-day phase returns `early`.
 * Inputs are clamped so out-of-range values never throw.
 */
export function getEducationCard(
  phaseId: PhaseId,
  dayWithinPhase: number,
  phaseLength: number
): EducationCard {
  const len = Math.max(1, Math.round(phaseLength))
  const day = Math.min(Math.max(1, Math.round(dayWithinPhase)), len)
  const half = Math.ceil(len / 2)
  const { early, late } = PHASE_EDUCATION[phaseId]
  return day <= half ? early : late
}
