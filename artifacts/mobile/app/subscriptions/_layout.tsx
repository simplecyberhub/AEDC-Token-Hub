import { Stack } from 'expo-router';

export default function SubscriptionsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Auto-Buy', headerBackTitle: 'Back' }} />
      <Stack.Screen name="add" options={{ title: 'New Subscription', headerBackTitle: 'Back' }} />
    </Stack>
  );
}
