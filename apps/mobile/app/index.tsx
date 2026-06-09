import { Redirect } from 'expo-router'
import { useAuth } from '@lunari/utils'
import { useUser } from '@lunari/utils'

export default function Index() {
  const { session } = useAuth()
  const { user } = useUser()

  if (!session) return <Redirect href="/(auth)/welcome" />
  if (!user?.onboardedAt) return <Redirect href="/onboarding" />
  return <Redirect href="/(tabs)" />
}
