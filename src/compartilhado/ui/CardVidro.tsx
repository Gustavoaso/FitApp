// ============================================================
// COMPONENTE: CardVidro
// ============================================================
// Container base dos cards. Apesar do nome (mantido para não mexer nas
// telas), é superfície sólida: o vidro fica só na navegação (VISUAL.md).
// ============================================================

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Espacamento, Raio, RAIO_CARTAO } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';

interface CardVidroProps {
  children: React.ReactNode;
  estilo?: ViewStyle;
  /** Padding interno. Padrão: lg (16). */
  padding?: keyof typeof Espacamento;
  /** Raio da borda. Padrão: o raio dos cartões (20). */
  raio?: keyof typeof Raio;
  semBorda?: boolean;
  /** Resumo lido pelo VoiceOver; agrupa o card num elemento só. */
  rotuloAcessibilidade?: string;
}

export function CardVidro({
  children,
  estilo,
  padding = 'lg',
  raio,
  semBorda = false,
  rotuloAcessibilidade,
}: CardVidroProps) {
  const { cores } = useTema();

  return (
    <View
      accessible={rotuloAcessibilidade ? true : undefined}
      accessibilityLabel={rotuloAcessibilidade}
      style={[
        estilos.container,
        {
          backgroundColor: cores.superficie,
          borderRadius: raio ? Raio[raio] : RAIO_CARTAO,
          padding: Espacamento[padding],
          borderColor: cores.separador,
          borderWidth: semBorda ? 0 : StyleSheet.hairlineWidth,
        },
        estilo,
      ]}
    >
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
