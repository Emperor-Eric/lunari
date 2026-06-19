import React from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Circle } from 'react-native-svg'
import tokens, { palette } from '@lunari/design-tokens'

// Brand neutrals + gold, sourced from the design-tokens package (no hardcoded hex),
// shared by every auth screen so web and mobile read as the same brand.
const brand = tokens.colors.brand
export const authColors = {
  bg: brand.cream, // screen wash
  surface: palette.cream, // input / button paper (warm near-white)
  ink: brand.ink,
  inkSoft: brand.inkSoft,
  stone: brand.stone, // borders + dividers
  gold: brand.gold,
  goldDeep: palette.goldOnLight, // links / accents on light
  error: tokens.colors.phase.menstrual.base,
}

// Loaded brand font families (see app/_layout.tsx) — Marcellus serif + Raleway sans.
export const authFonts = {
  display: 'Marcellus_400Regular',
  body: 'Raleway_400Regular',
  medium: 'Raleway_500Medium',
  semibold: 'Raleway_600SemiBold',
  light: 'Raleway_300Light',
}

/** Restrained celestial motif — faint gold rings suggesting a crescent. */
export function Crescent({ size = 76 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 76 76" fill="none">
      <Circle
        cx="38"
        cy="38"
        r="37"
        stroke={authColors.gold}
        strokeOpacity={0.22}
        strokeWidth={1}
      />
      <Circle
        cx="48"
        cy="38"
        r="28"
        stroke={authColors.gold}
        strokeOpacity={0.14}
        strokeWidth={1}
      />
    </Svg>
  )
}

/** Lowercase Marcellus wordmark + a calm Raleway subtitle. */
export function AuthBrand({ subtitle }: { subtitle: string }) {
  return (
    <View style={styles.brand}>
      <Crescent />
      <Text style={styles.wordmark}>lunari</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  )
}

/**
 * Shared shell for the login / signup / forgot-password forms: cream wash, keyboard
 * handling, optional back link, and the brand header. Children render the form body.
 */
export function AuthFormShell({
  subtitle,
  onBack,
  children,
  overlay,
}: {
  subtitle: string
  onBack?: () => void
  children: React.ReactNode
  /** Screen-level overlay (e.g. an absolutely-positioned Toast) — sits outside the scroll. */
  overlay?: React.ReactNode
}) {
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {onBack && (
            <Pressable onPress={onBack} style={styles.back} hitSlop={8}>
              <Text style={styles.backText}>← Back</Text>
            </Pressable>
          )}
          <AuthBrand subtitle={subtitle} />
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
      {overlay}
    </SafeAreaView>
  )
}

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: authColors.bg },
  scroll: { padding: 28, paddingBottom: 48, gap: 14 },
  back: { marginBottom: 4 },
  backText: { fontFamily: authFonts.body, fontSize: 13, color: authColors.inkSoft },

  brand: { alignItems: 'center', gap: 6, marginBottom: 10 },
  wordmark: {
    fontFamily: authFonts.display,
    fontSize: 40,
    color: authColors.ink,
    letterSpacing: 1,
    marginTop: 2,
  },
  subtitle: {
    fontFamily: authFonts.light,
    fontSize: 13.5,
    color: authColors.inkSoft,
    textAlign: 'center',
  },

  googleBtn: {
    backgroundColor: authColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: authColors.stone,
    paddingVertical: 14,
    alignItems: 'center',
  },
  googleBtnText: { fontFamily: authFonts.semibold, fontSize: 14.5, color: authColors.ink },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: authColors.stone },
  dividerText: { fontFamily: authFonts.body, fontSize: 12, color: authColors.inkSoft },

  fieldWrap: { gap: 4 },
  input: {
    backgroundColor: authColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: authColors.stone,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontFamily: authFonts.body,
    fontSize: 15,
    color: authColors.ink,
  },
  inputFlex: { flex: 1 },
  inputError: { borderColor: authColors.error },
  errorText: { fontFamily: authFonts.body, fontSize: 12, color: authColors.error, marginLeft: 4 },

  pwRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  eyeBtn: { padding: 8 },
  eyeText: { fontFamily: authFonts.medium, fontSize: 13, color: authColors.goldDeep },

  forgotText: {
    fontFamily: authFonts.medium,
    fontSize: 13,
    color: authColors.goldDeep,
    textAlign: 'right',
  },

  submitBtn: {
    backgroundColor: authColors.ink,
    borderRadius: 13,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  submitBtnText: { fontFamily: authFonts.semibold, fontSize: 15.5, color: authColors.surface },

  link: { fontFamily: authFonts.medium, fontSize: 13, color: authColors.goldDeep },
})
