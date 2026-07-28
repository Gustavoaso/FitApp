// ============================================================
// LAYOUT RAIZ: (app/_layout.tsx)
// ============================================================
// Envolve todo o app no AuthProvedor, carrega a fonte nativa
// SF Compact Rounded em todo o aplicativo e configura as pilhas de navegação.
// ============================================================

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { AuthProvedor } from '../contextos/AuthContexto';
import { Cores } from '../constantes/Cores';

// Polyfill para React Native / Hermes (impede crash de DOMException indefinido)
if (typeof globalThis.DOMException === 'undefined') {
  (globalThis as any).DOMException = class DOMException extends Error {
    constructor(message?: string, name?: string) {
      super(message);
      this.name = name || 'DOMException';
    }
  };
}

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'SF-Compact-Rounded-Regular': require('../assets/fonts/SF-Compact-Rounded-Regular.otf'),
    'SF-Compact-Rounded-Medium': require('../assets/fonts/SF-Compact-Rounded-Medium.otf'),
    'SF-Compact-Rounded-Semibold': require('../assets/fonts/SF-Compact-Rounded-Semibold.otf'),
    'SF-Compact-Rounded-Bold': require('../assets/fonts/SF-Compact-Rounded-Bold.otf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvedor>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Cores.fundo.principal },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
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
