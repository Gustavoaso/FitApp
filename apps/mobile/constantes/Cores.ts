// ============================================================
// CONSTANTES VISUAIS — DESIGN SYSTEM DO FITAPP
// ============================================================
// Todas as cores, espaçamentos e tamanhos de fonte do app
// centralizados aqui. Mudar uma cor aqui muda em todo o app.
//
// Seguimos o estilo "liquid glass": fundo escuro + cards com
// blur/transparência + bordas luminosas + sombras coloridas.
// ============================================================

/**
 * Paleta de cores do FitApp.
 *
 * Organização:
 * - `fundo.*`: cores de fundo (do mais escuro ao mais claro)
 * - `vidro.*`: cores do efeito glass (transparentes)
 * - `primaria.*`: cor de destaque principal (roxo)
 * - `secundaria`: cor de destaque secundária (cyan)
 * - `feedback.*`: cores de feedback (sucesso, alerta, erro)
 * - `texto.*`: cores de texto
 */
export const Cores = {
  // Fundos
  fundo: {
    principal: '#0A0E17',      // Fundo da tela
    superficie: '#141A2A',     // Cards, containers
    elevada: '#1C2438',        // Cards elevados, modais
  },

  // Efeito glass (transparências)
  vidro: {
    fundo: 'rgba(255, 255, 255, 0.06)',   // Background do card glass
    borda: 'rgba(255, 255, 255, 0.12)',   // Borda sutil do card glass
    brilho: 'rgba(255, 255, 255, 0.18)',  // Hover/destaque
  },

  // Cor primária (roxo vibrante)
  primaria: {
    base: '#6C5CE7',
    suave: 'rgba(108, 92, 231, 0.15)',    // Fundo de badges
    gradienteInicio: '#6C5CE7',           // Início do gradiente
    gradienteFim: '#A855F7',             // Fim do gradiente
  },

  // Cor secundária (cyan)
  secundaria: '#00D2FF',

  // Feedback
  feedback: {
    sucesso: '#00E676',
    alerta: '#FFD600',
    erro: '#FF5252',
  },

  // Texto
  texto: {
    principal: '#F0F0F5',
    secundario: '#8B92A8',
    desabilitado: '#4A5068',
  },
} as const;

/**
 * Espaçamentos padronizados.
 * Usar múltiplos de 4px para manter o ritmo visual.
 */
export const Espacamento = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/**
 * Raios de borda padrão.
 */
export const Raio = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999, // Cápsula (botões pill)
} as const;

/**
 * Tamanhos de fonte seguindo a escala tipográfica do design system.
 */
export const Fonte = {
  micro: 12,
  label: 14,
  corpo: 16,
  subtitulo: 18,
  titulo: 24,
  display: 32,
} as const;

/**
 * Pesos de fonte.
 * React Native usa strings numéricas para fontWeight.
 */
export const PesoFonte = {
  regular: '400' as const,
  medio: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

/**
 * Configurações do efeito glass (blur).
 * Usadas pelo componente CardVidro.
 */
export const Glass = {
  blurIntensidade: 20,        // Intensidade do blur do expo-blur
  bordaLargura: 1,            // Largura da borda luminosa
  sombraRaio: 20,             // Raio da sombra
  sombraOpacidade: 0.15,      // Opacidade da sombra
} as const;
