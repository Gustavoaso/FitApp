// ============================================================
// COMPONENTE: MomentoConquista
// ============================================================
// Confirmação de conquista (plano aceito, treino concluído) no lugar
// do Alert: símbolo que entra com mola + haptic Success, e segue sozinho
// depois de ~1,5 s ou antes, com um toque.
// Com Reduzir Movimento ligado, aparece parado (sem animação).
// ============================================================

import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { Espacamento, FamiliaFonte, PesoFonte, Tipografia } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';

/** Tempo na tela antes de seguir (ms): o bastante para ler o título. */
export const DURACAO_CONQUISTA = 1500;

interface PropsMomentoConquista {
  titulo: string;
  subtitulo?: string;
  aoTerminar: () => void;
}

export function MomentoConquista({ titulo, subtitulo, aoTerminar }: PropsMomentoConquista) {
  const { cores } = useTema();
  const reduzirMovimento = useReducedMotion();
  const escala = useSharedValue(reduzirMovimento ? 1 : 0.6);

  // Ref: o efeito roda uma vez, mesmo que o pai recrie aoTerminar a cada render.
  // Atualizada num efeito: ler ou escrever ref durante o render quebra a regra do React Compiler.
  const aoTerminarRef = useRef(aoTerminar);
  useEffect(() => {
    aoTerminarRef.current = aoTerminar;
  });
  // Toque e tempo podem chegar juntos: segue uma vez só.
  const terminou = useRef(false);
  const terminar = () => {
    if (terminou.current) return;
    terminou.current = true;
    aoTerminarRef.current();
  };
  const terminarRef = useRef(terminar);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (!reduzirMovimento) escala.value = withSpring(1, { damping: 12, stiffness: 180 });
    const espera = setTimeout(() => terminarRef.current(), DURACAO_CONQUISTA);
    return () => clearTimeout(espera);
  }, [reduzirMovimento, escala]);

  const estiloAnimado = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }));

  return (
    <Pressable
      style={[estilos.fundo, { backgroundColor: cores.fundo }]}
      onPress={terminar}
      accessible
      accessibilityRole="alert"
      accessibilityLabel={subtitulo ? `${titulo}. ${subtitulo}` : titulo}
      accessibilityHint="Toque para continuar"
      accessibilityLiveRegion="assertive"
    >
      <Animated.View style={[estilos.circulo, { backgroundColor: cores.sucesso }, estiloAnimado]}>
        <SymbolView name="checkmark" size={56} tintColor={cores.fundo} weight="bold" />
      </Animated.View>
      <Text style={[estilos.titulo, { color: cores.texto }]}>{titulo}</Text>
      {subtitulo ? (
        <Text style={[estilos.subtitulo, { color: cores.textoSecundario }]}>{subtitulo}</Text>
      ) : null}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  fundo: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Espacamento.xxl,
    gap: Espacamento.md,
    zIndex: 20,
  },
  circulo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Espacamento.md,
  },
  titulo: {
    fontFamily: FamiliaFonte.bold,
    fontWeight: PesoFonte.bold,
    fontSize: Tipografia.titulo1,
    textAlign: 'center',
  },
  subtitulo: {
    fontFamily: FamiliaFonte.regular,
    fontSize: Tipografia.corpo,
    textAlign: 'center',
  },
});
