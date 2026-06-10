import type { Config } from 'tailwindcss'
import tokens from '../../packages/design-tokens/tokens.json'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
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
          follicular: tokens.colors.phase.follicular.base,
          'follicular-light': tokens.colors.phase.follicular.light,
          ovulatory: tokens.colors.phase.ovulatory.base,
          'ovulatory-light': tokens.colors.phase.ovulatory.light,
          luteal: tokens.colors.phase.luteal.base,
          'luteal-light': tokens.colors.phase.luteal.light,
        },
      },
      fontFamily: {
        display: [tokens.typography.fonts.display, 'Georgia', 'serif'],
        body: [tokens.typography.fonts.body, 'system-ui', 'sans-serif'],
        mono: [tokens.typography.fonts.mono, 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
