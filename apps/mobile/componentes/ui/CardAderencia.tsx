// ============================================================
// COMPONENTE: CardAderencia
// ============================================================
// Painel de aderência semanal (% treinos e % refeições) — Clean Dark UI.
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { CardVidro } from './CardVidro';
import { Cores, FamiliaFonte, PesoFonte } from '../../constantes/Cores';
import { EstatisticasAderencia } from '../../servicos/progressoServico';

interface PropsCardAderencia {
  estatisticas: EstatisticasAderencia;
}

export function CardAderencia({ estatisticas }: PropsCardAderencia) {
  return (
    <CardVidro semBorda estilo={estilos.card}>
      <View style={estilos.header}>
        <View style={estilos.rowTitulo}>
          <SymbolView name="chart.bar.fill" size={16} tintColor={Cores.accent} weight="bold" />
          <Text style={estilos.titulo}>Aderência Semanal</Text>
        </View>
        <Text style={estilos.porcentagemBadge}>{estatisticas.porcentagemAderenciaGeral}%</Text>
      </View>

      <View style={estilos.grid}>
        {/* Treinos */}
        <View style={estilos.itemMetric}>
          <View style={estilos.rowMetricHeader}>
            <SymbolView name="dumbbell.fill" size={14} tintColor={Cores.texto.secundario} />
            <Text style={estilos.labelMetric}>Treinos</Text>
          </View>
          <Text style={estilos.valorMetric}>
            {estatisticas.diasTreinados} / {estatisticas.metaDiasTreino} <Text style={estilos.subMetric}>dias</Text>
          </Text>
          <View style={estilos.barraFundo}>
            <View
              style={[
                estilos.barraProgresso,
                { width: `${(estatisticas.diasTreinados / estatisticas.metaDiasTreino) * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* Dieta */}
        <View style={estilos.itemMetric}>
          <View style={estilos.rowMetricHeader}>
            <SymbolView name="apple.logo" size={14} tintColor={Cores.texto.secundario} />
            <Text style={estilos.labelMetric}>Dieta</Text>
          </View>
          <Text style={estilos.valorMetric}>
            {estatisticas.refeicoesConcluidas} / {estatisticas.totalRefeicoesPrevistas} <Text style={estilos.subMetric}>refeições</Text>
          </Text>
          <View style={estilos.barraFundo}>
            <View
              style={[
                estilos.barraProgresso,
                {
                  width: `${(estatisticas.refeicoesConcluidas / (estatisticas.totalRefeicoesPrevistas || 1)) * 100}%`,
                },
              ]}
            />
          </View>
        </View>
      </View>
    </CardVidro>
  );
}

const estilos = StyleSheet.create({
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
    color: Cores.texto.principal,
  },
  porcentagemBadge: {
    fontFamily: FamiliaFonte.bold,
    fontSize: 16,
    fontWeight: PesoFonte.bold,
    color: Cores.accent,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  itemMetric: {
    flex: 1,
    backgroundColor: Cores.fundo.elevada,
    borderRadius: 12,
    padding: 12,
  },
  rowMetricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  labelMetric: {
    fontFamily: FamiliaFonte.regular,
    fontSize: 12,
    color: Cores.texto.secundario,
  },
  valorMetric: {
    fontFamily: FamiliaFonte.bold,
    fontSize: 15,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
    marginBottom: 8,
  },
  subMetric: {
    fontSize: 11,
    fontFamily: FamiliaFonte.regular,
    color: Cores.texto.secundario,
    fontWeight: PesoFonte.regular,
  },
  barraFundo: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barraProgresso: {
    height: '100%',
    backgroundColor: Cores.accent,
    borderRadius: 2,
  },
});
