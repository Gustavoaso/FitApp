// Detalhe da sessão (RN27): séries por exercício e evolução da maior carga (gráfico de linha).
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { useLocalSearchParams } from 'expo-router';
import { CardVidro, EstadoVazio } from '@/compartilhado/ui';
import { CoresTema, Espacamento, FamiliaFonte, Tipografia } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import {
  obterHistoricoTreinoCompleto,
  type RegistroTreinoDiario,
} from '@/compartilhado/servicos/historico-servico';
import { evolucaoCarga, exerciciosDaSessao, sessoesConcluidas } from './historico-treino';

const L = 280;
const A = 60;

function Linha({ pontos, cor }: { pontos: number[]; cor: string }) {
  const max = Math.max(...pontos);
  const min = Math.min(...pontos);
  const y = (v: number) => (max === min ? A / 2 : A - 4 - ((v - min) / (max - min)) * (A - 8));
  const lista = pontos.map((v, i) => `${(i / (pontos.length - 1)) * L},${y(v)}`).join(' ');
  return (
    <Svg width={L} height={A}>
      <Polyline points={lista} stroke={cor} strokeWidth={2} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export default function TelaSessao() {
  const { cores } = useTema();
  const estilos = useMemo(() => criarEstilos(cores), [cores]);
  const { data } = useLocalSearchParams<{ data?: string }>();
  const [todas, setTodas] = useState<RegistroTreinoDiario[] | null>(null);

  useEffect(() => {
    obterHistoricoTreinoCompleto().then((m) => setTodas(sessoesConcluidas(m)));
  }, []);

  const sessao = todas?.find((r) => r.data === data);
  if (!todas) return null;
  const exercicios = sessao ? exerciciosDaSessao(sessao) : [];
  if (!sessao || exercicios.length === 0) {
    return <EstadoVazio simbolo="list.bullet" titulo="Sem detalhes desta sessão" />;
  }

  return (
    <ScrollView style={estilos.tela} contentContainerStyle={estilos.conteudo}>
      <Text style={estilos.titulo}>{sessao.foco}</Text>
      {exercicios.map((ex) => {
        const evolucao = evolucaoCarga(todas, ex.nome);
        return (
          <CardVidro key={ex.nome} semBorda estilo={estilos.cartao}>
            <Text style={estilos.titulo}>{ex.nome}</Text>
            {ex.series.map((s, i) => (
              <Text key={i} style={estilos.sub}>
                {`Série ${i + 1}: ${s.cargaKg} kg × ${s.repeticoes}`}
              </Text>
            ))}
            {evolucao.length > 1 ? (
              <View
                style={estilos.grafico}
                accessible
                accessibilityLabel={`Evolução da carga: ${evolucao.map((p) => `${p.cargaKg} kg`).join(', ')}`}
              >
                <Linha pontos={evolucao.map((p) => p.cargaKg)} cor={cores.destaque} />
                <Text
                  style={estilos.sub}
                >{`Maior carga: ${evolucao[0].cargaKg} → ${evolucao[evolucao.length - 1].cargaKg} kg`}</Text>
              </View>
            ) : null}
          </CardVidro>
        );
      })}
    </ScrollView>
  );
}

const criarEstilos = (cores: CoresTema) =>
  StyleSheet.create({
    tela: { flex: 1, backgroundColor: cores.fundo },
    conteudo: { padding: Espacamento.lg, paddingBottom: 40 },
    cartao: { marginTop: Espacamento.sm },
    grafico: { marginTop: Espacamento.sm },
    titulo: { fontSize: Tipografia.titulo3, color: cores.texto, fontFamily: FamiliaFonte.bold },
    sub: { fontSize: Tipografia.corpo, color: cores.textoSecundario },
  });
