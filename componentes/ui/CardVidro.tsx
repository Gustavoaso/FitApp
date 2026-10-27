// ============================================================
// COMPONENTE: CardVidro
// ============================================================
// Container base de todos os cards do FitApp — Clean Dark UI.
// Fundo escuro sólido, borda sutil opcional, sem glow colorido.
// Border radius uniforme: 16px em toda a UI.
// ============================================================

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';
import { Cores, Raio, Espacamento, Glass } from '../../constantes/Cores';

/** Props do CardVidro */
interface CardVidroProps {
  /** Conteúdo que será exibido dentro do card */
  children: React.ReactNode;
  /** Estilos extras para o container (opcional) */
  estilo?: ViewStyle;
  /** Padding interno do card. Padrão: lg (16px) */
  padding?: keyof typeof Espacamento;
  /** Raio da borda. Padrão: xl (20px) */
  raio?: keyof typeof Raio;
  /** Se true, remove totalmente a borda do card */
  semBorda?: boolean;
}

/**
 * CardVidro — Container de card com estética escuro minimalista.
 */
export function CardVidro({
  children,
  estilo,
  padding = 'lg',
  raio = 'xl',
  semBorda = false,
}: CardVidroProps) {
  const borderRadius = Raio[raio];
  const paddingValue = Espacamento[padding];

  return (
    <View
      style={[
        estilos.container,
        {
          borderRadius,
          shadowColor: '#000000',
          shadowOpacity: 0.35,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 3,
        },
        estilo,
      ]}
    >
      <View
        style={[
          estilos.conteudo,
          {
            backgroundColor: Cores.fundo.superficie,
            borderRadius,
            padding: paddingValue,
          },
        ]}
      >
        {children}
      </View>

      {/* Borda sutil overlay — ocultada se semBorda === true */}
      {!semBorda && (
        <View
          style={[
            estilos.borda,
            {
              borderRadius,
              borderColor: Cores.borda.sutil,
            },
          ]}
          pointerEvents="none"
        />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  conteudo: {
    overflow: 'hidden',
  },
  borda: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: Glass.bordaLargura,
  },
});
