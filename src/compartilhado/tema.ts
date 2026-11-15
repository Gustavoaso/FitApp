// ============================================================
// CONSTANTES VISUAIS — DESIGN SYSTEM DO TREINAAI (docs/VISUAL.md)
// ============================================================
// Neutros + lima elétrico (#D6FF00) + neons com papel fixo.
// Fonte Sora. Zero emoji. Brilho só no CTA principal.
// ============================================================

import { Platform } from 'react-native';

export const Cores = {
  fundo: {
    principal: '#000000', // Preto puro estilo OLED iOS
    superficie: '#121418', // Cards de primeiro nível
    elevada: '#1A1D24', // Modais e elementos elevados
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
  xl: 24,
  full: 9999,
} as const;

export const Fonte = {
  micro: 13,
  label: 14,
  corpo: 16,
  subtitulo: 17,
  titulo: 18,
  display: 24,
} as const;

/** Família de fonte do app: Sora (assets/fonts). */
export const FamiliaFonte = {
  regular: 'Sora-Regular',
  medio: 'Sora-Medium',
  // Pesos um degrau mais leves (pedido do dono em 2026-11-15: visual mais suave).
  semibold: 'Sora-Medium',
  bold: 'Sora-Semibold',
  extrabold: 'Sora-Semibold',
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
  tituloGrande: 30,
  titulo1: 24,
  titulo2: 20,
  titulo3: 18,
  destaque: 17,
  corpo: 17,
  chamada: 16,
  subtitulo: 15,
  rodape: 13,
  legenda: 13,
} as const;

/** Raio dos cartões (VISUAL.md). Botões usam cápsula (Raio.full). */
export const RAIO_CARTAO = 24;

/** Cores fixas por macro (valor escuro; no claro use `cores.macros`). */
export const CoresMacros = {
  proteina: '#FF8A1F',
  carboidrato: '#FFD60A',
  gordura: '#B57BFF',
  agua: '#3DA5FF',
} as const;

/** Lima elétrico da marca: fundo de CTA e anéis. Nunca texto no tema claro. */
export const LIMA = '#D6FF00';

export interface CoresTema {
  fundo: string;
  superficie: string;
  elevada: string;
  texto: string;
  textoSecundario: string;
  separador: string;
  /** Fundo do botão principal (CTA) e do progresso: lima nos dois temas. */
  destaque: string;
  /** Texto sobre a cor de destaque. */
  textoSobreDestaque: string;
  /** Lima legível como texto/ícone: lima no escuro, oliva escuro no claro. */
  destaqueTexto: string;
  /** Fundo do botão secundário e trilha dos anéis. */
  destaqueSuave: string;
  esqueleto: string;
  erro: string;
  sucesso: string;
  macros: { proteina: string; carboidrato: string; gordura: string; agua: string };
}

export const CoresEscuro: CoresTema = {
  fundo: '#0B0B0D',
  superficie: '#151518',
  elevada: '#1E1E22',
  texto: '#FFFFFF',
  textoSecundario: '#A8A8B0',
  separador: '#2A2A2E',
  destaque: LIMA,
  textoSobreDestaque: '#0B0B0D',
  destaqueTexto: LIMA,
  destaqueSuave: '#2A2A2E',
  esqueleto: '#1E1E22',
  erro: '#FF453A',
  sucesso: '#30D158',
  macros: CoresMacros,
};

export const CoresClaro: CoresTema = {
  fundo: '#F2F2F4',
  superficie: '#FFFFFF',
  elevada: '#FFFFFF',
  texto: '#0B0B0D',
  textoSecundario: '#55555C',
  separador: '#E3E3E7',
  destaque: LIMA,
  textoSobreDestaque: '#0B0B0D',
  destaqueTexto: '#5C6600',
  destaqueSuave: '#E3E3E7',
  esqueleto: '#E3E3E7',
  erro: '#C9261B',
  sucesso: '#1B7F37',
  macros: { proteina: '#B84A00', carboidrato: '#7A5C00', gordura: '#7A3FD0', agua: '#0A66C2' },
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
