import React from 'react';
import { Stack, DarkTheme, ThemeProvider } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Colors } from '@/constants/theme';

const queryClient = new QueryClient();

const customDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.dark.background,
    card: Colors.dark.card,
    text: Colors.dark.text,
    border: Colors.dark.border,
    primary: Colors.dark.primary,
  },
};

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={customDarkTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)/access-portal" />
          <Stack.Screen name="(auth)/login" />
          <Stack.Screen name="(auth)/register" />
          <Stack.Screen name="(auth)/forgot-password" />
          <Stack.Screen name="onboarding/index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="subscription" />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
