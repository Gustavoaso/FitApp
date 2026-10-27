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

// ============================================================
// TEMA DINÂMICO (claro e escuro) — etapa 3
// ============================================================
// Os exports acima continuam para as telas antigas; as telas migram para
// useTema() na etapa 4. Valores do docs/VISUAL.md.

/** Escala tipográfica da HIG (Dynamic Type padrão), com mínimo de 13 pt. */
export const Tipografia = {
  tituloGrande: 34,
  titulo1: 28,
  titulo2: 22,
  titulo3: 20,
  destaque: 17,
  corpo: 17,
  chamada: 16,
  subtitulo: 15,
  rodape: 13,
  legenda: 13,
} as const;

/** Raio dos cartões (VISUAL.md). Botões usam cápsula (Raio.full). */
export const RAIO_CARTAO = 20;

/** Cores fixas por macro: o mesmo significado em gráficos, listas e anéis. */
export const CoresMacros = {
  proteina: '#F05A28',
  carboidrato: '#EAB308',
  gordura: '#A1A1AA',
  agua: '#38BDF8',
} as const;

export interface CoresTema {
  fundo: string;
  superficie: string;
  elevada: string;
  texto: string;
  textoSecundario: string;
  separador: string;
  /** Cor do botão principal (CTA) e do progresso. */
  destaque: string;
  /** Texto sobre a cor de destaque. */
  textoSobreDestaque: string;
  /** Fundo do botão secundário e trilha dos anéis. */
  destaqueSuave: string;
  esqueleto: string;
  erro: string;
  sucesso: string;
}

export const CoresEscuro: CoresTema = {
  fundo: '#000000',
  superficie: '#121418',
  elevada: '#1A1D24',
  texto: '#FFFFFF',
  textoSecundario: '#A1A1AA',
  separador: 'rgba(255, 255, 255, 0.12)',
  destaque: '#FFFFFF',
  textoSobreDestaque: '#080A0E',
  destaqueSuave: 'rgba(255, 255, 255, 0.12)',
  esqueleto: '#1A1D24',
  erro: '#EF4444',
  sucesso: '#10B981',
};

// PREMISSA: separador, esqueleto e tons de erro/sucesso do claro não estão no
// VISUAL.md; escolhidos para manter contraste no fundo claro.
export const CoresClaro: CoresTema = {
  fundo: '#F2F2F7',
  superficie: '#FFFFFF',
  elevada: '#FFFFFF',
  texto: '#0A0A0A',
  textoSecundario: '#52525B',
  separador: 'rgba(0, 0, 0, 0.10)',
  destaque: '#0A0A0A',
  textoSobreDestaque: '#FFFFFF',
  destaqueSuave: 'rgba(0, 0, 0, 0.08)',
  esqueleto: '#E4E4E7',
  erro: '#DC2626',
  sucesso: '#059669',
};

/** Razão de contraste WCAG entre duas cores hex de 6 dígitos (#RRGGBB). */
export function razaoContraste(corA: string, corB: string): number {
  const luminancia = (hex: string) => {
    const valido = /^#[0-9a-f]{6}$/i.test(hex);
    if (!valido) throw new Error(`Cor inválida: ${hex}`);
    const [r, g, b] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [claro, escuro] = [luminancia(corA), luminancia(corB)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
}
