import React, { useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@lunari/utils'
import { Toast } from '@lunari/ui'
import {
  AuthFormShell,
  GoldButton,
  OutlineButton,
  DarkInput,
  authColors,
  styles as a,
} from '../../src/components/AuthChrome'

const schema = z
  .object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export default function Signup() {
  const { signUpWithEmail, signInWithGoogle, isLoading, error } = useAuth()
  const [showPw, setShowPw] = useState(false)
  const [emailMode, setEmailMode] = useState(false)
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      await signUpWithEmail(data.email, data.password)
      router.replace('/onboarding')
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

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { value, onChange, onBlur } }) => (
              <View>
                <DarkInput
                  error={!!errors.confirmPassword}
                  placeholder="Confirm password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry={!showPw}
                />
                {errors.confirmPassword && (
                  <Text style={a.errorText}>{errors.confirmPassword.message}</Text>
                )}
              </View>
            )}
          />

          <GoldButton
            label={isLoading ? 'Creating…' : 'Create account'}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          />
        </>
      )}

      <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
        <Text style={a.footer}>
          Already have an account? <Text style={{ color: authColors.gold }}>Sign in</Text>
        </Text>
      </TouchableOpacity>
    </AuthFormShell>
  )
}
