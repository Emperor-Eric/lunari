import React from 'react'
import { ActivityIndicator, View, StyleSheet } from 'react-native'

interface Props {
  phaseColor?: string
}

export const LoadingSpinner: React.FC<Props> = ({ phaseColor = '#C9A84C' }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={phaseColor} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
})
