import { Stack } from 'expo-router'
import { View, Image, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { OnboardingProgress } from '@lunari/ui'
import { AuthBackdrop, authColors } from '../../src/components/AuthChrome'
import { useOnboardingStore } from '../../src/stores/onboarding'

export default function OnboardingLayout() {
  const { step, totalSteps } = useOnboardingStore()

  return (
    <View style={{ flex: 1, backgroundColor: authColors.bg }}>
      <AuthBackdrop />
      {/* Small gold wordmark + progress dots — continuity with the auth screens. */}
      <SafeAreaView edges={['top']}>
        <Image
          source={require('../../assets/brand/wordmark-gold.png')}
          style={styles.wordmark}
          resizeMode="contain"
        />
        <OnboardingProgress total={totalSteps} current={step} phaseColor={authColors.gold} />
      </SafeAreaView>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'slide_from_right',
          gestureEnabled: step > 1,
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wordmark: { width: 108, height: 30, alignSelf: 'center', marginTop: 10, marginBottom: 2 },
})
