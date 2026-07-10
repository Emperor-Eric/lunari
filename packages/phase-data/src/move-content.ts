import type {
  PhaseId,
  TrainingStyle,
  TrainingSeriousness,
  TrainingDaysPerWeek,
} from '@lunari/types'
import type { PhaseHalf } from './helpers'

// ─── Personalized Move content ────────────────────────────────────────────────
// The phase never changes WHAT she does — it modulates HOW HARD, within her training
// style. Menstrual defaults to dial 3 "Your call" (never "rest"). How she feels today
// always overrides the phase. All copy below is approved/verbatim — do not paraphrase.

export interface MoveDial {
  bars: number // out of 5
  label: string
}

export interface MoveGuidance {
  headline: string
  body: string
  sessions: string[]
}

export interface MoveResult {
  dial: MoveDial
  tagline: string
  why: string
  guidance?: MoveGuidance // present only when a training style is set
  promptSetup: boolean // true when no style is set (show the "Make this yours" prompt)
}

// ── THE DIAL (bars out of 5 + label) ──────────────────────────────────────────
// Luteal splits by phase-half; every other phase is fixed.
const DIAL_MENSTRUAL: MoveDial = { bars: 3, label: 'Your call · listen in' }
const DIAL_FOLLICULAR: MoveDial = { bars: 4, label: 'Building · push' }
const DIAL_OVULATORY: MoveDial = { bars: 5, label: 'Peak · go for it' }
const DIAL_LUTEAL_EARLY: MoveDial = { bars: 4, label: 'Steady · solid volume' }
const DIAL_LUTEAL_LATE: MoveDial = { bars: 2, label: 'Ease off · recover' }

// ── TAGLINES ──────────────────────────────────────────────────────────────────
const MOVE_TAGLINE: Record<PhaseId, string> = {
  menstrual: 'your call — train if you feel like it',
  follicular: "energy's rising — build something",
  ovulatory: 'your strongest window — use it',
  luteal: 'steady work, then ease into recovery',
}

// ── WHY NOTES ─────────────────────────────────────────────────────────────────
const MOVE_WHY: Record<PhaseId, string> = {
  menstrual:
    "Hormones are at their lowest, and energy varies a lot person to person. Many people train right through and feel fine — some don't. Both are normal.",
  follicular:
    'Estrogen is climbing, and many people notice strength, stamina, and recovery all feel easier through this stretch.',
  ovulatory:
    'Estrogen peaks and a little testosterone joins it — often the highest-output days of the cycle. Warm up properly and enjoy it.',
  luteal:
    'Progesterone rises and body temperature runs a touch higher. Volume often still feels good early on; the last few days are a natural time to back off.',
}

