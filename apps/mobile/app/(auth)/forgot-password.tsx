import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getSupabaseClient } from '@lunari/utils'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleReset = async () => {
    if (!email) return
    setLoading(true)
    setError('')
    try {
      const supabase = getSupabaseClient()
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'lunari://auth/reset',
      })
      if (err) throw err
      setSent(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {sent ? (
          <View style={styles.successState}>
            <Text style={styles.successIcon}>✉️</Text>
            <Text style={styles.heading}>Check your inbox</Text>
            <Text style={styles.body}>
              We sent a reset link to {email}. Check your email and follow the link.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.heading}>Reset password</Text>
            <Text style={styles.body}>Enter your email and we'll send you a reset link.</Text>

            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#6B6460"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.btnDisabled]}
              onPress={handleReset}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.submitBtnText}>{loading ? 'Sending…' : 'Send reset link'}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E8' },
  container: { flex: 1, padding: 24, gap: 16 },
  back: { marginBottom: 8 },
  backText: { fontFamily: 'Inter', fontSize: 14, color: '#6B6460' },
  heading: { fontFamily: 'PlayfairDisplay', fontSize: 28, color: '#2C2825' },
  body: { fontFamily: 'Inter', fontSize: 14, color: '#6B6460', lineHeight: 22 },
  successState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  successIcon: { fontSize: 48 },
  input: {
    backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1.5, borderColor: '#E8E2D6',
    paddingVertical: 14, paddingHorizontal: 16, fontFamily: 'Inter', fontSize: 15, color: '#2C2825',
    marginTop: 8,
  },
  errorText: { fontFamily: 'Inter', fontSize: 12, color: '#7A1E2E' },
  submitBtn: {
    backgroundColor: '#2C2825', borderRadius: 12, paddingVertical: 16, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  submitBtnText: { fontFamily: 'Inter', fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
})
