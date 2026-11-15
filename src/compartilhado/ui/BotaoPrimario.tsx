// ============================================================
// COMPONENTE: BotaoPrimario
// ============================================================
// Botão cápsula de altura 50 (HIG), na cor de destaque do tema.
// Variantes: primario (sólido), outline e ghost (destaque suave).
// ============================================================

import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { usePressao } from '@/compartilhado/movimento';
import { Raio, Espacamento, FamiliaFonte, PesoFonte, Tipografia } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';

const PressableAnimado = Animated.createAnimatedComponent(Pressable);

interface BotaoPrimarioProps {
  texto: string;
  aoPresionar: () => void;
  carregando?: boolean;
  desabilitado?: boolean;
  estilo?: ViewStyle;
  estiloTexto?: TextStyle;
  variante?: 'primario' | 'outline' | 'ghost';
}

export function BotaoPrimario({
  texto,
  aoPresionar,
  carregando = false,
  desabilitado = false,
  estilo,
  estiloTexto,
  variante = 'primario',
}: BotaoPrimarioProps) {
  const { cores, escuro } = useTema();
  const pressao = usePressao();
  const estaDesabilitado = desabilitado || carregando;
  const primario = variante === 'primario';
  const corTexto = primario ? cores.textoSobreDestaque : cores.texto;

  const lidarComPressionar = () => {
    if (estaDesabilitado) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    aoPresionar();
  };

  return (
    <PressableAnimado
      onPress={lidarComPressionar}
      onPressIn={pressao.aoPressionarDentro}
      onPressOut={pressao.aoPressionarFora}
      disabled={estaDesabilitado}
      accessibilityRole="button"
      accessibilityLabel={texto}
      accessibilityState={{ disabled: estaDesabilitado, busy: carregando }}
      style={[
        estilos.container,
        primario && { backgroundColor: cores.destaque },
        primario && !estaDesabilitado && escuro && estilos.brilho,
        primario && !estaDesabilitado && escuro && { shadowColor: cores.destaque },
        variante === 'ghost' && { backgroundColor: cores.destaqueSuave },
        variante === 'outline' && { borderWidth: 1, borderColor: cores.separador },
        estaDesabilitado && estilos.desabilitado,
        estilo,
        pressao.estilo,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={corTexto} size="small" />
      ) : (
        <Text style={[estilos.texto, { color: corTexto }, estiloTexto]}>{texto}</Text>
      )}
    </PressableAnimado>
  );
}

const estilos = StyleSheet.create({
  container: {
    minHeight: 50,
    borderRadius: Raio.full,
    paddingHorizontal: Espacamento.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Espacamento.sm,
  },
  texto: {
    fontFamily: FamiliaFonte.semibold,
    fontSize: Tipografia.destaque,
    fontWeight: PesoFonte.semibold,
  },
  // Brilho lima só no CTA principal (VISUAL.md).
  brilho: {
    shadowOpacity: 0.35,
    shadowRadius: Espacamento.lg,
    shadowOffset: { width: 0, height: Espacamento.xs },
  },
  desabilitado: {
    opacity: 0.4,
  },
});