// ── PER-STYLE GUIDANCE (headline · body · sessions[]) ──────────────────────────
const PER_STYLE: Record<TrainingStyle, Record<PhaseId, MoveGuidance>> = {
  strength: {
    menstrual: {
      headline: 'Lift if you want to.',
      body: "Plenty of women lift through their period and feel great. If you've got energy, train as normal. If you're wiped, keep the movements and drop the load — nothing's lost.",
      sessions: [
        'Normal session, autoregulated',
        'Compound work at ~80% of usual load',
        'Technique / tempo work',
      ],
    },
    follicular: {
      headline: 'Build.',
      body: "A strong window to add load or reps. If you're chasing progression, this is the stretch to lean into it.",
      sessions: ['Progressive overload', 'Heavy compounds', 'Add a set'],
    },
    ovulatory: {
      headline: 'Send it.',
      body: 'Often the best day of the month to test a max or hit a hard session. One note: some people notice joints feel a little looser around ovulation, so give yourself a proper warm-up.',
      sessions: [
        'PR attempt / heavy singles',
        'Max-effort compounds',
        'High-intensity accessories',
      ],
    },
    luteal: {
      headline: 'Steady, then taper.',
      body: "Early on, volume still feels good — maintain, don't chase PRs. In the last few days, pulling the load back ~10% and adding an extra set of accessories keeps the work in without the grind.",
      sessions: [
        'Volume / hypertrophy work',
        'Moderate load, controlled tempo',
        'Accessories + mobility',
      ],
    },
  },
  running: {
    menstrual: {
      headline: 'Run if it feels good.',
      body: "Some people run their best on day two; others want a rest day. Neither is wrong. If you're going, easy miles are a safe default — but don't talk yourself out of a hard one if you feel it.",
      sessions: ['Easy miles', 'Short shakeout run', 'Rest day (no guilt)'],
    },
    follicular: {
      headline: 'Build your base.',
      body: 'Rising energy makes this a natural stretch for adding mileage or sharpening speed.',
      sessions: ['Tempo run', 'Progressive long run', 'Interval session'],
    },
    ovulatory: {
      headline: 'Race pace.',
      body: 'Often peak output — a great window for a time trial or your hardest session. Warm up thoroughly.',
      sessions: ['Time trial / race pace', 'Hard intervals', 'Hill repeats'],
    },
    luteal: {
      headline: 'Steady, then easy.',
      body: "You may notice you run a little warmer and your heart rate sits higher for the same pace — that's normal, not a fitness loss. Steady aerobic work suits this phase; take the last days easy.",
      sessions: [
        'Steady-state aerobic run',
        'Easy conversational miles',
        'Cross-train / recovery run',
      ],
    },
  },
  classes: {
    menstrual: {
      headline: 'Show up if you want to.',
      body: "Go to the class you'd normally go to. If your energy's low, take the option to scale — most instructors expect it.",
      sessions: ['Your usual class, scaled to feel', 'Slower flow / restorative', 'Rest day'],
    },
    follicular: {
      headline: 'Take the harder option.',
      body: 'Energy is climbing — a good stretch to push in class or try something new.',
      sessions: ['High-intensity class', 'Try a new format', 'Add a second class'],
    },
    ovulatory: {
      headline: 'Front row.',
      body: 'Peak energy — this is the day to take the hardest version of every option.',
      sessions: [
        'Hardest class on the schedule',
        'Power / sculpt formats',
        "Back-to-back if you're up for it",
      ],
    },
    luteal: {
      headline: 'Steady, then soften.',
      body: 'Plenty in the tank early in the phase. As your period approaches, a slower class often feels better than forcing the hard one.',
      sessions: ['Your regular class', 'Strength-focused / pilates', 'Slow flow or stretch'],
    },
  },
  hybrid: {
    menstrual: {
      headline: 'Your call.',
      body: "Train as normal if you've got it. If not, scale the metcon and keep the lifting — no need to skip the session entirely.",
      sessions: ['Normal WOD, scaled to feel', 'Lifting only, skip the conditioning', 'Skill work'],
    },
    follicular: {
      headline: 'Build.',
      body: 'A strong stretch for adding load and pushing the engine.',
      sessions: ['Heavy strength + metcon', 'Benchmark WOD', 'Skill under fatigue'],
    },
    ovulatory: {
      headline: 'Peak output.',
      body: 'Often your best day for a benchmark or a heavy lift. Warm up thoroughly — some people notice joints feel looser here.',
      sessions: ['Benchmark / PR attempt', 'Heavy lifting day', 'Hard conditioning'],
    },
    luteal: {
      headline: 'Steady, then back off.',
      body: 'Volume still feels fine early. Later in the phase, dial the conditioning back and keep the strength work in.',
      sessions: [
        'Moderate strength + shorter metcon',
        'Aerobic conditioning',
        'Mobility + accessories',
      ],
    },
  },
  sport: {
    menstrual: {
      headline: 'Play.',
      body: 'Train and compete as you normally would. Scale your extra conditioning if you need to, but your sport is your sport.',
      sessions: ['Normal practice', 'Skills / technical work', 'Lighter conditioning'],
    },
    follicular: {
      headline: 'Sharpen.',
      body: 'Rising energy suits harder practices and skill acquisition — a natural time to learn something new.',
      sessions: ['High-intensity practice', 'Skill development', 'Strength work'],
    },
    ovulatory: {
      headline: 'Compete.',
      body: 'Often peak output and reaction time. A good window for competition or your hardest session — with a thorough warm-up.',
      sessions: ['Competition / scrimmage', 'Hardest practice', 'Speed & power work'],
    },
    luteal: {
      headline: 'Steady, then recover.',
      body: 'Solid practice volume early in the phase. Late luteal is a natural time to prioritise recovery between sessions.',
      sessions: ['Regular practice', 'Technical / tactical work', 'Recovery session'],
    },
  },
  mix: {
    menstrual: {
      headline: 'Whatever you feel like.',
      body: "Do the thing you're drawn to. If that's a heavy lift, lift. If it's a walk, walk. Both count.",
      sessions: ['Whatever appeals', 'Something gentle', 'Rest'],
    },
    follicular: {
      headline: 'Try something.',
      body: "Rising energy is a great excuse to start something new or go harder at what you're already doing.",
      sessions: ['Something new', 'A harder session than usual', 'Strength work'],
    },
    ovulatory: {
      headline: 'Go big.',
      body: 'Your highest-energy window — a good day for whatever your hardest thing is.',
      sessions: ['Your hardest session', 'Something social / high-energy', 'Strength or intervals'],
    },
    luteal: {
      headline: 'Steady, then gentle.',
      body: 'Steady movement suits this phase. Ease into gentler things as your period approaches.',
      sessions: ['Steady cardio or lifting', 'Walk / hike', 'Stretch, yoga, mobility'],
    },
  },
}

