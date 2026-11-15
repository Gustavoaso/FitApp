// ============================================================
// TELA: Detalhe do treino (app/(tabs)/treino/[treinoId].tsx)
// ============================================================
// Aberta pelo card da grade: exercícios, séries e as cargas da
// última vez. Daqui a pessoa inicia o treino ao vivo DESTE
// treino, não só o do dia (etapa 20).
// ============================================================

import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { BotaoPrimario, CardVidro, EstadoVazio, Skeleton } from '@/compartilhado/ui';
import { CoresTema, Espacamento, FamiliaFonte, Tipografia } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import {
  descreverSerie,
  obterPlanoTreinoCustomizado,
  type DiaTreinoCustomizado,
  type ExercicioCustomizado,
} from '@/compartilhado/servicos/plano-gestao-servico';
import { obterSeriesUltimaExecucao } from '@/compartilhado/servicos/progresso-servico';
import { repositorioDieta } from '@/compartilhado/servicos/repositorio';
import {
  descreverPrescricao,
  orientacaoDoTreino,
  type OrientacaoTreino,
} from './orientacao-treino';

type SeriesFeitas = Record<number, { cargaKg: number; repeticoes: number }>;

export default function TelaDetalheTreino() {
  const { cores } = useTema();
  const estilos = useMemo(() => criarEstilos(cores), [cores]);
  const router = useRouter();
  const { treinoId } = useLocalSearchParams<{ treinoId?: string }>();

  // undefined = carregando; null = o treino não existe mais (plano refeito ou treino apagado).
  const [treino, setTreino] = useState<DiaTreinoCustomizado | null | undefined>(undefined);
  const [ultimaVez, setUltimaVez] = useState<Record<string, SeriesFeitas>>({});
  const [orientacao, setOrientacao] = useState<OrientacaoTreino | null>(null);

  // No foco: ao voltar do treino ao vivo, as cargas da última vez já aparecem.
  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      (async () => {
        const planos = await obterPlanoTreinoCustomizado();
        const encontrado = planos.find((p) => p.id === treinoId) ?? null;
        const series: Record<string, SeriesFeitas> = {};
        for (const ex of encontrado?.exercicios ?? []) {
          const feitas = await obterSeriesUltimaExecucao(ex.id);
          if (feitas) series[ex.id] = feitas;
        }
        // Aquecimento, reserva e progressão vêm do plano gerado (RN19); plano antigo não tem.
        const ultimoPlano = await repositorioDieta.buscarUltimoPlanoIA().catch(() => null);
        if (!ativo) return;
        setOrientacao(orientacaoDoTreino(ultimoPlano?.plano_gerado, encontrado?.foco, new Date()));
        setUltimaVez(series);
        setTreino(encontrado);
      })();
      return () => {
        ativo = false;
      };
    }, [treinoId]),
  );

  if (treino === undefined) {
    return (
      <View style={estilos.carregando} accessibilityLabel="Carregando o treino">
        <Skeleton altura={28} largura="60%" />
        <Skeleton altura={96} raio={24} />
        <Skeleton altura={96} raio={24} />
        <Skeleton altura={96} raio={24} />
      </View>
    );
  }

  if (!treino) {
    return (
      <View style={estilos.centro}>
        <EstadoVazio
          simbolo="dumbbell"
          titulo="Treino não encontrado"
          mensagem="Ele pode ter sido apagado ou trocado por um plano novo."
          textoAcao="Voltar para os treinos"
          aoAgir={() => router.back()}
        />
      </View>
    );
  }

  const total = treino.exercicios.length;
  const semExercicios = total === 0;

  const renderizarExercicio = ({ item, index }: { item: ExercicioCustomizado; index: number }) => {
    const feitas = ultimaVez[item.id];
    return (
      <CardVidro semBorda estilo={estilos.card}>
        <View style={estilos.topoExercicio}>
          <Text style={estilos.ordem}>{String(index + 1).padStart(2, '0')}</Text>
          <View style={estilos.colunaNome}>
            <Text style={estilos.nome}>{item.nome}</Text>
            <Text style={estilos.prescricao}>
              {descreverPrescricao(
                item.series,
                item.repeticoes,
                item.tempoDescansoSegundos,
                orientacao?.reservaPorExercicio[item.nome],
              )}
            </Text>
          </View>
        </View>
        <Text style={estilos.rotuloUltima}>
          {feitas ? 'Última vez' : 'Ainda sem registro: a carga você informa no treino'}
        </Text>
        {feitas
          ? Array.from({ length: item.series }, (_, i) => i + 1).map((n) => (
              <View key={n} style={estilos.linhaSerie}>
                <Text style={estilos.serie}>Série {n}</Text>
                <Text style={estilos.valorSerie}>
                  {feitas[n] ? descreverSerie(feitas[n].cargaKg, feitas[n].repeticoes) : '—'}
                </Text>
              </View>
            ))
          : null}
      </CardVidro>
    );
  };

  return (
    <View style={estilos.container}>
      <Stack.Screen options={{ title: treino.foco || 'Treino' }} />
      <FlatList
        data={treino.exercicios}
        keyExtractor={(ex) => ex.id}
        renderItem={renderizarExercicio}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={estilos.lista}
        ListHeaderComponent={
          <View style={estilos.cabecalho}>
            <Text style={estilos.resumo} accessibilityRole="header">
              {total} {total === 1 ? 'exercício' : 'exercícios'}
            </Text>
            {orientacao?.semana ? (
              <CardVidro semBorda estilo={estilos.card}>
                <Text style={estilos.rotuloSecao}>
                  Semana {orientacao.semana.atual.semana} de 4 · {orientacao.semana.atual.titulo}
                </Text>
                <Text style={estilos.textoSecao}>{orientacao.semana.atual.orientacao}</Text>
                <Text style={estilos.prescricao}>
                  Na próxima semana: {orientacao.semana.proxima.titulo.toLowerCase()}.
                </Text>
              </CardVidro>
            ) : null}
            {orientacao && orientacao.aquecimento.length > 0 ? (
              <CardVidro semBorda estilo={estilos.card}>
                <Text style={estilos.rotuloSecao} accessibilityRole="header">
                  Aquecimento
                </Text>
                {orientacao.aquecimento.map((passo, i) => (
                  <Text key={passo} style={estilos.textoSecao}>
                    {i + 1}. {passo}
                  </Text>
                ))}
              </CardVidro>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EstadoVazio
            simbolo="dumbbell"
            titulo="Este treino está sem exercícios"
            mensagem="Adicione exercícios na aba Treino para poder iniciar."
          />
        }
        // Dentro da lista: rola com o conteúdo e nunca fica atrás da tab bar de vidro.
        ListFooterComponent={
          semExercicios ? undefined : (
            <BotaoPrimario
              texto="Iniciar este treino"
              estilo={estilos.botao}
              aoPresionar={() =>
                router.push({ pathname: '/treino-ao-vivo', params: { treinoId: treino.id } })
              }
            />
          )
        }
      />
    </View>
  );
}

const criarEstilos = (cores: CoresTema) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: cores.fundo },
    centro: { flex: 1, backgroundColor: cores.fundo, justifyContent: 'center' },
    carregando: {
      flex: 1,
      backgroundColor: cores.fundo,
      padding: Espacamento.lg,
      paddingTop: 120,
      gap: Espacamento.md,
    },
    lista: { padding: Espacamento.lg, paddingBottom: Espacamento.xxl, gap: Espacamento.md },
    resumo: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Tipografia.subtitulo,
      color: cores.textoSecundario,
    },
    card: { gap: Espacamento.sm },
    cabecalho: { gap: Espacamento.md },
    rotuloSecao: {
      fontFamily: FamiliaFonte.semibold,
      fontSize: Tipografia.destaque,
      color: cores.texto,
    },
    textoSecao: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Tipografia.subtitulo,
      color: cores.texto,
      lineHeight: 21,
    },
    topoExercicio: { flexDirection: 'row', gap: Espacamento.md, alignItems: 'flex-start' },
    ordem: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Tipografia.destaque,
      color: cores.destaqueTexto,
      fontVariant: ['tabular-nums'],
    },
    colunaNome: { flex: 1, gap: Espacamento.xs },
    nome: { fontFamily: FamiliaFonte.semibold, fontSize: Tipografia.destaque, color: cores.texto },
    prescricao: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Tipografia.rodape,
      color: cores.textoSecundario,
    },
    rotuloUltima: {
      fontFamily: FamiliaFonte.medio,
      fontSize: Tipografia.rodape,
      color: cores.textoSecundario,
      marginTop: Espacamento.xs,
    },
    linhaSerie: { flexDirection: 'row', justifyContent: 'space-between' },
    serie: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Tipografia.subtitulo,
      color: cores.textoSecundario,
    },
    valorSerie: {
      fontFamily: FamiliaFonte.medio,
      fontSize: Tipografia.subtitulo,
      color: cores.texto,
      fontVariant: ['tabular-nums'],
    },
    botao: { marginTop: Espacamento.sm },
  });
