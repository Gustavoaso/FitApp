// ============================================================
// COMPONENTE: GraficoDonutMacros
// ============================================================
// Gráfico Donut de Macronutrientes (Carbos, Gordura, Proteína)
// Inspirado no design do MyFitnessPal com estética Liquid Glass.
// ============================================================

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { CoresTema, CoresMacros, FamiliaFonte, Fonte, PesoFonte } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';

interface PropsGraficoDonutMacros {
  calorias: number;
  carbosGramas: number;
  gordurasGramas: number;
  proteinasGramas: number;
  tamanho?: number;
  espessura?: number;
}

export function GraficoDonutMacros({
  calorias,
  carbosGramas,
  gordurasGramas,
  proteinasGramas,
  tamanho = 90,
  espessura = 7,
}: PropsGraficoDonutMacros) {
  const { cores } = useTema();
  const estilos = useMemo(() => criarEstilos(cores), [cores]);
  const raio = (tamanho - espessura) / 2;
  const circunferencia = 2 * Math.PI * raio;

  const totalGramas = (carbosGramas + gordurasGramas + proteinasGramas) || 1;
  const pctCarbos = carbosGramas / totalGramas;
  const pctGorduras = gordurasGramas / totalGramas;
  const pctProteinas = proteinasGramas / totalGramas;

  // Calculando offset para arcos contínuos
  const lenCarbos = pctCarbos * circunferencia;
  const lenGorduras = pctGorduras * circunferencia;
  const lenProteinas = pctProteinas * circunferencia;

  const offsetCarbos = 0;
  const offsetGorduras = -lenCarbos;
  const offsetProteinas = -(lenCarbos + lenGorduras);

  return (
    <View
      style={[estilos.container, { width: tamanho, height: tamanho }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${Math.round(calorias)} calorias: ${Math.round(proteinasGramas)} g de proteína, ${Math.round(carbosGramas)} g de carboidrato e ${Math.round(gordurasGramas)} g de gordura`}
    >
      <Svg width={tamanho} height={tamanho}>
        <G rotation="-90" origin={`${tamanho / 2}, ${tamanho / 2}`}>
          {/* Fundo do Donut */}
          <Circle
            cx={tamanho / 2}
            cy={tamanho / 2}
            r={raio}
            stroke={cores.separador}
            strokeWidth={espessura}
            fill="transparent"
          />

          {/* Arco Carbos */}
          {pctCarbos > 0 && (
            <Circle
              cx={tamanho / 2}
              cy={tamanho / 2}
              r={raio}
              stroke={CoresMacros.carboidrato}
              strokeWidth={espessura}
              fill="transparent"
              strokeDasharray={`${lenCarbos} ${circunferencia - lenCarbos}`}
              strokeDashoffset={offsetCarbos}
              strokeLinecap="round"
            />
          )}

          {/* Arco Gorduras */}
          {pctGorduras > 0 && (
            <Circle
              cx={tamanho / 2}
              cy={tamanho / 2}
              r={raio}
              stroke={CoresMacros.gordura}
              strokeWidth={espessura}
              fill="transparent"
              strokeDasharray={`${lenGorduras} ${circunferencia - lenGorduras}`}
              strokeDashoffset={offsetGorduras}
              strokeLinecap="round"
            />
          )}

          {/* Arco Proteínas */}
          {pctProteinas > 0 && (
            <Circle
              cx={tamanho / 2}
              cy={tamanho / 2}
              r={raio}
              stroke={CoresMacros.proteina}
              strokeWidth={espessura}
              fill="transparent"
              strokeDasharray={`${lenProteinas} ${circunferencia - lenProteinas}`}
              strokeDashoffset={offsetProteinas}
              strokeLinecap="round"
            />
          )}
        </G>
      </Svg>

      {/* Conteúdo Central */}
      <View style={estilos.centro}>
        <Text style={estilos.caloriasValor}>{Math.round(calorias)}</Text>
        <Text style={estilos.caloriasLabel}>cal</Text>
      </View>
    </View>
  );
}

const criarEstilos = (cores: CoresTema) =>
  StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centro: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caloriasValor: {
    fontFamily: FamiliaFonte.bold,
    fontSize: 16,
    fontWeight: PesoFonte.bold,
    color: cores.texto,
    letterSpacing: -0.5,
  },
  caloriasLabel: {
    fontFamily: FamiliaFonte.regular,
    fontSize: 10,
    color: cores.textoSecundario,
    marginTop: -2,
  },
});
