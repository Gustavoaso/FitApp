// Pilha da aba Grupos: título grande nativo (VISUAL.md).
import { Stack } from 'expo-router';
import { opcoesPilhaAba } from '@/compartilhado/navegacao';
import { useTema } from '@/compartilhado/useTema';

export default function LayoutAbaGrupos() {
  const { cores } = useTema();
  return (
    <Stack screenOptions={opcoesPilhaAba(cores)}>
      <Stack.Screen name="index" options={{ title: 'Grupos' }} />
      <Stack.Screen name="[id]" options={{ headerLargeTitle: false }} />
    </Stack>
  );
}
