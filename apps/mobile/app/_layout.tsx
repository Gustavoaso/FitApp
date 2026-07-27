// ============================================================
// LAYOUT RAIZ: (app/_layout.tsx)
// ============================================================
// Envolve todo o app no AuthProvedor e configura as pilhas de navegação.
// ============================================================

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvedor } from '../contextos/AuthContexto';
import { Cores } from '../constantes/Cores';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <AuthProvedor>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Cores.fundo.principal },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/cadastro" options={{ headerShown: false }} />
        <Stack.Screen name="questionario/index" options={{ headerShown: false }} />
        <Stack.Screen name="questionario/resultado" options={{ headerShown: false }} />
        <Stack.Screen name="treino-ao-vivo/index" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      </Stack>
    </AuthProvedor>
  );
}
