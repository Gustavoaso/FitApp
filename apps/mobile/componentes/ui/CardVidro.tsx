// ============================================================
// COMPONENTE: CardVidro
// ============================================================
// Container base de todos os cards do FitApp — Clean Dark UI.
// Fundo escuro sólido, borda sutil monocromática, sem glow colorido.
// Border radius uniforme: 16px em toda a UI.
// ============================================================
// COMO FUNCIONA:
//
// 1. <BlurView> (do expo-blur) aplica um desfoque no conteúdo
//    que está atrás do card, criando o efeito de "vidro fosco".
//
// 2. Uma <View> com borda semi-transparente branca simula o
//    reflexo de luz na borda do vidro.
//
// 3. Uma sombra com matiz roxo (cor primária) cria profundidade.
//
// Resultado: parece uma placa de vidro flutuando sobre o fundo.
// ============================================================

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
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
}

/**
 * CardVidro — Container com efeito "liquid glass".
 *
 * Uso:
 * ```tsx
 * <CardVidro>
 *   <Text>Conteúdo aqui</Text>
 * </CardVidro>
 * ```
 */
export function CardVidro({
  children,
  estilo,
  padding = 'lg',
  raio = 'xl',
}: CardVidroProps) {
  const borderRadius = Raio[raio];
  const paddingValue = Espacamento[padding];

  // No Android antigo e na web, o BlurView pode não funcionar.
  // Nesse caso, usamos um fundo sólido semi-transparente como fallback.
  const usarFallback = Platform.OS === 'web';

  return (
    <View
      style={[
        estilos.container,
        {
          borderRadius,
          // Sombra neutra — sem cor, indicando apenas profundidade
          shadowColor: '#000000',
          shadowOpacity: 0.35,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 3,
        },
        estilo,
      ]}
    >
      {usarFallback ? (
        // Fallback para web: fundo sólido
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
      ) : (
        // iOS/Android: fundo escuro sólido — sem blur para evitar inconsistências
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
      )}

      {/* Borda sutil — sem cor, apenas luminosidade mínima */}
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
    // Posiciona a borda sobre o conteúdo (absolutamente)
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: Glass.bordaLargura,
  },
});
