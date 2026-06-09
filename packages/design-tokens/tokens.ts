export type PhaseId = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal'

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
      display: 'Playfair Display',
      body: 'Inter',
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
