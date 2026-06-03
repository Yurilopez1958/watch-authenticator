import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0a0a0a' },
          headerTintColor: '#d4af37',
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: '#0a0a0a' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Watch Authenticator' }} />
        <Stack.Screen name="verify" options={{ title: 'Verify watch' }} />
        <Stack.Screen name="catalog" options={{ title: 'Catalog' }} />
      </Stack>
    </>
  );
}
