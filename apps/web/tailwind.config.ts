import type { Config } from 'tailwindcss'
import tokens from '../../packages/design-tokens/tokens.json'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/src/web/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          gold: tokens.colors.brand.gold,
          ink: tokens.colors.brand.ink,
          'ink-soft': tokens.colors.brand.inkSoft,
          stone: tokens.colors.brand.stone,
          cream: tokens.colors.brand.cream,
        },
        phase: {
          menstrual: tokens.colors.phase.menstrual.base,
          'menstrual-light': tokens.colors.phase.menstrual.light,
          'menstrual-mid': tokens.colors.phase.menstrual.mid,
          follicular: tokens.colors.phase.follicular.base,
          'follicular-light': tokens.colors.phase.follicular.light,
          'follicular-mid': tokens.colors.phase.follicular.mid,
          ovulatory: tokens.colors.phase.ovulatory.base,
          'ovulatory-light': tokens.colors.phase.ovulatory.light,
          'ovulatory-mid': tokens.colors.phase.ovulatory.mid,
          luteal: tokens.colors.phase.luteal.base,
          'luteal-light': tokens.colors.phase.luteal.light,
          'luteal-mid': tokens.colors.phase.luteal.mid,
        },
      },
      fontFamily: {
        // Marcellus + Raleway are loaded via next/font (app/layout.tsx) and
        // exposed as CSS variables on <html>. Reference those vars, not the raw
        // family names — next/font self-hosts under a hashed family name.
        display: ['var(--font-marcellus)', 'Georgia', 'serif'],
        body: ['var(--font-raleway)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-raleway)', 'system-ui', 'sans-serif'],
        mono: [tokens.typography.fonts.mono, 'Courier New', 'monospace'],
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        6: '24px',
        8: '32px',
        12: '48px',
        16: '64px',
      },
      borderRadius: {
        sm: tokens.borderRadius.sm,
        md: tokens.borderRadius.md,
        lg: tokens.borderRadius.lg,
        full: tokens.borderRadius.full,
      },
      backgroundColor: {
        cream: tokens.colors.brand.cream,
      },
    },
  },
  plugins: [],
}

export default config
