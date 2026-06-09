import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native'
import { router } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@lunari/utils'
import { Toast } from '@lunari/ui'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function Signup() {
  const { signUpWithEmail, signInWithGoogle, isLoading, error, clearError } = useAuth()
  const [showPw, setShowPw] = useState(false)
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await signUpWithEmail(data.email, data.password)
      router.replace('/onboarding')
    } catch { /* error set in store */ }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.heading}>Create your account</Text>

          {/* Google */}
          <TouchableOpacity style={styles.googleBtn} onPress={signInWithGoogle} activeOpacity={0.85}>
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or sign up with email</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email */}
          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange, onBlur } }) => (
              <View style={styles.fieldWrap}>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="Email address"
                  placeholderTextColor="#6B6460"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
              </View>
            )}
          />

          {/* Password */}
          <Controller
            control={control}
            name="password"
            render={({ field: { value, onChange, onBlur } }) => (
              <View style={styles.fieldWrap}>
                <View style={styles.pwRow}>
                  <TextInput
                    style={[styles.input, styles.inputFlex, errors.password && styles.inputError]}
                    placeholder="Password"
                    placeholderTextColor="#6B6460"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry={!showPw}
                  />
                  <TouchableOpacity onPress={() => setShowPw((p) => !p)} style={styles.eyeBtn}>
                    <Text style={styles.eyeText}>{showPw ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
              </View>
            )}
          />

          {/* Confirm password */}
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { value, onChange, onBlur } }) => (
              <View style={styles.fieldWrap}>
                <TextInput
                  style={[styles.input, errors.confirmPassword && styles.inputError]}
                  placeholder="Confirm password"
                  placeholderTextColor="#6B6460"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry={!showPw}
                />
                {errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
                )}
              </View>
            )}
          />

          <TouchableOpacity
            style={[styles.submitBtn, isLoading && styles.btnDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <Text style={styles.submitBtnText}>{isLoading ? 'Creating…' : 'Create account'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {error && <Toast message={error} type="error" />}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E8' },
  container: { padding: 24, gap: 16, paddingBottom: 48 },
  back: { marginBottom: 8 },
  backText: { fontFamily: 'Inter', fontSize: 14, color: '#6B6460' },
  heading: { fontFamily: 'PlayfairDisplay', fontSize: 28, color: '#2C2825', marginBottom: 8 },
  googleBtn: {
    backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1.5, borderColor: '#E8E2D6',
    paddingVertical: 14, alignItems: 'center',
  },
  googleBtnText: { fontFamily: 'Inter', fontSize: 15, fontWeight: '600', color: '#2C2825' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E8E2D6' },
  dividerText: { fontFamily: 'Inter', fontSize: 12, color: '#6B6460' },
  fieldWrap: { gap: 4 },
  input: {
    backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1.5, borderColor: '#E8E2D6',
    paddingVertical: 14, paddingHorizontal: 16, fontFamily: 'Inter', fontSize: 15, color: '#2C2825',
  },
  inputFlex: { flex: 1 },
  inputError: { borderColor: '#7A1E2E' },
  errorText: { fontFamily: 'Inter', fontSize: 12, color: '#7A1E2E', marginLeft: 4 },
  pwRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  eyeBtn: { padding: 8 },
  eyeText: { fontFamily: 'Inter', fontSize: 13, color: '#6B6460' },
  submitBtn: {
    backgroundColor: '#2C2825', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  submitBtnText: { fontFamily: 'Inter', fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
})
