import React, { useState } from 'react'
import {
  View,
  Text,
  Image,
  Pressable,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  type TextInputProps,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Circle } from 'react-native-svg'

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')

// ─── Sanctuary (navy + gold) auth theme — EXACT tokens, auth/entrance screens only ──
export const authColors = {
  gradient: ['#16385f', '#0d1f3d', '#091830'] as const, // 168deg wash, locations [0, .58, 1]
  bg: '#0d1f3d', // solid navy — stack background between screens
  ink: '#F5EBD6', // primary text / cream
  muted: '#8BA0C4', // muted subtext
  gold: '#C9A84C', // links, outlines, dividers
  btnText: '#102B53', // text on the gold primary button
  error: '#E5A3A3', // soft rose — legible on navy
  fieldBg: 'rgba(245,235,214,0.06)',
  fieldBorder: 'rgba(201,168,76,0.35)',
}

// Loaded brand font families (see app/_layout.tsx) — Marcellus serif + Raleway sans.
export const authFonts = {
  display: 'Marcellus_400Regular',
  body: 'Raleway_400Regular',
  medium: 'Raleway_500Medium',
  semibold: 'Raleway_600SemiBold',
  light: 'Raleway_300Light',
}

/** Restrained celestial layer — a faint orbital arc + a few gold sparkles. */
export function Sparkles() {
  return (
    <Svg width={SCREEN_W} height={SCREEN_H} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Circle
        cx={SCREEN_W * 0.5}
        cy={SCREEN_H * 0.36}
        r={SCREEN_W * 0.72}
        fill="none"
        stroke={authColors.gold}
        strokeOpacity={0.06}
        strokeWidth={1}
      />
      <Circle
        cx={SCREEN_W * 0.5}
        cy={SCREEN_H * 0.36}
        r={SCREEN_W * 0.5}
        fill="none"
        stroke={authColors.gold}
        strokeOpacity={0.05}
        strokeWidth={1}
      />
      <Circle
        cx={SCREEN_W * 0.18}
        cy={SCREEN_H * 0.2}
        r={1.6}
        fill={authColors.gold}
        opacity={0.5}
      />
      <Circle
        cx={SCREEN_W * 0.82}
        cy={SCREEN_H * 0.26}
        r={1.3}
        fill={authColors.gold}
        opacity={0.4}
      />
      <Circle
        cx={SCREEN_W * 0.76}
        cy={SCREEN_H * 0.66}
        r={1.6}
        fill={authColors.gold}
        opacity={0.45}
      />
      <Circle
        cx={SCREEN_W * 0.22}
        cy={SCREEN_H * 0.72}
        r={1.2}
        fill={authColors.gold}
        opacity={0.35}
      />
      <Circle
        cx={SCREEN_W * 0.88}
        cy={SCREEN_H * 0.5}
        r={1.2}
        fill={authColors.gold}
        opacity={0.3}
      />
    </Svg>
  )
}

