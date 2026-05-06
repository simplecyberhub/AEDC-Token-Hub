import { Stack } from 'expo-router';

export default function MetersLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'My Meters', headerBackTitle: 'Back' }} />
      <Stack.Screen name="add" options={{ title: 'Add Meter', headerBackTitle: 'Back' }} />
    </Stack>
  );
}
