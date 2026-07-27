// ============================================================
// COMPONENTE: Ícones de Navegação Minimalistas (SF Symbols Style)
// ============================================================

import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface PropsIcone {
  cor: string;
  tamanho?: number;
}

export function IconeInicio({ cor, tamanho = 22 }: PropsIcone) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10.182L10.74 3.732a2 2 0 012.52 0L21 10.182M5 8.5V19a2 2 0 002 2h10a2 2 0 002-2V8.5"
        stroke={cor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconeTreino({ cor, tamanho = 22 }: PropsIcone) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6.5 6.5h11M6.5 17.5h11M3 8v8a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1H4a1 1 0 00-1 1zm15 0v8a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1h-1a1 1 0 00-1 1zM6 12h12"
        stroke={cor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconeDieta({ cor, tamanho = 22 }: PropsIcone) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21a9 9 0 100-18 9 9 0 000 18z"
        stroke={cor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 7c-2.5 0-4.5 2-4.5 4.5S9.5 16 12 16s4.5-2 4.5-4.5S14.5 7 12 7z"
        stroke={cor}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 3v4"
        stroke={cor}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function IconePerfil({ cor, tamanho = 22 }: PropsIcone) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 11a4 4 0 100-8 4 4 0 000 8zM4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1"
        stroke={cor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
