import { Stack } from 'expo-router'
import { authColors } from '../../src/components/AuthChrome'

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: authColors.bg },
        animation: 'slide_from_right',
      }}
    />
  )
}
