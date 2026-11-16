// Histórico de treinos (RN27): resumo semana/mês e lista por mês. Toque abre o detalhe.
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, SectionList, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { CardVidro, EstadoVazio } from '@/compartilhado/ui';
import { CoresTema, Espacamento, FamiliaFonte, Tipografia } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import {
  obterHistoricoTreinoCompleto,
  type RegistroTreinoDiario,
} from '@/compartilhado/servicos/historico-servico';
import { formatarKcalEstimada } from '@/compartilhado/utilidades/gasto-calorico';
import {
  agruparPorMes,
  resumoSemanaMes,
  sessoesConcluidas,
  volumeSessao,
  type Resumo,
} from './historico-treino';

const rotuloMes = (mes: string) =>
  new Date(`${mes}-15T12:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
const rotuloData = (data: string) =>
  new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

function LinhaResumo({ titulo, r, estilos }: { titulo: string; r: Resumo; estilos: Estilos }) {
  return (
    <CardVidro semBorda estilo={estilos.cartao}>
      <Text style={estilos.titulo}>{titulo}</Text>
      <Text style={estilos.sub}>
        {`${r.treinos} treinos · ${r.minutos} min · ${r.volume} kg de volume`}
      </Text>
      <Text style={estilos.sub}>{formatarKcalEstimada(Math.round(r.kcal))}</Text>
    </CardVidro>
  );
}

export default function TelaHistorico() {
  const { cores } = useTema();
  const estilos = useMemo(() => criarEstilos(cores), [cores]);
  const router = useRouter();
  const [sessoes, setSessoes] = useState<RegistroTreinoDiario[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      obterHistoricoTreinoCompleto().then((m) => setSessoes(sessoesConcluidas(m)));
    }, []),
  );

  if (sessoes && sessoes.length === 0) {
    return (
      <EstadoVazio
        simbolo="clock.arrow.circlepath"
        titulo="Nenhum treino concluído"
        mensagem="Termine um treino e ele aparece aqui."
      />
    );
  }
  const { semana, mes } = resumoSemanaMes(sessoes ?? [], new Date().toISOString().slice(0, 10));
  const secoes = agruparPorMes(sessoes ?? []).map((g) => ({
    title: rotuloMes(g.mes),
    data: g.sessoes,
  }));

  return (
    <SectionList
      style={estilos.tela}
      contentContainerStyle={estilos.conteudo}
      contentInsetAdjustmentBehavior="automatic"
      sections={secoes}
      keyExtractor={(r) => r.idSessao}
      ListHeaderComponent={
        <View>
          <LinhaResumo titulo="Esta semana" r={semana} estilos={estilos} />
          <LinhaResumo titulo="Este mês" r={mes} estilos={estilos} />
        </View>
      }
      renderSectionHeader={({ section }) => <Text style={estilos.secao}>{section.title}</Text>}
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push({ pathname: '/(tabs)/treino/sessao', params: { data: item.data } })
          }
        >
          <CardVidro semBorda estilo={estilos.cartao}>
            <Text style={estilos.titulo}>{`${item.foco} · ${rotuloData(item.data)}`}</Text>
            <Text style={estilos.sub}>
              {`${item.duracaoMinutos} min · ${item.series?.length ?? 0} séries · ${volumeSessao(item)} kg`}
              {item.kcalEstimadas != null ? ` · ${formatarKcalEstimada(item.kcalEstimadas)}` : ''}
            </Text>
          </CardVidro>
        </Pressable>
      )}
    />
  );
}

type Estilos = ReturnType<typeof criarEstilos>;
const criarEstilos = (cores: CoresTema) =>
  StyleSheet.create({
    tela: { flex: 1, backgroundColor: cores.fundo },
    conteudo: { padding: Espacamento.lg, paddingBottom: 40 },
    cartao: { marginBottom: Espacamento.sm },
    secao: {
      fontSize: Tipografia.titulo3,
      color: cores.textoSecundario,
      marginVertical: Espacamento.sm,
      textTransform: 'capitalize',
    },
    titulo: { fontSize: Tipografia.titulo3, color: cores.texto, fontFamily: FamiliaFonte.bold },
    sub: { fontSize: Tipografia.corpo, color: cores.textoSecundario },
  });
