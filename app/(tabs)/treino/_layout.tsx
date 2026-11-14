// Pilha da aba: título grande nativo (VISUAL.md), no tema atual.
import { Stack } from 'expo-router';
import { opcoesPilhaAba } from '@/compartilhado/navegacao';
import { useTema } from '@/compartilhado/useTema';

export default function LayoutAbaTreino() {
  const { cores } = useTema();
  return (
    <Stack screenOptions={opcoesPilhaAba(cores)}>
      <Stack.Screen name="index" options={{ title: 'Treino' }} />
      {/* Detalhe: título pequeno (o nome do treino vem da tela) e volta para a aba. */}
      <Stack.Screen
        name="[treinoId]"
        options={{ title: 'Treino', headerLargeTitle: false, headerBackTitle: 'Treino' }}
      />
    </Stack>
  );
}
