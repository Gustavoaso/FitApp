// ============================================================
// TELA: Resultado do Questionário (app/questionario/resultado.tsx)
// ============================================================
// Exibe o plano gerado pela IA com métricas (TMB, Calorias, Macros, Água)
// e os cards de preview de treino e dieta.
// ============================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CardVidro, BotaoPrimario } from '../../componentes/ui';
import { Cores, Espacamento, Fonte, PesoFonte, Raio } from '../../constantes/Cores';
import { formatarCalorias, formatarGramas, formatarAgua } from '@fitapp/utilidades';

export default function TelaResultadoQuestionario() {
  const router = useRouter();
  const { plano } = useLocalSearchParams<{ plano: string }>();

  // Parse do plano retornado da Edge Function
  const dados = plano ? JSON.parse(plano) : null;
  const resumo = dados?.resumo || {
    tmb: 1847,
    tdee: 2400,
    caloriasAlvo: 2400,
    macros: { proteinas: 160, carboidratos: 280, gorduras: 72 },
    metaAguaMl: 3200,
  };

  const irParaDashboard = () => {
    router.replace('/(tabs)/inicio');
  };

  return (
    <View style={estilos.container}>
      <ScrollView contentContainerStyle={estilos.scrollContent}>
        <View style={estilos.cabecalho}>
          <Text style={estilos.iconeSucesso}>🎉</Text>
          <Text style={estilos.titulo}>Seu Plano Personalizado</Text>
          <Text style={estilos.subtitulo}>Calculado com base no seu metabolismo e objetivo</Text>
        </View>

        {/* Card Hero com Métricas Principais */}
        <CardVidro estilo={estilos.cardHero}>
          <View style={estilos.gridMetricas}>
            <View style={estilos.itemMetrica}>
              <Text style={estilos.emojiMetrica}>🔥</Text>
              <Text style={estilos.labelMetrica}>TMB</Text>
              <Text style={estilos.valorMetrica}>{formatarCalorias(resumo.tmb)}</Text>
            </View>

            <View style={estilos.itemMetrica}>
              <Text style={estilos.emojiMetrica}>🎯</Text>
              <Text style={estilos.labelMetrica}>Meta Diária</Text>
              <Text style={estilos.valorMetricaDestaque}>{formatarCalorias(resumo.caloriasAlvo)}</Text>
            </View>

            <View style={estilos.itemMetrica}>
              <Text style={estilos.emojiMetrica}>💧</Text>
              <Text style={estilos.labelMetrica}>Meta de Água</Text>
              <Text style={estilos.valorMetrica}>{formatarAgua(resumo.metaAguaMl)}</Text>
            </View>
          </View>
        </CardVidro>

        {/* Distribuição de Macros */}
        <Text style={estilos.secaoTitulo}>Macronutrientes Alvo</Text>
        <CardVidro estilo={estilos.cardMacros}>
          <View style={estilos.rowMacros}>
            <View style={estilos.macroItem}>
              <View style={[estilos.dotMacro, { backgroundColor: Cores.feedback.sucesso }]} />
              <Text style={estilos.macroLabel}>Proteína</Text>
              <Text style={estilos.macroValor}>{formatarGramas(resumo.macros.proteinas)}</Text>
            </View>

            <View style={estilos.macroItem}>
              <View style={[estilos.dotMacro, { backgroundColor: Cores.secundaria }]} />
              <Text style={estilos.macroLabel}>Carboidrato</Text>
              <Text style={estilos.macroValor}>{formatarGramas(resumo.macros.carboidratos)}</Text>
            </View>

            <View style={estilos.macroItem}>
              <View style={[estilos.dotMacro, { backgroundColor: Cores.borda.forte }]} />
              <Text style={estilos.macroLabel}>Gordura</Text>
              <Text style={estilos.macroValor}>{formatarGramas(resumo.macros.gorduras)}</Text>
            </View>
          </View>
        </CardVidro>

        {/* Preview dos Planos */}
        <Text style={estilos.secaoTitulo}>Planos Gerados</Text>
        <CardVidro estilo={estilos.cardPreview}>
          <Text style={estilos.previewIcone}>🏋️‍♂️</Text>
          <View style={{ flex: 1 }}>
            <Text style={estilos.previewTitulo}>Plano de Treino</Text>
            <Text style={estilos.previewSub}>{dados?.treino?.nomeDivisao || 'Divisão Semanal Personalizada'}</Text>
          </View>
        </CardVidro>

        <CardVidro estilo={estilos.cardPreview}>
          <Text style={estilos.previewIcone}>🥗</Text>
          <View style={{ flex: 1 }}>
            <Text style={estilos.previewTitulo}>Plano Alimentar</Text>
            <Text style={estilos.previewSub}>{resumo.caloriasAlvo} kcal · Refeições equilibradas</Text>
          </View>
        </CardVidro>

        <BotaoPrimario
          texto="Começar Agora"
          aoPresionar={irParaDashboard}
          estilo={estilos.botaoIniciar}
        />
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Cores.fundo.principal,
  },
  scrollContent: {
    padding: Espacamento.xxl,
  },
  cabecalho: {
    alignItems: 'center',
    marginBottom: Espacamento.xxl,
    marginTop: Espacamento.lg,
  },
  iconeSucesso: {
    fontSize: 48,
    marginBottom: Espacamento.sm,
  },
  titulo: {
    fontSize: Fonte.display,
    fontWeight: PesoFonte.extrabold,
    color: Cores.texto.principal,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: Fonte.corpo,
    color: Cores.texto.secundario,
    textAlign: 'center',
    marginTop: 4,
  },
  cardHero: {
    marginBottom: Espacamento.xl,
  },
  gridMetricas: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  itemMetrica: {
    alignItems: 'center',
  },
  emojiMetrica: {
    fontSize: 24,
    marginBottom: 4,
  },
  labelMetrica: {
    fontSize: Fonte.micro,
    color: Cores.texto.secundario,
    fontWeight: PesoFonte.medio,
  },
  valorMetrica: {
    fontSize: Fonte.corpo,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
    marginTop: 2,
  },
  valorMetricaDestaque: {
    fontSize: Fonte.subtitulo,
    fontWeight: PesoFonte.extrabold,
    color: Cores.secundaria,
    marginTop: 2,
  },
  secaoTitulo: {
    fontSize: Fonte.subtitulo,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
    marginBottom: Espacamento.md,
    marginTop: Espacamento.md,
  },
  cardMacros: {
    marginBottom: Espacamento.lg,
  },
  rowMacros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  dotMacro: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: Fonte.micro,
    color: Cores.texto.secundario,
  },
  macroValor: {
    fontSize: Fonte.corpo,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
    marginTop: 2,
  },
  cardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.md,
    marginBottom: Espacamento.md,
  },
  previewIcone: {
    fontSize: 32,
  },
  previewTitulo: {
    fontSize: Fonte.corpo,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
  },
  previewSub: {
    fontSize: Fonte.label,
    color: Cores.texto.secundario,
    marginTop: 2,
  },
  botaoIniciar: {
    marginTop: Espacamento.xl,
    marginBottom: Espacamento.xxl,
  },
});
