// ============================================================
// COMPONENTE: GraficoEvolucao (SVG Line Chart)
// ============================================================
// Gráfico de linha vetorial em SVG para peso e cargas — Clean Dark UI.
// SF Compact Rounded typography, pontos interativos, sem dependências externas.
// ============================================================

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { CoresTema, FamiliaFonte, PesoFonte } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';

export interface PontoGrafico {
  label: string; // Ex: "01/07"
  valor: number; // Ex: 85.0
}

interface PropsGraficoEvolucao {
  dados: PontoGrafico[];
  unidade?: string; // Ex: "kg"
  altura?: number;
  corLinha?: string;
  titulo?: string;
}

export function GraficoEvolucao({
  dados,
  unidade = 'kg',
  altura = 160,
  corLinha,
  titulo,
}: PropsGraficoEvolucao) {
  const { cores } = useTema();
  const estilos = useMemo(() => criarEstilos(cores), [cores]);
  const corDaLinha = corLinha ?? cores.destaque;
  const larguraTela = Dimensions.get('window').width - 72; // Largura interna do card
  const paddingHorizontal = 20;
  const paddingVertical = 25;

  if (!dados || dados.length === 0) {
    return (
      <View style={[estilos.containerVazio, { height: altura }]}>
        <Text style={estilos.textoVazio}>Sem dados de histórico registrados</Text>
      </View>
    );
  }

  const valores = dados.map(d => d.valor);
  const minValor = Math.min(...valores);
  const maxValor = Math.max(...valores);
  const faixa = maxValor - minValor === 0 ? 1 : maxValor - minValor;

  const larguraGrafico = larguraTela - paddingHorizontal * 2;
  const alturaGrafico = altura - paddingVertical * 2;

  // Calcula coordenadas (X, Y) para cada ponto
  const pontosCalculados = dados.map((d, index) => {
    const x =
      paddingHorizontal +
      (dados.length > 1 ? (index / (dados.length - 1)) * larguraGrafico : larguraGrafico / 2);
    const y =
      altura - paddingVertical - ((d.valor - minValor) / faixa) * alturaGrafico;
    return { x, y, valor: d.valor, label: d.label };
  });

  // Constrói o caminho da linha SVG
  let pathD = '';
  pontosCalculados.forEach((p, i) => {
    if (i === 0) {
      pathD += `M ${p.x} ${p.y}`;
    } else {
      pathD += ` L ${p.x} ${p.y}`;
    }
  });

  const primeiro = dados[0];
  const ultimo = dados[dados.length - 1];
  const resumo = `${titulo ? `${titulo}: ` : ''}de ${primeiro.valor}${unidade} em ${primeiro.label} para ${ultimo.valor}${unidade} em ${ultimo.label}, mínimo ${minValor}${unidade}, máximo ${maxValor}${unidade}`;

  return (
    <View
      style={estilos.container}
      accessible
      accessibilityRole="image"
      accessibilityLabel={resumo}
    >
      {titulo ? <Text style={estilos.titulo}>{titulo}</Text> : null}

      <View style={[estilos.svgWrapper, { height: altura }]}>
        <Svg width={larguraTela} height={altura}>
          {/* Linha guia horizontal no meio */}
          <Line
            x1={paddingHorizontal}
            y1={altura / 2}
            x2={larguraTela - paddingHorizontal}
            y2={altura / 2}
            stroke={cores.separador}
            strokeWidth={1}
            strokeDasharray="4 4"
          />

          {/* Linha vetorial do gráfico */}
          <Path
            d={pathD}
            fill="transparent"
            stroke={corDaLinha}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Pontos com círculos e valores */}
          {pontosCalculados.map((p, index) => (
            <React.Fragment key={index}>
              <Circle
                cx={p.x}
                cy={p.y}
                r={4.5}
                fill={cores.fundo}
                stroke={corDaLinha}
                strokeWidth={2}
              />
              <SvgText
                x={p.x}
                y={p.y - 10}
                fill={cores.texto}
                fontSize={10}
                fontFamily={FamiliaFonte.bold}
                fontWeight={PesoFonte.bold}
                textAnchor="middle"
              >
                {`${p.valor}${unidade}`}
              </SvgText>
              <SvgText
                x={p.x}
                y={altura - 6}
                fill={cores.textoSecundario}
                fontSize={9}
                fontFamily={FamiliaFonte.regular}
                textAnchor="middle"
              >
                {p.label}
              </SvgText>
            </React.Fragment>
          ))}
        </Svg>
      </View>
    </View>
  );
}

const criarEstilos = (cores: CoresTema) =>
  StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  titulo: {
    fontFamily: FamiliaFonte.bold,
    fontSize: 14,
    color: cores.texto,
    fontWeight: PesoFonte.bold,
    marginBottom: 8,
  },
  svgWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerVazio: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.superficie,
    borderRadius: 12,
  },
  textoVazio: {
    fontFamily: FamiliaFonte.regular,
    fontSize: 12,
    color: cores.textoSecundario,
  },
});