// ── OVERRIDE COPY ─────────────────────────────────────────────────────────────
export const MOVE_OVERRIDE_COPY = {
  control: 'Not feeling it today?',
  strong: 'Feeling strong',
  normal: 'Feeling normal',
  low: 'Low energy today',
  lowResponse: 'Listen to that. Your body knows more than the calendar.',
  strongResponse: 'Then go. The phase is a guide, not a rule.',
  microcopy:
    'This is a guide, not a prescription. How you feel today beats what the calendar says.',
} as const

// ── PROFILE SETUP COPY ────────────────────────────────────────────────────────
export const MOVE_SETUP_COPY = {
  intro:
    'Move works best when it knows how you train. Three quick questions — you can change these anytime.',
  q1: "What's your main training style?",
  q2: 'How would you describe yourself?',
  q3: 'How many days a week do you usually train?',
  skip: 'Skip for now',
  promptHeading: 'Make this yours',
  promptBody:
    "Tell Move how you train and you'll get guidance that fits your actual training — not generic advice.",
  promptButton: 'Set up training',
} as const

export const TRAINING_STYLE_OPTIONS: { value: TrainingStyle; label: string }[] = [
  { value: 'strength', label: 'Strength / lifting' },
  { value: 'running', label: 'Running / endurance' },
  { value: 'classes', label: 'Classes (spin, pilates, yoga, etc.)' },
  { value: 'hybrid', label: 'Hybrid / CrossFit' },
  { value: 'sport', label: 'A sport' },
  { value: 'mix', label: 'A mix of things' },
]

export const TRAINING_SERIOUSNESS_OPTIONS: { value: TrainingSeriousness; label: string }[] = [
  { value: 'casual', label: 'Casual — I move when I feel like it' },
  { value: 'consistent', label: 'Consistent — I train regularly' },
  { value: 'serious', label: 'Serious — training is a priority' },
  { value: 'competitive', label: 'Competitive — I train to perform' },
]

export const TRAINING_DAYS_OPTIONS: { value: TrainingDaysPerWeek; label: string }[] = [
  { value: '1-2', label: '1–2' },
  { value: '3-4', label: '3–4' },
  { value: '5-6', label: '5–6' },
  { value: '7', label: '7' },
]

/**
 * Resolves the Move screen content for a training style + current phase. Luteal uses
 * the phase-half for its dial. A null style returns general phase content (dial +
 * tagline + why) with promptSetup=true so the UI can show the "Make this yours" prompt.
 */
export function getMoveGuidance(
  style: TrainingStyle | null,
  phaseId: PhaseId,
  half: PhaseHalf
): MoveResult {
  const dial =
    phaseId === 'luteal'
      ? half === 'late'
        ? DIAL_LUTEAL_LATE
        : DIAL_LUTEAL_EARLY
      : phaseId === 'menstrual'
        ? DIAL_MENSTRUAL
        : phaseId === 'follicular'
          ? DIAL_FOLLICULAR
          : DIAL_OVULATORY
  const tagline = MOVE_TAGLINE[phaseId]
  const why = MOVE_WHY[phaseId]

  if (!style) return { dial, tagline, why, promptSetup: true }
  return { dial, tagline, why, guidance: PER_STYLE[style][phaseId], promptSetup: false }
}