/** Navy wash + celestial layer behind everything. */
export function AuthBackdrop() {
  return (
    <>
      <LinearGradient
        colors={authColors.gradient}
        locations={[0, 0.58, 1]}
        start={{ x: 0.4, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Sparkles />
    </>
  )
}

/** Goddess seal → script wordmark → tagline → thin gold rule. */
export function AuthEmblem() {
  return (
    <View style={styles.emblem}>
      <Image
        source={require('../../assets/brand/seal-gold.png')}
        style={styles.seal}
        resizeMode="contain"
      />
      <Image
        source={require('../../assets/brand/wordmark-gold.png')}
        style={styles.wordmark}
        resizeMode="contain"
      />
      <Text style={styles.tagline}>Fuelled for every phase</Text>
      <View style={styles.rule} />
    </View>
  )
}

/**
 * Shared shell for the login / signup / forgot-password forms: navy wash, keyboard
 * handling, optional back link, the brand emblem, and a Toast overlay slot.
 */
export function AuthFormShell({
  subtitle,
  onBack,
  children,
  overlay,
}: {
  subtitle?: string
  onBack?: () => void
  children: React.ReactNode
  overlay?: React.ReactNode
}) {
  return (
    <View style={{ flex: 1 }}>
      <AuthBackdrop />
      <SafeAreaView style={{ flex: 1 }}>
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
            <AuthEmblem />
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            <View style={styles.formCol}>{children}</View>
          </ScrollView>
        </KeyboardAvoidingView>
        {overlay}
      </SafeAreaView>
    </View>
  )
}

// ─── Reusable dark-theme primitives ──────────────────────────────────────────

export function GoldButton({
  label,
  onPress,
  disabled,
}: {
  label: string
  onPress?: () => void
  disabled?: boolean
}) {
  return (
    <TouchableOpacity
      style={[styles.goldBtn, disabled && styles.btnDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      <Text style={styles.goldBtnText}>{label}</Text>
    </TouchableOpacity>
  )
}

export function OutlineButton({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.outlineBtn} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.outlineBtnText}>{label}</Text>
    </TouchableOpacity>
  )
}

/** Translucent dark field with a gold focus ring; `right` hosts the show/hide toggle. */
export function DarkInput({
  error,
  right,
  ...props
}: TextInputProps & { error?: boolean; right?: React.ReactNode }) {
  const [focused, setFocused] = useState(false)
  return (
    <View
      style={[styles.fieldRow, focused && styles.fieldRowFocused, error && styles.fieldRowError]}
    >
      <TextInput
        {...props}
        style={[styles.inputText, props.style]}
        placeholderTextColor={authColors.muted}
        onFocus={(e) => {
          setFocused(true)
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocused(false)
          props.onBlur?.(e)
        }}
      />
      {right}
    </View>
  )
}

export const styles = StyleSheet.create({
  scroll: { padding: 28, paddingBottom: 48, gap: 14, flexGrow: 1, justifyContent: 'center' },
  back: { position: 'absolute', top: 8, left: 24, zIndex: 1 },
  backText: { fontFamily: authFonts.body, fontSize: 13, color: authColors.muted },

  // emblem
  emblem: { alignItems: 'center', gap: 14, marginBottom: 8 },
  seal: { width: 80, height: 80 },
  wordmark: { width: 184, height: 50, marginTop: -2 },
  tagline: {
    fontFamily: authFonts.medium,
    fontSize: 11,
    letterSpacing: 3.6,
    textTransform: 'uppercase',
    color: authColors.muted,
  },
  rule: { width: 56, height: 1, backgroundColor: authColors.gold, opacity: 0.6, marginTop: 2 },

  subtitle: {
    fontFamily: authFonts.light,
    fontSize: 13.5,
    color: authColors.muted,
    textAlign: 'center',
  },
  formCol: { gap: 14 },

  // gold + outline buttons
  goldBtn: {
    backgroundColor: authColors.gold,
    borderRadius: 13,
    paddingVertical: 16,
    alignItems: 'center',
  },
  goldBtnText: { fontFamily: authFonts.semibold, fontSize: 15.5, color: authColors.btnText },
  outlineBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: authColors.gold,
    borderRadius: 13,
    paddingVertical: 16,
    alignItems: 'center',
  },
  outlineBtnText: { fontFamily: authFonts.semibold, fontSize: 15.5, color: authColors.gold },
  btnDisabled: { opacity: 0.6 },

  // fields
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: authColors.fieldBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: authColors.fieldBorder,
    paddingHorizontal: 16,
  },
  fieldRowFocused: { borderColor: authColors.gold },
  fieldRowError: { borderColor: authColors.error },
  inputText: {
    flex: 1,
    paddingVertical: 14,
    fontFamily: authFonts.body,
    fontSize: 15,
    color: authColors.ink,
  },
  eyeBtn: { paddingLeft: 10 },
  eyeText: { fontFamily: authFonts.medium, fontSize: 13, color: authColors.gold },
  errorText: {
    fontFamily: authFonts.body,
    fontSize: 12,
    color: authColors.error,
    marginLeft: 4,
    marginTop: -8,
  },

  // links
  link: { fontFamily: authFonts.medium, fontSize: 13, color: authColors.gold },
  forgotText: {
    fontFamily: authFonts.medium,
    fontSize: 13,
    color: authColors.gold,
    textAlign: 'right',
  },
  footer: {
    fontFamily: authFonts.body,
    fontSize: 13,
    color: authColors.muted,
    textAlign: 'center',
  },
})
