import type {
  PhaseId,
  TrainingProfile,
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

// A session idea that expands into a real workout. `how`/`tip` are absent only on the
// legacy 'mix' style's name-only rows (never selectable going forward).
export interface MoveSession {
  name: string
  how?: string
  tip?: string
}

export interface MoveGuidance {
  headline: string
  body: string
  sessions: MoveSession[]
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

// ── PER-STYLE GUIDANCE (headline · body · sessions[{name·how·tip}]) ────────────
const PER_STYLE: Record<TrainingStyle, Record<PhaseId, MoveGuidance>> = {
  strength: {
    menstrual: {
      headline: 'Lift if you want to.',
      body: "Plenty of women lift through their period and feel great. If you've got energy, train as normal. If you're wiped, keep the movements and drop the load — nothing's lost.",
      sessions: [
        {
          name: 'Normal session, autoregulated',
          how: 'Run your usual program. Warm up as normal, then let your first working set decide the day — if it moves well, carry on as planned; if it feels heavy, drop a set from each lift or shave ~10% off the bar.',
          tip: "Autoregulating means deciding set by set, not before you've touched the bar.",
        },
        {
          name: 'Compound work at ~80% of usual load',
          how: 'Pick 3–4 big lifts — a squat, a hinge, a press, a pull. 3–4 sets of 5–8 at about 80% of your usual working weight, 2–3 minutes rest, always leaving ~2 reps in the tank.',
          tip: 'A longer warm-up often makes the first sets feel dramatically better this week.',
        },
        {
          name: 'Technique / tempo work',
          how: 'Take 2–3 lifts down to ~50–60% and slow them right down — 3 seconds on the lowering, a pause at the bottom, drive up. 4–5 sets of 3–5.',
          tip: "A light day isn't a lost day — tempo work banks the skill your heavy days cash in.",
        },
      ],
    },
    follicular: {
      headline: 'Build.',
      body: "A strong window to add load or reps. If you're chasing progression, this is the stretch to lean into it.",
      sessions: [
        {
          name: 'Progressive overload',
          how: 'Take your main lifts up a notch from last week — a small load bump or one extra rep per set, whichever your program favors. Keep accessories where they were.',
          tip: 'Write it down. This is the stretch where PRs quietly get built.',
        },
        {
          name: 'Heavy compounds',
          how: 'Work up to a heavy set of 3–5 on one main lift, then take 2–3 back-off sets around 10–15% lighter. Keep accessories crisp and moderate.',
          tip: 'Full rests — 2 to 4 minutes — are what make heavy sets honest.',
        },
        {
          name: 'Add a set',
          how: "Same weights as usual, but add one extra set to your main lift and one accessory you care about. That's it — volume, not heroics.",
          tip: 'Extra volume lands best in weeks where sleep and food are handled.',
        },
      ],
    },
    ovulatory: {
      headline: 'Send it.',
      body: 'Often the best day of the month to test a max or hit a hard session. One note: some people notice joints feel a little looser around ovulation, so give yourself a proper warm-up.',
      sessions: [
        {
          name: 'PR attempt / heavy singles',
          how: 'Warm up thoroughly and build to one heavy single at ~9/10 effort — or a rep PR — on a single lift. Keep everything after it light and short.',
          tip: 'Some people notice joints feel a little looser around ovulation — treat the warm-up as part of the session, not a formality.',
        },
        {
          name: 'Max-effort compounds',
          how: 'Two main lifts, working to a heavy 2–4 reps on each. Long rests, sharp focus, and stop while the bar speed is still good.',
          tip: 'On peak days the temptation is to do everything — pick two lifts and do them properly.',
        },
        {
          name: 'High-intensity accessories',
          how: 'After your main work, superset accessory pairs (push/pull, quad/hamstring) with short rests — 3 rounds of 8–12 each, chasing the pump rather than the load.',
          tip: 'Intensity here means density — shrink the rest, not your form.',
        },
      ],
    },
    luteal: {
      headline: 'Steady, then taper.',
      body: "Early on, volume still feels good — maintain, don't chase PRs. In the last few days, pulling the load back ~10% and adding an extra set of accessories keeps the work in without the grind.",
      sessions: [
        {
          name: 'Volume / hypertrophy work',
          how: '3–4 sets of 8–12 at moderate weights across your usual lifts. Nothing maximal — just honest, controlled sets that add up.',
          tip: 'You may run warmer and tire a touch earlier this phase — water and food are performance tools now.',
        },
        {
          name: 'Moderate load, controlled tempo',
          how: 'Keep the bar around 65–75% and own every rep — controlled down, no bounce, full lockout. 3–4 sets of 6–10.',
          tip: 'When energy is medium, control is the quality worth chasing.',
        },
        {
          name: 'Accessories + mobility',
          how: 'A shorter session: 3–4 accessory movements you enjoy, 2–3 sets each, finished with 10 minutes of mobility for whatever feels tight.',
          tip: 'In the last few days before your period, this session often feels better than forcing the big lifts.',
        },
      ],
    },
  },
  running: {
    menstrual: {
      headline: 'Run if it feels good.',
      body: "Some people run their best on day two; others want a rest day. Neither is wrong. If you're going, easy miles are a safe default — but don't talk yourself out of a hard one if you feel it.",
      sessions: [
        {
          name: 'Easy miles',
          how: 'A relaxed run at fully conversational pace — you should be able to speak in full sentences. 30–45 minutes, flat if you like.',
          tip: 'If day one or two feels rough, shorter and slower still counts.',
        },
        {
          name: 'Short shakeout run',
          how: '15–20 easy minutes, just to move. No watch-chasing, no strides — think of it as circulation, not training.',
          tip: 'A shakeout often turns "I don\'t feel like it" into "glad I went."',
        },
        {
          name: 'Rest day (no guilt)',
          how: "Take the day. Walk if you feel like moving; stretch if you don't. Your training doesn't unravel from one quiet day.",
          tip: 'Rest chosen on purpose is training too.',
        },
      ],
    },
    follicular: {
      headline: 'Build your base.',
      body: 'Rising energy makes this a natural stretch for adding mileage or sharpening speed.',
      sessions: [
        {
          name: 'Tempo run',
          how: "Warm up 10 minutes easy, then 15–25 minutes at comfortably-hard — a pace you could hold for an hour but wouldn't chat at. Cool down easy.",
          tip: 'Tempo should feel strong, not desperate — finish knowing you had a little more.',
        },
        {
          name: 'Progressive long run',
          how: 'Your usual long run, but run the last third noticeably quicker than the first. Start slower than feels necessary.',
          tip: 'The discipline is in the easy first half.',
        },
        {
          name: 'Interval session',
          how: 'Warm up well, then 4–6 × 3 minutes hard with 2 minutes easy jog between. Hard means repeatable — the last rep should match the first.',
          tip: 'Rising-energy weeks are the right time to sharpen speed.',
        },
      ],
    },
    ovulatory: {
      headline: 'Race pace.',
      body: 'Often peak output — a great window for a time trial or your hardest session. Warm up thoroughly.',
      sessions: [
        {
          name: 'Time trial / race pace',
          how: 'After a thorough warm-up, run a set distance — a 5k, or your benchmark loop — at an honest maximal-but-even effort.',
          tip: 'Peak-energy days are made for finding out where you are.',
        },
        {
          name: 'Hard intervals',
          how: '6–8 × 2 minutes at close to your fastest sustainable effort, 90 seconds easy between. Stop a rep early if form falls apart.',
          tip: 'Warm up longer than usual — fast running deserves a full runway.',
        },
        {
          name: 'Hill repeats',
          how: 'Find a hill that takes 45–60 seconds to climb hard. 6–10 efforts, walking or jogging down for recovery.',
          tip: 'Hills give you speed work with less impact — a strong choice on peak days.',
        },
      ],
    },
    luteal: {
      headline: 'Steady, then easy.',
      body: "You may notice you run a little warmer and your heart rate sits higher for the same pace — that's normal, not a fitness loss. Steady aerobic work suits this phase; take the last days easy.",
      sessions: [
        {
          name: 'Steady-state aerobic run',
          how: '30–50 minutes at a steady, controlled effort — comfortable but purposeful. Let heart rate drift where it wants; go by feel, not the number.',
          tip: "You may notice your heart rate sits higher for the same pace this phase — that's normal physiology, not lost fitness.",
        },
        {
          name: 'Easy conversational miles',
          how: 'A genuinely easy run, 20–40 minutes. If in doubt, slower.',
          tip: 'Easy days keep the habit alive while your body runs warmer.',
        },
        {
          name: 'Cross-train / recovery run',
          how: 'Swap in a bike, swim, or elliptical at easy effort for 30 minutes, or a very short easy jog — whatever your legs vote for.',
          tip: 'Late luteal is a natural window to trade impact for movement.',
        },
      ],
    },
  },
  classes: {
    menstrual: {
      headline: 'Show up if you want to.',
      body: "Go to the class you'd normally go to. If your energy's low, take the option to scale — most instructors expect it.",
      sessions: [
        {
          name: 'Your usual class, scaled to feel',
          how: "Book the class you'd normally take. Use the lighter option on anything that feels like too much today — smaller spring, lower resistance, the modification.",
          tip: 'Instructors build in scaling because they expect it — take it without apology.',
        },
        {
          name: 'Slower flow / restorative',
          how: 'Swap the intense class for a slow flow, yin, or restorative session. Long holds, deep breathing, zero performance.',
          tip: 'A slow class on a low day often gives back more than it takes.',
        },
        {
          name: 'Rest day',
          how: 'Skip the studio. Stretch at home for ten minutes if you want to move at all.',
          tip: 'One missed class costs nothing; the habit is what matters.',
        },
      ],
    },
    follicular: {
      headline: 'Take the harder option.',
      body: 'Energy is climbing — a good stretch to push in class or try something new.',
      sessions: [
        {
          name: 'High-intensity class',
          how: 'Take the harder class on the schedule — the HIIT format, the advanced level — and use the full-effort options throughout.',
          tip: 'Rising energy is the time to take the option you usually skip.',
        },
        {
          name: 'Try a new format',
          how: "Book something you've never done — reformer, boxing, sculpt. Beginner's effort is its own workout.",
          tip: 'New skills tend to stick better in high-energy stretches.',
        },
        {
          name: 'Add a second class',
          how: 'Stack a second, lighter class this week — a stretch or flow after your usual — rather than doubling intensity in one day.',
          tip: '"More" works best as more sessions, not more suffering.',
        },
      ],
    },
    ovulatory: {
      headline: 'Front row.',
      body: 'Peak energy — this is the day to take the hardest version of every option.',
      sessions: [
        {
          name: 'Hardest class on the schedule',
          how: 'The advanced slot, the instructor who scares you a little — take it, front row, full options.',
          tip: 'Peak days are for the version of the class you usually watch other people do.',
        },
        {
          name: 'Power / sculpt formats',
          how: 'Choose the strength-forward format — power yoga, sculpt, heavy-spring reformer — and take the heavier choices on offer.',
          tip: 'Some people notice joints feel a little looser around ovulation, so ease into the deepest ranges.',
        },
        {
          name: "Back-to-back if you're up for it",
          how: 'Two classes in a row — hard one first, gentle one second. Eat and drink between.',
          tip: 'The second class should feel like a reward, not a punishment.',
        },
      ],
    },
    luteal: {
      headline: 'Steady, then soften.',
      body: 'Plenty in the tank early in the phase. As your period approaches, a slower class often feels better than forcing the hard one.',
      sessions: [
        {
          name: 'Your regular class',
          how: 'Keep the routine — the usual class at the usual effort. Consistency is the win this phase.',
          tip: 'Familiar work feels best when energy turns quieter.',
        },
        {
          name: 'Strength-focused / pilates',
          how: 'Favor the controlled, strength-forward formats — mat or reformer pilates, barre — where precision beats intensity.',
          tip: 'Control-based classes tend to age well across the luteal phase.',
        },
        {
          name: 'Slow flow or stretch',
          how: 'In the last few days before your period, book the slow flow or stretch class instead of forcing the hard one.',
          tip: 'Choosing the gentle class on purpose is not the same as giving up.',
        },
      ],
    },
  },
  hybrid: {
    menstrual: {
      headline: 'Your call.',
      body: "Train as normal if you've got it. If not, scale the metcon and keep the lifting — no need to skip the session entirely.",
      sessions: [
        {
          name: 'Normal WOD, scaled to feel',
          how: 'Do the programmed workout, scaling load or rounds to how you feel in the warm-up — not to how you think you should feel.',
          tip: 'Scaling is programming, not failing — every good coach agrees.',
        },
        {
          name: 'Lifting only, skip the conditioning',
          how: 'Keep the strength piece at your usual loads and skip the metcon. In and out.',
          tip: 'On low-energy days, strength holds up far better than engine work.',
        },
        {
          name: 'Skill work',
          how: '20–30 minutes practicing something technical at low intensity — double-unders, kipping drills, positions.',
          tip: 'Skill practice on quiet days pays out on loud ones.',
        },
      ],
    },
    follicular: {
      headline: 'Build.',
      body: 'A strong stretch for adding load and pushing the engine.',
      sessions: [
        {
          name: 'Heavy strength + metcon',
          how: 'The classic pairing — build to something heavy, then hit a moderate metcon. Push both a notch harder than last week.',
          tip: 'This stretch is where adding load feels most natural.',
        },
        {
          name: 'Benchmark WOD',
          how: 'Pick a benchmark you know and go for a better score with honest pacing — even splits beat a hero first round.',
          tip: 'Log the result; follicular scores are your building blocks.',
        },
        {
          name: 'Skill under fatigue',
          how: 'Pair a skill (pull-ups, wall walks) with a simple engine piece and practice keeping form while breathing hard.',
          tip: 'The skill you can hold when tired is the one you actually own.',
        },
      ],
    },
    ovulatory: {
      headline: 'Peak output.',
      body: 'Often your best day for a benchmark or a heavy lift. Warm up thoroughly — some people notice joints feel looser here.',
      sessions: [
        {
          name: 'Benchmark / PR attempt',
          how: "Peak day: retest your toughest benchmark or attempt a lifting PR. Warm up long, commit fully, stop while it's still crisp.",
          tip: 'Some notice joints feel looser around ovulation — warm-up is part of the workout today.',
        },
        {
          name: 'Heavy lifting day',
          how: 'Make it a pure strength day — work to heavy doubles or triples on one or two lifts, minimal conditioning.',
          tip: 'Peak output likes focus: fewer pieces, done harder.',
        },
        {
          name: 'Hard conditioning',
          how: 'A short, honest engine piece — intervals or a sprint-repeat metcon where you actually empty the tank.',
          tip: 'Short and savage beats long and mediocre on peak days.',
        },
      ],
    },
    luteal: {
      headline: 'Steady, then back off.',
      body: 'Volume still feels fine early. Later in the phase, dial the conditioning back and keep the strength work in.',
      sessions: [
        {
          name: 'Moderate strength + shorter metcon',
          how: 'Keep the strength work at moderate loads and cap the metcon around 10 minutes. Solid, not maximal.',
          tip: "You may run warmer this phase — pace the metcon like it's a degree hotter in the room.",
        },
        {
          name: 'Aerobic conditioning',
          how: 'Swap intensity for breath — 20–30 minutes of steady rowing, biking, or easy mixed movement at a pace you could hold while talking.',
          tip: 'Engine built quietly here shows up loudly later.',
        },
        {
          name: 'Mobility + accessories',
          how: 'A short accessory circuit (2–3 rounds of pulls, carries, core) plus 10–15 minutes of mobility.',
          tip: 'In the final days before your period, this session usually beats forcing the WOD.',
        },
      ],
    },
  },
  sport: {
    menstrual: {
      headline: 'Play.',
      body: 'Train and compete as you normally would. Scale your extra conditioning if you need to, but your sport is your sport.',
      sessions: [
        {
          name: 'Normal practice',
          how: "Train with your team or your usual schedule. Tell your body's story with effort, not the calendar's.",
          tip: 'Plenty of athletes compete — and win — on their period. Play if you feel like playing.',
        },
        {
          name: 'Skills / technical work',
          how: 'A lighter technical session — touches, drills, positions, film — at practice pace rather than match pace.',
          tip: 'Technique sessions are low-cost deposits you can make on any energy level.',
        },
        {
          name: 'Lighter conditioning',
          how: 'If extra conditioning is scheduled, cut its volume, keep the sport. Your sport is the priority.',
          tip: 'Scale the extras, never the thing you love.',
        },
      ],
    },
    follicular: {
      headline: 'Sharpen.',
      body: 'Rising energy suits harder practices and skill acquisition — a natural time to learn something new.',
      sessions: [
        {
          name: 'High-intensity practice',
          how: 'Take the hard practice at full effort — pressing drills, match-pace work, the sessions that build sharpness.',
          tip: 'Rising-energy weeks are where hard practices convert best.',
        },
        {
          name: 'Skill development',
          how: 'Pick one skill to level up and give it focused reps this week while learning comes easier.',
          tip: 'New patterns stick fastest in this stretch — choose ambitiously.',
        },
        {
          name: 'Strength work',
          how: 'Get your gym session in alongside practice — main lifts at building loads to support your sport.',
          tip: 'The strength you add now carries your whole cycle.',
        },
      ],
    },
    ovulatory: {
      headline: 'Compete.',
      body: 'Often peak output and reaction time. A good window for competition or your hardest session — with a thorough warm-up.',
      sessions: [
        {
          name: 'Competition / scrimmage',
          how: "If there's a match, a race, or a scrimmage available — this is a strong window for it. Warm up thoroughly and compete.",
          tip: 'Many athletes find reaction time and output peak around now.',
        },
        {
          name: 'Hardest practice',
          how: 'Take the toughest session of the week at full commitment.',
          tip: 'Some notice joints feel a little looser around ovulation — respect the warm-up before explosive work.',
        },
        {
          name: 'Speed & power work',
          how: 'Sprints, jumps, throws — short, explosive efforts with full recovery between.',
          tip: 'Power work wants freshness: quality over quantity, always.',
        },
      ],
    },
    luteal: {
      headline: 'Steady, then recover.',
      body: 'Solid practice volume early in the phase. Late luteal is a natural time to prioritise recovery between sessions.',
      sessions: [
        {
          name: 'Regular practice',
          how: 'Keep your normal training rhythm at honest effort. Nothing special needed — showing up is the program.',
          tip: "Fuel and hydrate a little more deliberately; you're running warmer.",
        },
        {
          name: 'Technical / tactical work',
          how: 'Favor the thinking sessions — set plays, tactics, positioning, film — where precision matters more than output.',
          tip: 'Quiet-energy days are excellent for the mental side of your sport.',
        },
        {
          name: 'Recovery session',
          how: 'An easy recovery day between hard practices — light movement, stretching, maybe pool work.',
          tip: 'Late luteal rewards the athlete who recovers on purpose.',
        },
      ],
    },
  },
  // Legacy fallback only — 'mix' is never selectable going forward. Its menstrual
  // sessions carry one-line Hows (approved) with NO tips; other phases stay name-only.
  mix: {
    menstrual: {
      headline: 'Whatever you feel like.',
      body: "Do the thing you're drawn to. If that's a heavy lift, lift. If it's a walk, walk. Both count.",
      sessions: [
        {
          name: 'Whatever appeals',
          how: "Do the thing you're drawn to today at whatever effort feels right.",
        },
        { name: 'Something gentle', how: 'A walk, a stretch, an easy anything.' },
        { name: 'Rest', how: 'Take the day; it counts.' },
      ],
    },
    follicular: {
      headline: 'Try something.',
      body: "Rising energy is a great excuse to start something new or go harder at what you're already doing.",
      sessions: [
        { name: 'Something new' },
        { name: 'A harder session than usual' },
        { name: 'Strength work' },
      ],
    },
    ovulatory: {
      headline: 'Go big.',
      body: 'Your highest-energy window — a good day for whatever your hardest thing is.',
      sessions: [
        { name: 'Your hardest session' },
        { name: 'Something social / high-energy' },
        { name: 'Strength or intervals' },
      ],
    },
    luteal: {
      headline: 'Steady, then gentle.',
      body: 'Steady movement suits this phase. Ease into gentler things as your period approaches.',
      sessions: [
        { name: 'Steady cardio or lifting' },
        { name: 'Walk / hike' },
        { name: 'Stretch, yoga, mobility' },
      ],
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
  q1: 'How do you train? Pick all that apply.',
  q2: 'How would you describe yourself?',
  q3: 'How many days a week do you usually train?',
  skip: 'Skip for now',
  promptHeading: 'Make this yours',
  promptBody:
    "Tell Move how you train and you'll get guidance that fits your actual training — not generic advice.",
  promptButton: 'Set up training',
} as const

// Selectable styles — 'mix' is legacy-only and never offered in a picker.
export const SELECTABLE_TRAINING_STYLES: TrainingStyle[] = [
  'strength',
  'running',
  'classes',
  'hybrid',
  'sport',
]

export const TRAINING_STYLE_OPTIONS: { value: TrainingStyle; label: string }[] = [
  { value: 'strength', label: 'Strength / lifting' },
  { value: 'running', label: 'Running / endurance' },
  { value: 'classes', label: 'Classes (spin, pilates, yoga, etc.)' },
  { value: 'hybrid', label: 'Hybrid / CrossFit' },
  { value: 'sport', label: 'A sport' },
]

// Short labels for the Move screen's style switcher chips.
export const TRAINING_STYLE_SHORT: Record<TrainingStyle, string> = {
  strength: 'Strength',
  running: 'Running',
  classes: 'Classes',
  hybrid: 'Hybrid',
  sport: 'Sport',
  mix: 'Mix',
}

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

/** A training profile with legacy shapes resolved to the multi-style form. */
export interface NormalizedTrainingProfile {
  styles: TrainingStyle[] // empty = none set (general guidance + setup prompt)
  seriousness?: TrainingSeriousness
  daysPerWeek?: TrainingDaysPerWeek
}

/**
 * The ONE place legacy profiles are interpreted:
 *   • { styles: [...] }        → kept (filtered to valid selectable styles, deduped)
 *   • legacy { style: 'x' }    → { styles: ['x'] }
 *   • legacy { style: 'mix' }  → NO styles (general guidance + "pick your styles" prompt)
 *   • unset / null             → NO styles
 */
export function normalizeTrainingProfile(
  profile?: TrainingProfile | null
): NormalizedTrainingProfile {
  if (!profile) return { styles: [] }

  const valid = new Set<TrainingStyle>(SELECTABLE_TRAINING_STYLES)
  let styles: TrainingStyle[] = []
  if (Array.isArray(profile.styles)) {
    styles = [...new Set(profile.styles.filter((s) => valid.has(s)))]
  }
  // Legacy single-style field — only consulted when no valid styles array exists.
  // 'mix' intentionally fails the valid check → treated as no styles set.
  if (styles.length === 0 && profile.style && valid.has(profile.style)) {
    styles = [profile.style]
  }

  return { styles, seriousness: profile.seriousness, daysPerWeek: profile.daysPerWeek }
}

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
