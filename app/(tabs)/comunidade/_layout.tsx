// Pilha da aba Comunidade: título grande nativo (VISUAL.md).
import { Stack } from 'expo-router';
import { opcoesPilhaAba } from '@/compartilhado/navegacao';
import { useTema } from '@/compartilhado/useTema';

export default function LayoutAbaComunidade() {
  const { cores } = useTema();
  return (
    <Stack screenOptions={opcoesPilhaAba(cores)}>
      <Stack.Screen name="index" options={{ title: 'Comunidade' }} />
    </Stack>
  );
}
