import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@lunari/utils'
import {
  AuthBackdrop,
  AuthEmblem,
  GoldButton,
  OutlineButton,
  authColors,
  authFonts,
} from '../../src/components/AuthChrome'

export default function Welcome() {
  const { signInWithGoogle } = useAuth()

  return (
    <View style={{ flex: 1 }}>
      <AuthBackdrop />
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <AuthEmblem />
        </View>

        <View style={styles.actions}>
          <GoldButton label="Continue with Google" onPress={signInWithGoogle} />
          <OutlineButton
            label="Continue with email"
            onPress={() => router.push('/(auth)/signup')}
          />
          <TouchableOpacity onPress={() => router.push('/(auth)/login')} activeOpacity={0.7}>
            <Text style={styles.footer}>
              Already a member? <Text style={styles.footerLink}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, justifyContent: 'space-between', paddingVertical: 48, paddingHorizontal: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  actions: { gap: 14, alignItems: 'stretch' },
  footer: {
    fontFamily: authFonts.body,
    fontSize: 13,
    color: authColors.muted,
    textAlign: 'center',
    marginTop: 6,
  },
  footerLink: { fontFamily: authFonts.semibold, color: authColors.gold },
})
