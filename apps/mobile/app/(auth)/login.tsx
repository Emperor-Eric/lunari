import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth, useUser } from '@lunari/utils'
import { Toast } from '@lunari/ui'
import { AuthFormShell, authColors, styles as a } from '../../src/components/AuthChrome'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

export default function Login() {
  const { signInWithEmail, signInWithGoogle, isLoading, error } = useAuth()
  const { fetchUser } = useUser()
  const [showPw, setShowPw] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      await signInWithEmail(data.email, data.password)
      await fetchUser()
      const { user } = useUser.getState()
      if (!user?.onboardedAt) {
        router.replace('/onboarding')
      } else {
        router.replace('/(tabs)')
      }
    } catch {
      /* error set in store */
    }
  }

  return (
    <AuthFormShell
      subtitle="Sign in to return to your sanctuary."
      onBack={() => router.back()}
      overlay={error ? <Toast message={error} type="error" /> : null}
    >
      <TouchableOpacity style={a.googleBtn} onPress={signInWithGoogle} activeOpacity={0.85}>
        <Text style={a.googleBtnText}>Continue with Google</Text>
      </TouchableOpacity>

      <View style={a.divider}>
        <View style={a.dividerLine} />
        <Text style={a.dividerText}>or sign in with email</Text>
        <View style={a.dividerLine} />
      </View>

      <Controller
        control={control}
        name="email"
        render={({ field: { value, onChange, onBlur } }) => (
          <View style={a.fieldWrap}>
            <TextInput
              style={[a.input, errors.email && a.inputError]}
              placeholder="Email address"
              placeholderTextColor={authColors.inkSoft}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={a.errorText}>{errors.email.message}</Text>}
          </View>
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { value, onChange, onBlur } }) => (
          <View style={a.fieldWrap}>
            <View style={a.pwRow}>
              <TextInput
                style={[a.input, a.inputFlex, errors.password && a.inputError]}
                placeholder="Password"
                placeholderTextColor={authColors.inkSoft}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry={!showPw}
              />
              <TouchableOpacity onPress={() => setShowPw((p) => !p)} style={a.eyeBtn}>
                <Text style={a.eyeText}>{showPw ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={a.errorText}>{errors.password.message}</Text>}
          </View>
        )}
      />

      <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
        <Text style={a.forgotText}>Forgot password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[a.submitBtn, isLoading && a.btnDisabled]}
        onPress={handleSubmit(onSubmit)}
        disabled={isLoading}
        activeOpacity={0.85}
      >
        <Text style={a.submitBtnText}>{isLoading ? 'Signing in…' : 'Sign in'}</Text>
      </TouchableOpacity>
    </AuthFormShell>
  )
}
