// ============================================================
// COMPONENTE: MomentoConquista
// ============================================================
// Confirmação de conquista (plano aceito, treino concluído) no lugar
// do Alert: símbolo que entra com mola + haptic Success, e some sozinho.
// Com Reduzir Movimento ligado, aparece parado (sem animação).
// ============================================================

import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text } from 'react-native';
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
export const DURACAO_CONQUISTA = 1400;

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
  const aoTerminarRef = useRef(aoTerminar);
  aoTerminarRef.current = aoTerminar;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (!reduzirMovimento) escala.value = withSpring(1, { damping: 12, stiffness: 180 });
    const espera = setTimeout(() => aoTerminarRef.current(), DURACAO_CONQUISTA);
    return () => clearTimeout(espera);
  }, [reduzirMovimento, escala]);

  const estiloAnimado = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }));

  return (
    <Animated.View
      style={[estilos.fundo, { backgroundColor: cores.fundo }]}
      accessible
      accessibilityRole="alert"
      accessibilityLabel={subtitulo ? `${titulo}. ${subtitulo}` : titulo}
      accessibilityLiveRegion="assertive"
    >
      <Animated.View style={[estilos.circulo, { backgroundColor: cores.sucesso }, estiloAnimado]}>
        <SymbolView name="checkmark" size={56} tintColor={cores.fundo} weight="bold" />
      </Animated.View>
      <Text style={[estilos.titulo, { color: cores.texto }]}>{titulo}</Text>
      {subtitulo ? (
        <Text style={[estilos.subtitulo, { color: cores.textoSecundario }]}>{subtitulo}</Text>
      ) : null}
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  fundo: {
    ...StyleSheet.absoluteFillObject,
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
