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

type SeriesFeitas = Record<number, { cargaKg: number; repeticoes: number }>;

export default function TelaDetalheTreino() {
  const { cores } = useTema();
  const estilos = useMemo(() => criarEstilos(cores), [cores]);
  const router = useRouter();
  const { treinoId } = useLocalSearchParams<{ treinoId?: string }>();

  // undefined = carregando; null = o treino não existe mais (plano refeito ou treino apagado).
  const [treino, setTreino] = useState<DiaTreinoCustomizado | null | undefined>(undefined);
  const [ultimaVez, setUltimaVez] = useState<Record<string, SeriesFeitas>>({});

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
        if (!ativo) return;
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
              {item.series} séries · {String(item.repeticoes || '—')} reps ·{' '}
              {item.tempoDescansoSegundos || 60}s descanso
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
          <Text style={estilos.resumo} accessibilityRole="header">
            {total} {total === 1 ? 'exercício' : 'exercícios'}
          </Text>
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
