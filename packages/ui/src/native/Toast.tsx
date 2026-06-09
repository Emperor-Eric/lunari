import React, { useEffect, useRef } from 'react'
import { Animated, Text, StyleSheet } from 'react-native'

interface Props {
  message: string
  type: 'success' | 'error'
}

export const Toast: React.FC<Props> = ({ message, type }) => {
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start()
  }, [message, opacity])

  return (
    <Animated.View
      style={[
        styles.toast,
        type === 'error' ? styles.error : styles.success,
        { opacity },
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 9999,
    zIndex: 999,
  },
  success: { backgroundColor: '#3D6B4A' },
  error: { backgroundColor: '#7A1E2E' },
  text: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
})
