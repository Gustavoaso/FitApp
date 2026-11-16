// Pilha da aba Comunidade: título grande nativo (VISUAL.md); novo post em sheet.
import { Stack } from 'expo-router';
import { opcoesPilhaAba } from '@/compartilhado/navegacao';
import { useTema } from '@/compartilhado/useTema';

export default function LayoutAbaComunidade() {
  const { cores } = useTema();
  return (
    <Stack screenOptions={opcoesPilhaAba(cores)}>
      <Stack.Screen name="index" options={{ title: 'Comunidade' }} />
      <Stack.Screen name="usuario/[id]" options={{ title: 'Perfil', headerLargeTitle: false }} />
      <Stack.Screen
        name="novo"
        options={{
          title: 'Novo post',
          headerLargeTitle: false,
          presentation: 'formSheet',
          sheetAllowedDetents: [0.6, 1],
          sheetGrabberVisible: true,
        }}
      />
    </Stack>
  );
}
