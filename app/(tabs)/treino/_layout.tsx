// Pilha da aba: título grande nativo (VISUAL.md), no tema atual.
import { Stack } from 'expo-router';
import { opcoesPilhaAba } from '@/compartilhado/navegacao';
import { useTema } from '@/compartilhado/useTema';

export default function LayoutAbaTreino() {
  const { cores } = useTema();
  return (
    <Stack screenOptions={opcoesPilhaAba(cores)}>
      <Stack.Screen name="index" options={{ title: 'Treino' }} />
    </Stack>
  );
}
