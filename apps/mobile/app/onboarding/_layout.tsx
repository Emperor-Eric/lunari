import { Stack } from 'expo-router'
import { View } from 'react-native'
import { OnboardingProgress } from '@lunari/ui'
import { useOnboardingStore } from '../../src/stores/onboarding'

export default function OnboardingLayout() {
  const { step, totalSteps } = useOnboardingStore()

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F0E8' }}>
      <OnboardingProgress total={totalSteps} current={step} phaseColor="#C9A84C" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F5F0E8' },
          animation: 'slide_from_right',
          gestureEnabled: step > 1,
        }}
      />
    </View>
  )
}
