import React, { useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth, useUser } from '@lunari/utils'
import { Toast } from '@lunari/ui'
import {
  AuthFormShell,
  GoldButton,
  OutlineButton,
  DarkInput,
  authColors,
  styles as a,
} from '../../src/components/AuthChrome'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

export default function Login() {
  const { signInWithEmail, signInWithGoogle, isLoading, error } = useAuth()
  const { fetchUser } = useUser()
  const [showPw, setShowPw] = useState(false)
  const [emailMode, setEmailMode] = useState(false)

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
      onBack={() => router.back()}
      overlay={error ? <Toast message={error} type="error" /> : null}
    >
      <GoldButton label="Continue with Google" onPress={signInWithGoogle} />

      {!emailMode ? (
        <OutlineButton label="Continue with email" onPress={() => setEmailMode(true)} />
      ) : (
        <>
          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange, onBlur } }) => (
              <View>
                <DarkInput
                  error={!!errors.email}
                  placeholder="Email address"
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
              <View>
                <DarkInput
                  error={!!errors.password}
                  placeholder="Password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry={!showPw}
                  right={
                    <TouchableOpacity onPress={() => setShowPw((p) => !p)} style={a.eyeBtn}>
                      <Text style={a.eyeText}>{showPw ? 'Hide' : 'Show'}</Text>
                    </TouchableOpacity>
                  }
                />
                {errors.password && <Text style={a.errorText}>{errors.password.message}</Text>}
              </View>
            )}
          />

          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={a.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <GoldButton
            label={isLoading ? 'Signing in…' : 'Sign in'}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          />
        </>
      )}

      <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
        <Text style={a.footer}>
          Don&apos;t have an account? <Text style={{ color: authColors.gold }}>Sign up</Text>
        </Text>
      </TouchableOpacity>
    </AuthFormShell>
  )
}
