import React from 'react'
import { Tabs } from 'expo-router'
import { Text, View, StyleSheet } from 'react-native'
import { useUser } from '@lunari/utils'
import { getPhaseById } from '@lunari/phase-data'
import type { PhaseId } from '@lunari/types'

type TabIconProps = { focused: boolean; color: string; label: string; emoji: string }

function TabIcon({ focused, color, label, emoji }: TabIconProps) {
  return (
    <View style={styles.tab}>
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
      <Text style={[styles.tabLabel, { color, fontWeight: focused ? '600' : '400' }]}>
        {label}
      </Text>
    </View>
  )
}

export default function TabsLayout() {
  const { user } = useUser()
  // Default to follicular gold if phase not yet loaded
  const phaseColor = '#C9A84C'

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: phaseColor,
        tabBarInactiveTintColor: '#6B6460',
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} label="Today" emoji="🌙" />
          ),
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} label="Move" emoji="🏋️" />
          ),
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} label="Fuel" emoji="🌿" />
          ),
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} label="Log" emoji="✍️" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} label="Me" emoji="👤" />
          ),
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E8E2D6',
    height: 80,
    paddingBottom: 16,
    paddingTop: 8,
  },
  tab: { alignItems: 'center', gap: 2 },
  tabLabel: { fontFamily: 'Inter', fontSize: 10 },
})
