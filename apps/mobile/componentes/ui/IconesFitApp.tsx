// ============================================================
// ÍCONES FITAPP — Iconografia Vetorial Centralizada
// ============================================================
// Todos os ícones da interface em SVG outline, estilo Lucide/Phosphor.
// Regras de design:
//   - Stroke width: 1.5px uniforme
//   - ViewBox: 0 0 24 24 em todos
//   - Sem fill sólido (apenas stroke)
//   - Cor passada via prop `cor` (padrão: cor do texto secundário)
//   - Tamanho passado via prop `tamanho` (padrão: 22)
// ============================================================

import React from 'react';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';
import { Cores } from '../../constantes/Cores';

interface PropsIcone {
  tamanho?: number;
  cor?: string;
  strokeWidth?: number;
}

const strokePadrao = 1.6;

// ── Navegação ─────────────────────────────────────────────────

/** Tab Home / Dashboard — ícone de casa */
export function IconeCasa({ tamanho = 22, cor = Cores.texto.secundario, strokeWidth = strokePadrao }: PropsIcone) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" stroke={cor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 21V12h6v9" stroke={cor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Tab Treino — ícone de haltere (dumbbell) */
export function IconeHaltere({ tamanho = 22, cor = Cores.texto.secundario, strokeWidth = strokePadrao }: PropsIcone) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none">
      <Path d="M6.5 6.5h11M6.5 17.5h11" stroke={cor} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Rect x="2" y="8" width="3.5" height="8" rx="1.5" stroke={cor} strokeWidth={strokeWidth} />
      <Rect x="18.5" y="8" width="3.5" height="8" rx="1.5" stroke={cor} strokeWidth={strokeWidth} />
      <Line x1="6.5" y1="12" x2="17.5" y2="12" stroke={cor} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

/** Tab Dieta/Nutrição — ícone de garfo + faca */
export function IconePrato({ tamanho = 22, cor = Cores.texto.secundario, strokeWidth = strokePadrao }: PropsIcone) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none">
      <Path d="M8 3v5c0 1.66 1.34 3 3 3s3-1.34 3-3V3" stroke={cor} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="11" y1="11" x2="11" y2="21" stroke={cor} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M16 3v18" stroke={cor} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M19 3v6l-3 3" stroke={cor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Tab Perfil — ícone de usuário */
export function IconeUsuario({ tamanho = 22, cor = Cores.texto.secundario, strokeWidth = strokePadrao }: PropsIcone) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={cor} strokeWidth={strokeWidth} />
      <Path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" stroke={cor} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

// ── Macronutrientes ───────────────────────────────────────────

/** Ícone de proteína — silhueta de frango/bife estilizado */
export function IconeProteina({ tamanho = 20, cor = Cores.texto.secundario, strokeWidth = strokePadrao }: PropsIcone) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8c0-3.31-2.69-6-6-6S6 4.69 6 8c0 2.72 1.73 5.04 4.16 5.77L9 21h6l-1.16-7.23C16.27 13.04 18 10.72 18 8z" stroke={cor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Ícone de carboidrato — grão/trigo */
export function IconeCarbo({ tamanho = 20, cor = Cores.texto.secundario, strokeWidth = strokePadrao }: PropsIcone) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3C9 3 7 5.5 7 8c0 2 1 3.5 2.5 4.5L12 21l2.5-8.5C16 11.5 17 10 17 8c0-2.5-2-5-5-5z" stroke={cor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 8v5" stroke={cor} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

/** Ícone de gordura — gota de óleo */
export function IconeGordura({ tamanho = 20, cor = Cores.texto.secundario, strokeWidth = strokePadrao }: PropsIcone) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3L5 12.5C5 16.64 8.13 20 12 20s7-3.36 7-7.5L12 3z" stroke={cor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Hidratação ────────────────────────────────────────────────

/** Ícone de água — gota */
export function IconeAgua({ tamanho = 20, cor = Cores.texto.secundario, strokeWidth = strokePadrao }: PropsIcone) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3L6 11c0 3.31 2.69 6 6 6s6-2.69 6-6L12 3z" stroke={cor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Ações & Navegação ─────────────────────────────────────────

/** Chevron direita — navegação de lista */
export function IconeChevronDireita({ tamanho = 18, cor = Cores.texto.desabilitado, strokeWidth = strokePadrao }: PropsIcone) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={cor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Raio/Flash — ação de iniciar / energia */
export function IconeRaio({ tamanho = 20, cor = Cores.accent, strokeWidth = strokePadrao }: PropsIcone) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none">
      <Polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" stroke={cor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Sino — notificações */
export function IconeSino({ tamanho = 20, cor = Cores.texto.secundario, strokeWidth = strokePadrao }: PropsIcone) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={cor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={cor} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

/** Engrenagem — configurações */
export function IconeEngrenagem({ tamanho = 20, cor = Cores.texto.secundario, strokeWidth = strokePadrao }: PropsIcone) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={cor} strokeWidth={strokeWidth} />
      <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke={cor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Régua — unidades de medida */
export function IconeRegua({ tamanho = 20, cor = Cores.texto.secundario, strokeWidth = strokePadrao }: PropsIcone) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="7" width="20" height="10" rx="2" stroke={cor} strokeWidth={strokeWidth} />
      <Line x1="6" y1="11" x2="6" y2="13" stroke={cor} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="9" y1="11" x2="9" y2="13" stroke={cor} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="12" y1="10" x2="12" y2="14" stroke={cor} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="15" y1="11" x2="15" y2="13" stroke={cor} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="18" y1="11" x2="18" y2="13" stroke={cor} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

/** Lua — aparência/tema */
export function IconeLua({ tamanho = 20, cor = Cores.texto.secundario, strokeWidth = strokePadrao }: PropsIcone) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none">
      <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke={cor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Plus — adicionar */
export function IconeMais({ tamanho = 20, cor = Cores.accent, strokeWidth = strokePadrao }: PropsIcone) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none">
      <Line x1="12" y1="5" x2="12" y2="19" stroke={cor} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="5" y1="12" x2="19" y2="12" stroke={cor} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

/** Check — conclusão */
export function IconeCheck({ tamanho = 16, cor = '#080A0E', strokeWidth = 2.5 }: PropsIcone) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={cor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Saída — logout */
export function IconeSaida({ tamanho = 20, cor = Cores.texto.secundario, strokeWidth = strokePadrao }: PropsIcone) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none">
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke={cor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="16 17 21 12 16 7" stroke={cor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="21" y1="12" x2="9" y2="12" stroke={cor} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}
