// ============================================================
// TELA: Treino ao Vivo (app/treino-ao-vivo/index.tsx)
// ============================================================
// Modo de execução do treino em tempo real.
// Rodada 3 — Ajuste 1: Atualização automática de carga/reps por série no progressoServico.
// Botão 'Sair' pílula amarela no canto superior esquerdo.
// ============================================================

import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { CardVidro, BotaoPrimario, AnelProgresso, MomentoConquista } from '@/compartilhado/ui';
import { CoresTema, Espacamento, FamiliaFonte, Fonte, PesoFonte, Raio } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import { formatarTempo } from '@/compartilhado/utilidades';
import { registrarExecucaoSerie } from '@/compartilhado/servicos/progresso-servico';
import {
  obterPlanoTreinoCustomizado,
  obterMapeamentoSemanal,
} from '@/compartilhado/servicos/plano-gestao-servico';

interface ExercicioAoVivo {
  id: string;
  nome: string;
  series: number;
  reps: number;
  cargaSugerida: number;
  descansoSegundos: number;
}

const EXERCICIOS_PADRAO: ExercicioAoVivo[] = [
  {
    id: 'ex-1',
    nome: 'Supino Reto com Barra',
    series: 4,
    reps: 10,
    cargaSugerida: 60,
    descansoSegundos: 90,
  },
  {
    id: 'ex-2',
    nome: 'Supino Inclinado com Halteres',
    series: 3,
    reps: 12,
    cargaSugerida: 24,
    descansoSegundos: 60,
  },
  {
    id: 'ex-4',
    nome: 'Tríceps Pulley com Corda',
    series: 4,
    reps: 12,
    cargaSugerida: 35,
    descansoSegundos: 60,
  },
];

export default function TelaTreinoAoVivo() {
  const { cores } = useTema();
  const estilos = useMemo(() => criarEstilos(cores), [cores]);
  const router = useRouter();

  const sairDoTreino = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/treino');
  };

  const [listaExercicios, setListaExercicios] = useState<ExercicioAoVivo[]>(EXERCICIOS_PADRAO);
  const [tituloTreino, setTituloTreino] = useState('Treino ao Vivo');
  const [indexExercicio, setIndexExercicio] = useState(0);
  const [serieAtual, setSerieAtual] = useState(1);
  const [cargaUsada, setCargaUsada] = useState('');
  const [tempoRestante, setTempoRestante] = useState(90);
  const [emDescanso, setEmDescanso] = useState(false);
  const [concluido, setConcluido] = useState(false);

  useEffect(() => {
    async function carregarTreinoReal() {
      try {
        const planos = await obterPlanoTreinoCustomizado();
        const mapSemana = await obterMapeamentoSemanal();
        const abrevs = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
        const abrevHoje = abrevs[new Date().getDay()];
        const idHoje = mapSemana[abrevHoje];

        const planoHoje = (idHoje && planos.find((p) => p.id === idHoje)) || planos[0];
        if (planoHoje && planoHoje.exercicios && planoHoje.exercicios.length > 0) {
          setTituloTreino(planoHoje.foco || planoHoje.diaSemana);
          const adaptados: ExercicioAoVivo[] = planoHoje.exercicios.map((ex) => ({
            id: ex.id,
            nome: ex.nome,
            series: ex.series || 4,
            reps: ex.repeticoes || 10,
            cargaSugerida: ex.cargaKg || 20,
            descansoSegundos: ex.tempoDescansoSegundos || 60,
          }));
          setListaExercicios(adaptados);
          setTempoRestante(adaptados[0].descansoSegundos);
        }
      } catch (err) {
        console.warn('Erro ao carregar treino real para execução ao vivo:', err);
      }
    }
    carregarTreinoReal();
  }, []);

  const exAtual = listaExercicios[indexExercicio] || EXERCICIOS_PADRAO[0];

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (emDescanso && tempoRestante > 0) {
      interval = setInterval(() => {
        setTempoRestante((t) => t - 1);
      }, 1000);
    } else if (tempoRestante === 0 && emDescanso) {
      setEmDescanso(false);
      // Confirmação discreta: o haptic e o rótulo do timer, que vira "Pronto".
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [emDescanso, tempoRestante]);

  // Rodada 3 — Ajuste 1: Conclui a série e registra automaticamente no progressoServico
  const concluirSerie = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const cargaFinal = parseFloat(cargaUsada) || exAtual.cargaSugerida;

    // Registra no histórico por série do exercício
    await registrarExecucaoSerie(exAtual.id, exAtual.nome, serieAtual, cargaFinal, exAtual.reps);

    if (serieAtual < exAtual.series) {
      setSerieAtual(serieAtual + 1);
      setTempoRestante(exAtual.descansoSegundos);
      setEmDescanso(true);
    } else {
      if (indexExercicio < listaExercicios.length - 1) {
        setIndexExercicio(indexExercicio + 1);
        setSerieAtual(1);
        setTempoRestante(listaExercicios[indexExercicio + 1].descansoSegundos);
        setEmDescanso(true);
      } else {
        const { incrementarTreinoRealizado } =
          await import('@/compartilhado/servicos/progresso-servico');
        await incrementarTreinoRealizado();
        // O MomentoConquista dá o haptic Success e sai do treino ao terminar.
        setConcluido(true);
      }
    }
  };

  const pularExercicio = () => {
    if (indexExercicio < listaExercicios.length - 1) {
      setIndexExercicio(indexExercicio + 1);
      setSerieAtual(1);
      setEmDescanso(false);
    } else {
      sairDoTreino();
    }
  };

  return (
    <View style={estilos.container}>
      {/* Topo / Progresso da Sessão */}
      <View style={estilos.topo}>
        <TouchableOpacity style={estilos.btnSairAmarelo} onPress={sairDoTreino} activeOpacity={0.8}>
          <SymbolView name="xmark" size={14} tintColor={cores.texto} weight="bold" />
          <Text style={estilos.txtSairAmarelo}>Sair</Text>
        </TouchableOpacity>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={estilos.tituloTreino}>{tituloTreino}</Text>
          <Text style={estilos.progressoTexto}>
            Exercício {indexExercicio + 1}/{listaExercicios.length}
          </Text>
        </View>
      </View>

      {/* Nome do Exercício */}
      <View style={estilos.exercicioHeader}>
        <Text style={estilos.exercicioNome}>{exAtual.nome}</Text>
      </View>

      {/* Card da Série Atual */}
      <CardVidro semBorda estilo={estilos.cardSerie}>
        <Text style={estilos.serieDetalhes}>
          Série <Text style={estilos.destaque}>{serieAtual}</Text> de {exAtual.series} ·{' '}
          {exAtual.reps} reps · {exAtual.cargaSugerida}kg
        </Text>
      </CardVidro>

      {/* Timer de Descanso Circular */}
      <View style={estilos.timerContainer}>
        <AnelProgresso
          atual={tempoRestante}
          meta={exAtual.descansoSegundos}
          tamanho={180}
          espessura={14}
          mostrarValor={false}
        />
        <View style={estilos.timerTextoAbsolute}>
          <Text style={estilos.timerTempo}>{formatarTempo(tempoRestante)}</Text>
          <Text style={estilos.timerLabel}>{emDescanso ? 'Descansando' : 'Pronto'}</Text>
        </View>
      </View>

      {/* Campo de Carga Real */}
      <View style={estilos.inputCargaContainer}>
        <Text style={estilos.cargaLabel}>Carga usada (kg):</Text>
        <TextInput
          style={estilos.inputCarga}
          keyboardType="numeric"
          placeholder={String(exAtual.cargaSugerida)}
          placeholderTextColor={cores.textoSecundario}
          value={cargaUsada}
          onChangeText={setCargaUsada}
        />
      </View>

      {/* Ações Inferiores */}
      <View style={estilos.acoesContainer}>
        <TouchableOpacity style={estilos.botaoPular} onPress={pularExercicio}>
          <Text style={estilos.textoPular}>Pular Exercício</Text>
        </TouchableOpacity>

        <BotaoPrimario
          texto={serieAtual === exAtual.series ? 'Finalizar Exercício' : 'Concluir Série'}
          aoPresionar={concluirSerie}
          estilo={estilos.botaoConcluir}
        />
      </View>

      {concluido ? (
        <MomentoConquista
          titulo="Treino concluído"
          subtitulo={tituloTreino}
          aoTerminar={sairDoTreino}
        />
      ) : null}
    </View>
  );
}

