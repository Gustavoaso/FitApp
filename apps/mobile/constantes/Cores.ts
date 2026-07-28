// ============================================================
// CONSTANTES VISUAIS — DESIGN SYSTEM DO FITAPP
// ============================================================
// Clean Dark UI — referência Oura, WHOOP, Fitbod, Linear, Apple HIG.
//
// Princípios:
// - Tipografia: SF Pro (fonte padrão do iOS)
// - Base monocromática: preto/grafite/cinza-chumbo
// - UMA única cor de destaque (accent): branco #FFFFFF
// - Sem gradientes decorativos, sem emojis, sem glow colorido
// - Border radius uniforme: 16px para todos os cards
// ============================================================

import { Platform } from 'react-native';

export const Cores = {
  fundo: {
    principal: '#080A0E',
    superficie: '#101318',
    elevada: '#181C23',
  },

  // Única cor de destaque — branco puro (estilo Arc / Linear)
  accent: '#FFFFFF',
  accentSuave: 'rgba(255, 255, 255, 0.08)',
  accentBorda: 'rgba(255, 255, 255, 0.20)',

  // Destaque de ação especial (ex: FAB de adicionar)
  amarelo: '#EAB308',

  texto: {
    principal: '#F4F5F7',
    secundario: '#6B7280',
    desabilitado: '#374151',
  },

  borda: {
    sutil: 'rgba(255, 255, 255, 0.07)',
    media: 'rgba(255, 255, 255, 0.12)',
    forte: 'rgba(255, 255, 255, 0.20)',
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
    borda: 'rgba(255, 255, 255, 0.07)',
    brilho: 'rgba(255, 255, 255, 0.12)',
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
 * Família de fonte padrão do sistema iOS (SF Pro).
 */
export const FamiliaFonte = {
  padrao: Platform.OS === 'ios' ? 'System' : 'sans-serif',
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
