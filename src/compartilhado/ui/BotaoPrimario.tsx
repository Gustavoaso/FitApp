// ============================================================
// COMPONENTE: BotaoPrimario
// ============================================================
// Botão cápsula de altura 50 (HIG), na cor de destaque do tema.
// Variantes: primario (sólido), outline e ghost (destaque suave).
// ============================================================

import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Raio, Espacamento, FamiliaFonte, PesoFonte, Tipografia } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';

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
  const { cores } = useTema();
  const estaDesabilitado = desabilitado || carregando;
  const primario = variante === 'primario';
  const corTexto = primario ? cores.textoSobreDestaque : cores.texto;

  const lidarComPressionar = () => {
    if (estaDesabilitado) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    aoPresionar();
  };

  return (
    <Pressable
      onPress={lidarComPressionar}
      disabled={estaDesabilitado}
      accessibilityRole="button"
      accessibilityLabel={texto}
      accessibilityState={{ disabled: estaDesabilitado, busy: carregando }}
      style={({ pressed }) => [
        estilos.container,
        primario && { backgroundColor: cores.destaque },
        variante === 'ghost' && { backgroundColor: cores.destaqueSuave },
        variante === 'outline' && { borderWidth: 1, borderColor: cores.separador },
        pressed && !estaDesabilitado && estilos.pressionado,
        estaDesabilitado && estilos.desabilitado,
        estilo,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={corTexto} size="small" />
      ) : (
        <Text style={[estilos.texto, { color: corTexto }, estiloTexto]}>{texto}</Text>
      )}
    </Pressable>
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
  pressionado: {
    transform: [{ scale: 0.97 }],
    opacity: 0.85,
  },
  desabilitado: {
    opacity: 0.4,
  },
});
