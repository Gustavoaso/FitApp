// ============================================================
// COMPONENTE: CardAderencia
// ============================================================
// Painel de aderência semanal (Treinos, Exercícios e Refeições reais vs metas)
// ============================================================

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { CardVidro } from '@/compartilhado/ui/CardVidro';
import { CoresTema, FamiliaFonte, PesoFonte } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import { EstatisticasAderencia } from '@/compartilhado/servicos/progresso-servico';

interface PropsCardAderencia {
  estatisticas: EstatisticasAderencia;
  onPressEditarMeta?: () => void;
}

export function CardAderencia({ estatisticas }: PropsCardAderencia) {
  const { cores } = useTema();
  const estilos = useMemo(() => criarEstilos(cores), [cores]);
  const pctTreinoVisual = Math.min(
    100,
    Math.round((estatisticas.diasTreinados / (estatisticas.metaDiasTreino || 1)) * 100)
  );

  const pctExVisual = Math.min(
    100,
    Math.round((estatisticas.exerciciosRealizados / (estatisticas.metaExercicios || 1)) * 100)
  );

  const pctDietaVisual = Math.min(
    100,
    Math.round((estatisticas.refeicoesConcluidas / (estatisticas.totalRefeicoesPrevistas || 1)) * 100)
  );

  return (
    <CardVidro semBorda estilo={estilos.card}>
      <View style={estilos.header}>
        <View style={estilos.rowTitulo}>
          <SymbolView name="chart.bar.fill" size={16} tintColor={cores.destaque} weight="bold" />
          <Text style={estilos.titulo}>Aderência Semanal</Text>
        </View>
        <Text style={estilos.porcentagemBadge}>{estatisticas.porcentagemAderenciaGeral}%</Text>
      </View>

      <View style={estilos.grid}>
        {/* Treinos */}
        <View style={estilos.itemMetric}>
          <View style={estilos.rowMetricHeader}>
            <SymbolView name="figure.run" size={14} tintColor={cores.textoSecundario} />
            <Text style={estilos.labelMetric}>Treinos</Text>
          </View>
          <Text style={estilos.valorMetric}>
            {estatisticas.diasTreinados} / {estatisticas.metaDiasTreino} <Text style={estilos.subMetric}>dias</Text>
          </Text>
          <View style={estilos.barraFundo}>
            <View style={[estilos.barraProgresso, { width: `${pctTreinoVisual}%` }]} />
          </View>
        </View>

        {/* Exercícios */}
        <View style={estilos.itemMetric}>
          <View style={estilos.rowMetricHeader}>
            <SymbolView name="dumbbell.fill" size={14} tintColor={cores.textoSecundario} />
            <Text style={estilos.labelMetric}>Exercícios</Text>
          </View>
          <Text style={estilos.valorMetric}>
            {estatisticas.exerciciosRealizados} / {estatisticas.metaExercicios} <Text style={estilos.subMetric}>ex</Text>
          </Text>
          <View style={estilos.barraFundo}>
            <View style={[estilos.barraProgresso, { width: `${pctExVisual}%` }]} />
          </View>
        </View>

        {/* Dieta */}
        <View style={estilos.itemMetric}>
          <View style={estilos.rowMetricHeader}>
            <SymbolView name="apple.logo" size={14} tintColor={cores.textoSecundario} />
            <Text style={estilos.labelMetric}>Dieta</Text>
          </View>
          <Text style={estilos.valorMetric}>
            {estatisticas.refeicoesConcluidas} / {estatisticas.totalRefeicoesPrevistas} <Text style={estilos.subMetric}>ref</Text>
          </Text>
          <View style={estilos.barraFundo}>
            <View style={[estilos.barraProgresso, { width: `${pctDietaVisual}%` }]} />
          </View>
        </View>
      </View>
    </CardVidro>
  );
}

const criarEstilos = (cores: CoresTema) =>
  StyleSheet.create({
  card: {
    marginVertical: 8,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  rowTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titulo: {
    fontFamily: FamiliaFonte.bold,
    fontSize: 15,
    fontWeight: PesoFonte.bold,
    color: cores.texto,
  },
  porcentagemBadge: {
    fontFamily: FamiliaFonte.bold,
    fontSize: 16,
    fontWeight: PesoFonte.bold,
    color: cores.destaque,
  },
  grid: {
    flexDirection: 'row',
    gap: 8,
  },
  itemMetric: {
    flex: 1,
    backgroundColor: cores.elevada,
    borderRadius: 12,
    padding: 10,
  },
  rowMetricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  labelMetric: {
    fontFamily: FamiliaFonte.regular,
    fontSize: 11,
    color: cores.textoSecundario,
  },
  valorMetric: {
    fontFamily: FamiliaFonte.bold,
    fontSize: 13,
    fontWeight: PesoFonte.bold,
    color: cores.texto,
    marginBottom: 6,
  },
  subMetric: {
    fontSize: 10,
    fontFamily: FamiliaFonte.regular,
    color: cores.textoSecundario,
    fontWeight: PesoFonte.regular,
  },
  barraFundo: {
    height: 4,
    backgroundColor: cores.destaqueSuave,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barraProgresso: {
    height: '100%',
    backgroundColor: cores.destaque,
    borderRadius: 2,
  },
});
