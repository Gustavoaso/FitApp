// ============================================================
// MOVIMENTO (RN25): molas no padrão Apple, num lugar só.
// ============================================================
// Molas por duração e quique (WWDC23). Padrão sem quique; quique leve só em
// celebração. Tudo interrompível (withSpring parte do valor atual) e curto.
// Reduzir Movimento: vai direto ao valor final, sem animar.
// ============================================================

import React, { useEffect, useState } from 'react';
import { Text, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

export const MOLAS = {
  /** Padrão: sem quique. */
  suave: { duration: 400, dampingRatio: 1 },
  /** Resposta ao toque. */
  rapida: { duration: 250, dampingRatio: 1 },
  /** Só em celebração (conquista, série concluída). */
  celebracao: { duration: 450, dampingRatio: 0.7 },
} as const;

export type NomeMola = keyof typeof MOLAS;

export const ESCALA_PRESSAO = 0.97;
const ATRASO_CASCATA_MS = 40;
const MAX_ITENS_CASCATA = 8;

/** Valor animado com mola, ou o valor final puro com Reduzir Movimento. */
export function molaOuFinal(valor: number, reduzir: boolean, mola: NomeMola = 'suave') {
  'worklet';
  return reduzir ? valor : withSpring(valor, MOLAS[mola]);
}

/** Atraso da cascata: limitado, para listas longas não demorarem a aparecer. */
export function atrasoCascata(indice: number): number {
  return Math.min(Math.max(indice, 0), MAX_ITENS_CASCATA) * ATRASO_CASCATA_MS;
}

/** Escala de pressão: ligue `aoPressionarDentro`/`Fora` ao Pressable e aplique `estilo` na View animada. */
export function usePressao(escalaAlvo: number = ESCALA_PRESSAO) {
  const reduzir = useReducedMotion();
  const escala = useSharedValue(1);
  const estilo = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }));
  return {
    estilo,
    aoPressionarDentro: () => {
      escala.set(molaOuFinal(escalaAlvo, reduzir, 'rapida'));
    },
    aoPressionarFora: () => {
      escala.set(molaOuFinal(1, reduzir, 'rapida'));
    },
  };
}

/** Quique leve (celebração): dispare `quicar()`; volta a 1 sozinho. */
export function useQuique(escalaPico = 1.18) {
  const reduzir = useReducedMotion();
  const escala = useSharedValue(1);
  const estilo = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }));
  const quicar = () => {
    if (reduzir) return;
    escala.set(escalaPico);
    escala.set(withSpring(1, MOLAS.celebracao));
  };
  return { estilo, quicar };
}

/** Entrada curta (fade + subida) com atraso por índice. */
export function Entrada({
  indice = 0,
  estilo,
  children,
}: {
  indice?: number;
  estilo?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const reduzir = useReducedMotion();
  const progresso = useSharedValue(reduzir ? 1 : 0);
  useEffect(() => {
    if (reduzir) {
      progresso.set(1);
      return;
    }
    progresso.set(withDelay(atrasoCascata(indice), withSpring(1, MOLAS.suave)));
  }, [reduzir, indice, progresso]);
  const animado = useAnimatedStyle(() => ({
    opacity: Math.min(Math.max(progresso.value, 0), 1),
    transform: [{ translateY: (1 - progresso.value) * 12 }],
  }));
  return <Animated.View style={[estilo, animado]}>{children}</Animated.View>;
}

/** Valor que acompanha `alvo` com mola (0..1 de progresso, largura, etc.). */
export function useValorMola(alvo: number, mola: NomeMola = 'suave') {
  const reduzir = useReducedMotion();
  const valor = useSharedValue(reduzir ? alvo : 0);
  useEffect(() => {
    valor.set(molaOuFinal(alvo, reduzir, mola));
  }, [alvo, reduzir, mola, valor]);
  return valor;
}

/** Número que "conta" até o valor novo; Reduzir Movimento mostra o final direto. */
export function NumeroContado({
  valor,
  formatar = (n) => String(Math.round(n)),
  estilo,
}: {
  valor: number;
  formatar?: (n: number) => string;
  estilo?: StyleProp<TextStyle>;
}) {
  const reduzir = useReducedMotion();
  const animado = useSharedValue(valor);
  const [texto, setTexto] = useState(() => formatar(valor));

  useEffect(() => {
    animado.set(molaOuFinal(valor, reduzir));
    // formatar costuma ser inline: só o valor deve reanimar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor, reduzir, animado]);

  // formatar é função JS: roda na thread JS, não no worklet.
  const atualizar = (n: number) => setTexto(formatar(n));
  useAnimatedReaction(
    () => Math.round(animado.value),
    (atual, anterior) => {
      if (atual !== anterior) scheduleOnRN(atualizar, atual);
    },
  );

  // Reduzir Movimento: valor final direto, sem passar pela animação.
  return <Text style={estilo}>{reduzir ? formatar(valor) : texto}</Text>;
}

/** Preenchimento de barra (largura em %, 0 a 100) que acompanha o alvo com mola. */
export function PreenchimentoMola({
  percentual,
  estilo,
}: {
  percentual: number;
  estilo?: StyleProp<ViewStyle>;
}) {
  const largura = useValorMola(percentual);
  const animado = useAnimatedStyle(() => ({
    width: `${Math.min(Math.max(largura.value, 0), 100)}%`,
  }));
  return <Animated.View style={[estilo, animado]} />;
}
