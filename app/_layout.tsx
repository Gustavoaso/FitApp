// ============================================================
// LAYOUT RAIZ: (app/_layout.tsx)
// ============================================================
// Envolve todo o app no AuthProvedor, carrega a fonte nativa
// SF Compact Rounded em todo o aplicativo e configura as pilhas de navegação.
// ============================================================

import '../polyfills';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { AuthProvedor } from '@/compartilhado/AuthContexto';
import { useTema } from '@/compartilhado/useTema';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { cores } = useTema();
  const [fontsLoaded] = useFonts({
    'Sora-Regular': require('../assets/fonts/Sora_400Regular.ttf'),
    'Sora-Medium': require('../assets/fonts/Sora_500Medium.ttf'),
    'Sora-Semibold': require('../assets/fonts/Sora_600SemiBold.ttf'),
    'Sora-Bold': require('../assets/fonts/Sora_700Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
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
          contentStyle: { backgroundColor: cores.fundo },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/cadastro" options={{ headerShown: false }} />
        <Stack.Screen
          name="perfil"
          options={{
            headerShown: true,
            title: 'Perfil',
            headerShadowVisible: false,
            headerStyle: { backgroundColor: cores.fundo },
            headerTitleStyle: { color: cores.texto },
            headerTintColor: cores.destaque,
          }}
        />
        <Stack.Screen name="consentimento" options={{ headerShown: false }} />
        <Stack.Screen name="questionario/index" options={{ headerShown: false }} />
        <Stack.Screen name="questionario/resultado" options={{ headerShown: false }} />
        <Stack.Screen
          name="questionario/fonte"
          options={{
            headerShown: false,
            presentation: 'formSheet',
            sheetAllowedDetents: [0.5, 1],
            sheetGrabberVisible: true,
          }}
        />
        <Stack.Screen
          name="treino-ao-vivo/index"
          options={{ headerShown: false, presentation: 'fullScreenModal' }}
        />
      </Stack>
    </AuthProvedor>
  );
}
