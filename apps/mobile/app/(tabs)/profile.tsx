import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, TextInput, TouchableOpacity, Switch, Alert, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useAuth, useUser } from '@lunari/utils'
import { getPhaseForDay } from '@lunari/phase-data'
import type { UserReferralCode } from '@lunari/types'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/v1'
// Referral entry turns on with the shop — a code only matters once there's a product.
const SHOP_ENABLED = process.env.EXPO_PUBLIC_SHOP_ENABLED === 'true'

export default function Profile() {
  const { signOut, session } = useAuth()
  const { user, updateUser } = useUser()
  const phase = getPhaseForDay(15)

  // Referral code state
  const [savedCode, setSavedCode] = useState<string | null>(null)
  const [codeInput, setCodeInput] = useState('')
  const [applying, setApplying] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const authHeaders = useCallback(
    () => ({ Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' }),
    [session]
  )

  useEffect(() => {
    if (!SHOP_ENABLED || !session) return
    fetch(`${API_URL}/me/referral-code`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: UserReferralCode | null) => setSavedCode(data?.code ?? null))
      .catch(() => {})
  }, [session, authHeaders])

  const applyCode = async () => {
    const code = codeInput.trim()
    if (!code) return
    setApplying(true)
    setFeedback(null)
    try {
      const res = await fetch(`${API_URL}/me/referral-code`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ code }),
      })
      if (!res.ok) {
        setFeedback({ type: 'error', msg: "That code wasn't found." })
        return
      }
      const data = await res.json()
      setSavedCode(data.code)
      setCodeInput('')
      setFeedback({ type: 'success', msg: `Code ${data.code} added to your account` })
    } catch {
      setFeedback({ type: 'error', msg: "That code wasn't found." })
    } finally {
      setApplying(false)
    }
  }

  const removeCode = async () => {
    if (!session) return
    try {
      await fetch(`${API_URL}/me/referral-code`, { method: 'DELETE', headers: authHeaders() })
      setSavedCode(null)
      setFeedback(null)
    } catch {
      /* ignore */
    }
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??'

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out', style: 'destructive',
        onPress: async () => {
          await signOut()
          router.replace('/(auth)/welcome')
        },
      },
    ])
  }

  const toggleReminder = (v: boolean) => {
    updateUser({
      notificationPrefs: {
        dailyReminder: v,
        reminderTime: user?.notificationPrefs.reminderTime ?? '08:00',
      },
    })
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Profile</Text>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: phase.color }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={styles.name}>{user?.name ?? 'Loading…'}</Text>
            <Text style={styles.email}>{user?.email ?? ''}</Text>
          </View>
        </View>

        {/* Cycle section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>My cycle</Text>
          <Text style={styles.cardBody}>Current phase: {phase.name}</Text>
          <TouchableOpacity style={styles.updateBtn}>
            <Text style={styles.updateBtnText}>Update cycle dates</Text>
          </TouchableOpacity>
        </View>

        {/* Notifications */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notifications</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Daily reminder</Text>
            <Switch
              value={user?.notificationPrefs.dailyReminder ?? true}
              onValueChange={toggleReminder}
              trackColor={{ true: phase.color, false: '#E8E2D6' }}
              thumbColor="#FFFFFF"
            />
          </View>
          <Text style={styles.cardBody}>
            Remind at: {user?.notificationPrefs.reminderTime ?? '08:00'}
          </Text>
        </View>

        {/* Referral code — gated behind SHOP_ENABLED (off pre-launch) */}
        {SHOP_ENABLED && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Referral code</Text>
            <Text style={styles.cardBody}>Got a code from a creator? Add it to your account.</Text>

            {savedCode ? (
              <View style={styles.row}>
                <Text style={styles.savedCodeText}>Your code: {savedCode}</Text>
                <TouchableOpacity onPress={removeCode}>
                  <Text style={styles.removeLink}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.codeInputRow}>
                <TextInput
                  style={styles.codeInput}
                  placeholder="e.g. GYMGIRL20"
                  placeholderTextColor="#6B6460"
                  value={codeInput}
                  onChangeText={setCodeInput}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={[styles.applyBtn, applying && styles.applyBtnDisabled]}
                  onPress={applyCode}
                  disabled={applying}
                  activeOpacity={0.85}
                >
                  <Text style={styles.applyBtnText}>{applying ? '…' : 'Apply'}</Text>
                </TouchableOpacity>
              </View>
            )}

            {feedback && (
              <View
                style={[
                  styles.feedbackCard,
                  feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError,
                ]}
              >
                <Text
                  style={[
                    styles.feedbackText,
                    { color: feedback.type === 'success' ? '#3D6B4A' : '#7A1E2E' },
                  ]}
                >
                  {feedback.msg}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.85}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E8' },
  scroll: { padding: 24, gap: 20, paddingBottom: 48 },
  heading: { fontFamily: 'PlayfairDisplay', fontSize: 28, color: '#2C2825' },
  avatarSection: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: {
    width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: 'PlayfairDisplay', fontSize: 22, color: '#FFFFFF' },
  name: { fontFamily: 'Inter', fontSize: 17, fontWeight: '600', color: '#2C2825' },
  email: { fontFamily: 'Inter', fontSize: 13, color: '#6B6460' },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, gap: 10,
    borderWidth: 1, borderColor: '#E8E2D6',
  },
  cardTitle: { fontFamily: 'Inter', fontSize: 14, fontWeight: '700', color: '#2C2825' },
  cardBody: { fontFamily: 'Inter', fontSize: 13, color: '#6B6460' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontFamily: 'Inter', fontSize: 14, color: '#2C2825' },
  updateBtn: {
    borderRadius: 9999, borderWidth: 1.5, borderColor: '#E8E2D6',
    paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'flex-start',
  },
  updateBtnText: { fontFamily: 'Inter', fontSize: 13, fontWeight: '500', color: '#2C2825' },
  signOutBtn: {
    borderRadius: 12, borderWidth: 1.5, borderColor: '#7A1E2E',
    paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  signOutText: { fontFamily: 'Inter', fontSize: 15, fontWeight: '600', color: '#7A1E2E' },
  savedCodeText: { fontFamily: 'Inter', fontSize: 14, color: '#2C2825' },
  removeLink: { fontFamily: 'Inter', fontSize: 13, color: '#7A1E2E', fontWeight: '600' },
  codeInputRow: { flexDirection: 'row', gap: 8 },
  codeInput: {
    flex: 1, backgroundColor: '#F5F0E8', borderRadius: 12, borderWidth: 1.5, borderColor: '#E8E2D6',
    paddingVertical: 12, paddingHorizontal: 14, fontFamily: 'Inter', fontSize: 14, color: '#2C2825',
  },
  applyBtn: {
    backgroundColor: '#2C2825', borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center',
  },
  applyBtnDisabled: { opacity: 0.6 },
  applyBtnText: { fontFamily: 'Inter', fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  feedbackCard: { borderRadius: 12, padding: 12 },
  feedbackSuccess: { backgroundColor: '#E4EFE6' },
  feedbackError: { backgroundColor: '#F5E8EA' },
  feedbackText: { fontFamily: 'Inter', fontSize: 13, fontWeight: '500' },
})