const criarEstilos = (cores: CoresTema) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: cores.fundo,
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    topo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    btnSairAmarelo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#EAB308',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: Raio.full,
      shadowColor: '#EAB308',
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    },
    txtSairAmarelo: {
      fontFamily: FamiliaFonte.bold,
      fontSize: 13,
      fontWeight: PesoFonte.bold,
      color: '#FFFFFF',
    },
    tituloTreino: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.subtitulo,
      fontWeight: PesoFonte.bold,
      color: cores.texto,
    },
    progressoTexto: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Fonte.micro,
      color: cores.textoSecundario,
      marginTop: 2,
    },

    exercicioHeader: {
      alignItems: 'center',
      marginBottom: 16,
    },
    exercicioNome: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.titulo,
      fontWeight: PesoFonte.bold,
      color: cores.texto,
      textAlign: 'center',
    },

    cardSerie: {
      alignItems: 'center',
      paddingVertical: 14,
      marginBottom: 24,
    },
    serieDetalhes: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Fonte.corpo,
      color: cores.textoSecundario,
    },
    destaque: {
      fontFamily: FamiliaFonte.bold,
      color: cores.destaque,
      fontWeight: PesoFonte.bold,
    },

    timerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 12,
    },
    timerTextoAbsolute: {
      position: 'absolute',
      alignItems: 'center',
    },
    timerTempo: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.display,
      fontWeight: PesoFonte.bold,
      color: cores.texto,
    },
    timerLabel: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Fonte.label,
      color: cores.textoSecundario,
      marginTop: 4,
    },

    inputCargaContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      marginTop: 20,
      marginBottom: 24,
    },
    cargaLabel: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Fonte.corpo,
      color: cores.textoSecundario,
    },
    inputCarga: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.corpo,
      color: cores.texto,
      backgroundColor: cores.elevada,
      borderWidth: 1,
      borderColor: cores.separador,
      borderRadius: Raio.sm,
      paddingHorizontal: 16,
      paddingVertical: 8,
      width: 80,
      textAlign: 'center',
    },

    acoesContainer: {
      gap: 12,
      marginTop: 'auto',
      marginBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    botaoPular: {
      alignItems: 'center',
      paddingVertical: 12,
    },
    textoPular: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Fonte.label,
      color: cores.textoSecundario,
    },
    botaoConcluir: {},
  });
