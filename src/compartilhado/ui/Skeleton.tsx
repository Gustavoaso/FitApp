// ============================================================
// COMPONENTE: Skeleton
// ============================================================
// Bloco de carregamento com o formato do conteúdo (no lugar do spinner solto).
// Pulsa de leve, e fica parado com Reduzir Movimento ligado.
// ============================================================

import React, { useEffect } from 'react';
import { DimensionValue, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Raio } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';

interface PropsSkeleton {
  largura?: DimensionValue;
  altura?: DimensionValue;
  raio?: number;
  estilo?: ViewStyle;
}

export function Skeleton({ largura = '100%', altura = 16, raio = Raio.md, estilo }: PropsSkeleton) {
  const { cores } = useTema();
  const reduzirMovimento = useReducedMotion();
  const opacidade = useSharedValue(1);

  useEffect(() => {
    if (reduzirMovimento) return;
    opacidade.value = withRepeat(withTiming(0.5, { duration: 800 }), -1, true);
  }, [reduzirMovimento, opacidade]);

  const estiloAnimado = useAnimatedStyle(() => ({ opacity: opacidade.value }));

  return (
    <Animated.View
      accessibilityLabel="Carregando"
      accessibilityRole="progressbar"
      style={[
        { width: largura, height: altura, borderRadius: raio, backgroundColor: cores.esqueleto },
        estiloAnimado,
        estilo,
      ]}
    />
  );
}
