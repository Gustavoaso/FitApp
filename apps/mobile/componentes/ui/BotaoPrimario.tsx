// ============================================================
// COMPONENTE: BotaoPrimario
// ============================================================
// Botão principal do app — Clean Dark UI.
// Background: accent sólido (#3B82F6), sem gradiente vibrante.
// Feedback háptico sutil + escala de press.
// ============================================================

import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Cores, Raio, Espacamento, Fonte, PesoFonte } from '../../constantes/Cores';

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
  const estaDesabilitado = desabilitado || carregando;

  const lidarComPressionar = () => {
    if (estaDesabilitado) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    aoPresionar();
  };

  const estiloVariante =
    variante === 'outline'
      ? estilos.containerOutline
      : variante === 'ghost'
        ? estilos.containerGhost
        : estilos.containerPrimario;

  const estiloTextoVariante =
    variante === 'primario' ? estilos.textoPrimario : estilos.textoAlternativo;

  return (
    <Pressable
      onPress={lidarComPressionar}
      disabled={estaDesabilitado}
      style={({ pressed }) => [
        estilos.container,
        estiloVariante,
        pressed && !estaDesabilitado && estilos.pressionado,
        estaDesabilitado && estilos.desabilitado,
        estilo,
      ]}
    >
      <View style={estilos.conteudo}>
        {carregando ? (
          <ActivityIndicator
            color={variante === 'primario' ? '#FFFFFF' : Cores.accent}
            size="small"
          />
        ) : (
          <Text style={[estilos.texto, estiloTextoVariante, estiloTexto]}>{texto}</Text>
        )}
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  container: {
    borderRadius: Raio.lg,
    overflow: 'hidden',
  },
  containerPrimario: {
    backgroundColor: Cores.accent,
    // Sombra neutra — sem glow colorido
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  containerOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Cores.accentBorda,
  },
  containerGhost: {
    backgroundColor: Cores.accentSuave,
  },
  conteudo: {
    paddingVertical: Espacamento.lg,
    paddingHorizontal: Espacamento.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  texto: {
    fontSize: Fonte.corpo,
    fontWeight: PesoFonte.semibold,
  },
  textoPrimario: {
    color: '#FFFFFF',
  },
  textoAlternativo: {
    color: Cores.accent,
  },
  pressionado: {
    transform: [{ scale: 0.97 }],
    opacity: 0.85,
  },
  desabilitado: {
    opacity: 0.4,
  },
});
