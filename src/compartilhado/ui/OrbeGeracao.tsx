// Orbe de partículas da tela de geração (mockup geracao-plano, opção B):
// globo de pontos girando, varredura de luz e partículas em órbitas inclinadas.
// Sem lógica de plano. `parado` (Reduzir Movimento) congela num quadro fixo.

import React, { useMemo } from 'react';
import { Canvas, Circle, Points, RadialGradient, useClock, vec } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';

const TAMANHO = 260;
const C = TAMANHO / 2;
const R = 84;
const N_PONTOS = 150;
const INCLINACAO = 0.35;
const ORBITAS = [0.5, -0.7, 1.1];
const N_PARTICULAS = 24;
const ANGULO_OURO = 2.39996;

// Esfera de Fibonacci: pontos uniformes na superfície.
const PONTOS = Array.from({ length: N_PONTOS }, (_, i) => {
  const y = 1 - (2 * (i + 0.5)) / N_PONTOS;
  const r = Math.sqrt(1 - y * y);
  const a = i * ANGULO_OURO;
  return [Math.cos(a) * r, y, Math.sin(a) * r] as const;
});

interface Props {
  cor: string;
  parado?: boolean;
}

export function OrbeGeracao({ cor, parado = false }: Props) {
  const relogio = useClock();
  const grupos = useDerivedValue(() => {
    'worklet';
    const t = parado ? 1.2 : relogio.value / 1000;
    const giro = t * 0.9;
    const varredura = ((t * 0.9) % 2) - 1;
    const tras = [];
    const frente = [];
    const quentes = [];
    for (const [px, py, pz] of PONTOS) {
      const x = px * Math.cos(giro) - pz * Math.sin(giro);
      const z = px * Math.sin(giro) + pz * Math.cos(giro);
      const y2 = py * Math.cos(INCLINACAO) - z * Math.sin(INCLINACAO);
      const z2 = py * Math.sin(INCLINACAO) + z * Math.cos(INCLINACAO);
      const ponto = vec(C + x * R, C + y2 * R);
      if (Math.abs(y2 - varredura) < 0.12) quentes.push(ponto);
      else if (z2 > 0) frente.push(ponto);
      else tras.push(ponto);
    }
    const particulas = [];
    for (let i = 0; i < N_PARTICULAS; i++) {
      const a = t * (0.7 + (i % 5) * 0.12) + i * 1.7;
      const inclinacao = ORBITAS[i % 3];
      const rx = R * (1.25 + (i % 4) * 0.1);
      const px = Math.cos(a) * rx;
      const py = Math.sin(a) * rx * 0.35;
      particulas.push(
        vec(
          C + px * Math.cos(inclinacao) - py * Math.sin(inclinacao),
          C + px * Math.sin(inclinacao) + py * Math.cos(inclinacao),
        ),
      );
    }
    return { tras, frente, quentes, particulas };
  });
  const tras = useDerivedValue(() => grupos.value.tras);
  const frente = useDerivedValue(() => grupos.value.frente);
  const quentes = useDerivedValue(() => grupos.value.quentes);
  const particulas = useDerivedValue(() => grupos.value.particulas);
  const brilho = useMemo(() => [cor + '33', cor + '00'], [cor]);

  return (
    <Canvas style={{ width: TAMANHO, height: TAMANHO }}>
      <Circle c={vec(C, C)} r={R * 1.5}>
        <RadialGradient c={vec(C, C)} r={R * 1.5} colors={brilho} />
      </Circle>
      <Points
        points={tras}
        mode="points"
        color={cor}
        opacity={0.3}
        strokeWidth={2}
        strokeCap="round"
      />
      <Points
        points={frente}
        mode="points"
        color={cor}
        opacity={0.75}
        strokeWidth={3}
        strokeCap="round"
      />
      <Points points={quentes} mode="points" color={cor} strokeWidth={5} strokeCap="round" />
      <Points
        points={particulas}
        mode="points"
        color="#FFFFFF"
        opacity={0.8}
        strokeWidth={4}
        strokeCap="round"
      />
    </Canvas>
  );
}
