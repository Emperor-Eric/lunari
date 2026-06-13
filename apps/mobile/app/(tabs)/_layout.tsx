import React from 'react'
import { Tabs } from 'expo-router'
import { Text, View, StyleSheet } from 'react-native'
import { Moon, Dumbbell, Pencil, User, ShoppingBag } from 'lucide-react-native'
import { FuelIcon } from '../../src/components/FuelIcon'

type IconType = (props: { size?: number; color?: string; strokeWidth?: number }) => React.ReactNode

type TabIconProps = { focused: boolean; color: string; label: string; Icon: IconType }

function TabIcon({ focused, color, label, Icon }: TabIconProps) {
  return (
    <View style={styles.tab}>
      <Icon size={22} color={color} strokeWidth={1.5} />
      <Text style={[styles.tabLabel, { color, fontWeight: focused ? '600' : '400' }]}>
        {label}
      </Text>
    </View>
  )
}

const SHOP_ENABLED = process.env.EXPO_PUBLIC_SHOP_ENABLED === 'true'

export default function TabsLayout() {
  // Default to follicular gold if phase not yet loaded — unchanged tab bar colors.
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
            <TabIcon focused={focused} color={color} label="Today" Icon={Moon} />
          ),
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} label="Move" Icon={Dumbbell} />
          ),
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} label="Fuel" Icon={FuelIcon} />
          ),
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} label="Log" Icon={Pencil} />
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={
          SHOP_ENABLED
            ? {
                tabBarIcon: ({ focused, color }) => (
                  <TabIcon focused={focused} color={color} label="Shop" Icon={ShoppingBag} />
                ),
              }
            : // Keep the route in the repo but hide it from the tab bar
              { href: null }
        }
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} label="Me" Icon={User} />
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
