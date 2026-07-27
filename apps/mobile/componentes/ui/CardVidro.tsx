// ============================================================
// COMPONENTE: CardVidro
// ============================================================
// O componente visual mais importante do FitApp.
// Implementa o efeito "liquid glass": um card semi-transparente
// com blur (desfoque) no fundo, borda luminosa e sombra colorida.
//
// É a base visual de todos os cards do app: dashboard, treino,
// dieta, questionário, etc. Qualquer conteúdo pode ir dentro.
//
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
          // Sombra (iOS)
          shadowColor: Cores.primaria.base,
          shadowOpacity: Glass.sombraOpacidade,
          shadowRadius: Glass.sombraRaio,
          shadowOffset: { width: 0, height: 8 },
          // Sombra (Android)
          elevation: 4,
        },
        estilo,
      ]}
    >
      {usarFallback ? (
        // Fallback: fundo sólido semi-transparente (sem blur)
        <View
          style={[
            estilos.conteudo,
            {
              backgroundColor: Cores.vidro.fundo,
              borderRadius,
              padding: paddingValue,
            },
          ]}
        >
          {children}
        </View>
      ) : (
        // Glass real: BlurView com blur de fundo
        <BlurView
          intensity={Glass.blurIntensidade}
          tint="dark"
          style={[
            estilos.conteudo,
            {
              borderRadius,
              padding: paddingValue,
            },
          ]}
        >
          {children}
        </BlurView>
      )}

      {/* Borda luminosa — simula reflexo de luz no vidro */}
      <View
        style={[
          estilos.borda,
          {
            borderRadius,
            borderColor: Cores.vidro.borda,
          },
        ]}
        // Não intercepta toques (é só visual)
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
    ...StyleSheet.absoluteFill,
    borderWidth: Glass.bordaLargura,
  },
});
