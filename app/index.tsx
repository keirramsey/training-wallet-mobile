import { Redirect } from 'expo-router';

export default function Index() {
  // TODO: Add auth state check - if logged in, redirect to wallet
  return <Redirect href="/(auth)/welcome" />;
}

