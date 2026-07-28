// ============================================================
// CONSTANTES VISUAIS — DESIGN SYSTEM DO FITAPP
// ============================================================
// Clean Dark UI — referência Oura, WHOOP, Fitbod, Linear, Apple HIG.
//
// Princípios:
// - Tipografia: SF Compact Rounded (fonte nativa arredondada da Apple)
// - Base monocromática: preto/grafite/cinza-chumbo
// - UMA única cor de destaque (accent): branco #FFFFFF
// - Sem gradientes decorativos, sem emojis, sem glow colorido
// - Border radius uniforme: 16px para todos os cards
// ============================================================

import { Platform } from 'react-native';

export const Cores = {
  fundo: {
    principal: '#000000',    // Preto puro estilo OLED iOS
    superficie: '#121418',   // Cards de primeiro nível
    elevada: '#1A1D24',      // Modais e elementos elevados
  },

  // Única cor de destaque — branco puro
  accent: '#FFFFFF',
  accentSuave: 'rgba(255, 255, 255, 0.08)',
  accentBorda: 'rgba(255, 255, 255, 0.20)',

  // Destaques de ação especial
  amarelo: '#EAB308',
  laranja: '#F05A28',

  texto: {
    principal: '#FFFFFF',
    secundario: '#71717A',
    desabilitado: '#3F3F46',
  },

  borda: {
    sutil: 'rgba(255, 255, 255, 0.08)',
    media: 'rgba(255, 255, 255, 0.15)',
    forte: 'rgba(255, 255, 255, 0.25)',
  },

  feedback: {
    sucesso: '#10B981',
    erro: '#EF4444',
  },

  // Compatibilidade retroativa
  primaria: {
    base: '#FFFFFF',
    suave: 'rgba(255, 255, 255, 0.08)',
    gradienteInicio: '#FFFFFF',
    gradienteFim: '#FFFFFF',
  },
  secundaria: '#FFFFFF',
  vidro: {
    fundo: 'rgba(255, 255, 255, 0.04)',
    borda: 'rgba(255, 255, 255, 0.08)',
    brilho: 'rgba(255, 255, 255, 0.15)',
  },
} as const;

export const Espacamento = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const Raio = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const Fonte = {
  micro: 12,
  label: 14,
  corpo: 16,
  subtitulo: 18,
  titulo: 20,
  display: 28,
} as const;

/**
 * Família de fonte oficial Apple: SF Compact Rounded
 */
export const FamiliaFonte = {
  regular: 'SF-Compact-Rounded-Regular',
  medio: 'SF-Compact-Rounded-Medium',
  semibold: 'SF-Compact-Rounded-Semibold',
  bold: 'SF-Compact-Rounded-Bold',
  extrabold: 'SF-Compact-Rounded-Bold',
} as const;

export const PesoFonte = {
  regular: '400' as const,
  medio: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Glass = {
  blurIntensidade: 20,
  bordaLargura: 1,
  sombraRaio: 16,
  sombraOpacidade: 0.08,
} as const;
