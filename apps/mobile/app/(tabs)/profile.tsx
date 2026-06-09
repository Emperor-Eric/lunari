import React from 'react'
import { View, Text, TouchableOpacity, Switch, Alert, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useAuth, useUser } from '@lunari/utils'
import { getPhaseForDay } from '@lunari/phase-data'

export default function Profile() {
  const { signOut } = useAuth()
  const { user, updateUser } = useUser()
  const phase = getPhaseForDay(15)

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
})
