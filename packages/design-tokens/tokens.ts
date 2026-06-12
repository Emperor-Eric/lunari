export type PhaseId = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal'

/** New "Goddess" phase keys. Note: ovulatory → "ovulation". */
export type PhaseKey = 'menstrual' | 'follicular' | 'ovulation' | 'luteal'

export interface PhaseColors {
  base: string
  light: string
  mid: string
}

const tokens = {
  colors: {
    brand: {
      gold: '#C9A84C',
      ink: '#2C2825',
      inkSoft: '#6B6460',
      stone: '#E8E2D6',
      cream: '#F5F0E8',
    },
    // Legacy per-phase colors — preserved so existing Tailwind classes
    // (phase-menstrual, etc.) keep resolving until components are rewired.
    phase: {
      menstrual: { base: '#7A1E2E', light: '#F5E8EA', mid: '#C4566A' },
      follicular: { base: '#3D6B4A', light: '#E4EFE6', mid: '#6A9E78' },
      ovulatory: { base: '#5B3E8C', light: '#EDE8F5', mid: '#9178C4' },
      luteal: { base: '#7A4A2A', light: '#F0E8DF', mid: '#B8805A' },
    },
    metallic: {
      gold: '#C9A84C',
      silver: '#C0C0C0',
    },
  },
  typography: {
    fonts: {
      // Goddess direction — Marcellus (serif) + Raleway (sans) replace
      // Playfair Display + Inter.
      display: 'Marcellus',
      body: 'Raleway',
      mono: 'JetBrains Mono',
    },
    weights: {
      light: 300,
      regular: 400,
      medium: 500,
    },
  },
  spacing: {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    6: 24,
    8: 32,
    12: 48,
    16: 64,
  },
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    full: '9999px',
  },
} as const

export default tokens

export function getPhaseColor(id: PhaseId): PhaseColors {
  return tokens.colors.phase[id]
}

// ─── New "Goddess" design system ──────────────────────────────────────────────
// These are additive. Components are NOT rewired yet — this only ships the values.

/** Shared neutral palette for the new system. */
export const palette = {
  gold: '#C9A84C',
  goldOnLight: '#A8791E',
  ink: '#2C2825',
  cream: '#FBF6EC',
  sand: '#EFE7D8',
  stone: '#E0D5C2',
  stage: '#120A10',
} as const

/** Font families for the new system. */
export const fonts = {
  display: 'Marcellus',
  body: 'Raleway',
  mono: 'JetBrains Mono',
} as const

/** Corner radii (numeric, px) for the new system. */
export const radius = {
  screen: 40,
  card: 14,
  button: 13,
  pill: 20,
} as const

export interface PhasePalette {
  label: string
  vibe: string
  /** Primary phase hex. */
  phase: string
  /** CSS gradient string (web only). */
  flood: string
  floodText: string
  floodSub: string
  /** Solid fallback for React Native (no CSS gradients) — equals `phase`. */
  floodSolid: string
  /** CSS gradient string (web only). */
  header: string
  headerText: string
  headerLabel: string
  labBg: string
  labCard: string
  labBorder: string
  labWhy: string
  labTrack: string
  accent: string
  text: string
  textMuted: string
  textSoft: string
}

/** Full per-phase palettes for the new system, keyed by PhaseKey. */
export const phases: Record<PhaseKey, PhasePalette> = {
  menstrual: {
    label: 'Menstrual',
    vibe: 'Rest + Renewal',
    phase: '#102B53',
    flood: 'linear-gradient(168deg,#16385f,#0d1f3d 58%,#091830)',
    floodText: '#F5EBD6',
    floodSub: '#8ba0c4',
    floodSolid: '#102B53',
    header: 'linear-gradient(165deg,#163763,#0d2143)',
    headerText: '#F5EBD6',
    headerLabel: '#C9A84C',
    labBg: '#EAEDF2',
    labCard: '#F7F9FC',
    labBorder: '#DCE1EA',
    labWhy: '#E2E6EF',
    labTrack: '#D6DCE6',
    accent: '#102B53',
    text: '#222831',
    textMuted: '#828A9A',
    textSoft: '#525A68',
  },
  follicular: {
    label: 'Follicular',
    vibe: 'Energy + Focus',
    phase: '#80907B',
    flood: 'linear-gradient(168deg,#7e8e78,#5f6e5a 58%,#4d5b49)',
    floodText: '#FBF6EC',
    floodSub: '#E2E8DB',
    floodSolid: '#80907B',
    header: 'linear-gradient(165deg,#73846d,#54624e)',
    headerText: '#FBF6EC',
    headerLabel: '#F0E2B0',
    labBg: '#EBEFE6',
    labCard: '#F8FAF4',
    labBorder: '#DCE2D3',
    labWhy: '#E3E8DB',
    labTrack: '#D7DDCB',
    accent: '#46553F',
    text: '#262A23',
    textMuted: '#8A9080',
    textSoft: '#555A4C',
  },
  ovulation: {
    label: 'Ovulation',
    vibe: 'Radiance + Connection',
    phase: '#F8C662',
    flood: 'linear-gradient(170deg,#FCEFCB,#F8D88F 48%,#F3C566)',
    floodText: '#3A2708',
    floodSub: '#9A6F24',
    floodSolid: '#F8C662',
    header: 'linear-gradient(165deg,#F8DC97,#F3C566)',
    headerText: '#3A2708',
    headerLabel: '#8A5A12',
    labBg: '#F8F1DE',
    labCard: '#FDF9EE',
    labBorder: '#ECE1C8',
    labWhy: '#F1E8D0',
    labTrack: '#E6DBC0',
    accent: '#B07D18',
    text: '#342C18',
    textMuted: '#9B8A64',
    textSoft: '#645836',
  },
  luteal: {
    label: 'Luteal',
    vibe: 'Calm + Nourish',
    phase: '#461D3A',
    flood: 'linear-gradient(168deg,#4a2040,#311028 58%,#230a1c)',
    floodText: '#F5EBD6',
    floodSub: '#D8B8CD',
    floodSolid: '#461D3A',
    header: 'linear-gradient(165deg,#461D3A,#321029)',
    headerText: '#F5EBD6',
    headerLabel: '#C9A84C',
    labBg: '#F1EAEF',
    labCard: '#FBF6FA',
    labBorder: '#E2D7E0',
    labWhy: '#E9DEE7',
    labTrack: '#DDD0DA',
    accent: '#461D3A',
    text: '#2E2329',
    textMuted: '#9C8A95',
    textSoft: '#62545C',
  },
}

/** Maps the legacy PhaseId ('ovulatory') to the new PhaseKey ('ovulation'). */
export function phaseKeyFor(id: PhaseId): PhaseKey {
  return id === 'ovulatory' ? 'ovulation' : id
}
