import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'

const { width } = Dimensions.get('window')

export default function Welcome() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Crescent arc SVG background */}
      <Svg
        width={width}
        height={width}
        style={StyleSheet.absoluteFill}
        viewBox={`0 0 ${width} ${width}`}
      >
        <Path
          d={`M ${width * 0.5} ${width * 0.1} A ${width * 0.4} ${width * 0.4} 0 0 1 ${width * 0.5} ${width * 0.9} A ${width * 0.3} ${width * 0.3} 0 0 0 ${width * 0.5} ${width * 0.1}`}
          fill="#C9A84C"
          opacity={0.15}
        />
      </Svg>

      <View style={styles.center}>
        <Text style={styles.wordmark}>lunari</Text>
        <Text style={styles.tagline}>fuelled for every phase</Text>
        <Text style={styles.subtext}>The first cycle-synced nutrition system</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push('/(auth)/signup')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>Get started</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/login')} activeOpacity={0.7}>
          <Text style={styles.linkText}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
    justifyContent: 'space-between',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  wordmark: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 48,
    color: '#2C2825',
    letterSpacing: 1,
  },
  tagline: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#6B6460',
    letterSpacing: 0.5,
  },
  subtext: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#6B6460',
    textAlign: 'center',
    marginTop: 4,
  },
  actions: {
    gap: 16,
    alignItems: 'center',
  },
  primaryBtn: {
    backgroundColor: '#2C2825',
    borderRadius: 9999,
    paddingVertical: 16,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  linkText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#6B6460',
    textDecorationLine: 'underline',
  },
})
