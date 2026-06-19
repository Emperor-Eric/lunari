import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { getSupabaseClient } from '@lunari/utils'
import { AuthFormShell, authColors, styles as a } from '../../src/components/AuthChrome'

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

  if (sent) {
    return (
      <AuthFormShell subtitle="Check your inbox." onBack={() => router.back()}>
        <Text style={[a.subtitle, { lineHeight: 22, marginTop: 4 }]}>
          We sent a reset link to {email}. Follow the link in that email to choose a new password.
        </Text>
        <TouchableOpacity
          style={a.submitBtn}
          onPress={() => router.replace('/(auth)/login')}
          activeOpacity={0.85}
        >
          <Text style={a.submitBtnText}>Back to sign in</Text>
        </TouchableOpacity>
      </AuthFormShell>
    )
  }

  return (
    <AuthFormShell subtitle="Reset your password." onBack={() => router.back()}>
      <Text style={[a.subtitle, { marginTop: -2 }]}>
        Enter your email and we&apos;ll send you a reset link.
      </Text>

      <View style={a.fieldWrap}>
        <TextInput
          style={a.input}
          placeholder="Email address"
          placeholderTextColor={authColors.inkSoft}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {error ? <Text style={a.errorText}>{error}</Text> : null}
      </View>

      <TouchableOpacity
        style={[a.submitBtn, loading && a.btnDisabled]}
        onPress={handleReset}
        disabled={loading}
        activeOpacity={0.85}
      >
        <Text style={a.submitBtnText}>{loading ? 'Sending…' : 'Send reset link'}</Text>
      </TouchableOpacity>
    </AuthFormShell>
  )
}
