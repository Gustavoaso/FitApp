// ============================================================
// TELA: Treino ao Vivo (app/treino-ao-vivo/index.tsx)
// ============================================================
// Modo de execução do treino em tempo real.
// Rodada 3 — Ajuste 1: Atualização automática de carga/reps por série no progressoServico.
// Botão 'Sair' pílula amarela no canto superior esquerdo.
// Etapa 20: o parâmetro de rota `treinoId` escolhe o treino (card da grade, detalhe,
// dia selecionado); sem ele, vale o treino de hoje. Ao concluir, grava o histórico
// do dia, que a tira da semana da aba Treino lê.
// ============================================================

import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  InputAccessoryView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import Animated from 'react-native-reanimated';
import { useQuique } from '@/compartilhado/movimento';
import { CardVidro, BotaoPrimario, AnelProgresso, EstadoVazio } from '@/compartilhado/ui';
import {
  CoresTema,
  Espacamento,
  FamiliaFonte,
  Fonte,
  PesoFonte,
  Raio,
  Tipografia,
} from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import { formatarTempo } from '@/compartilhado/utilidades';
import {
  ehComposto,
  estimarKcalTreino,
  type SerieExecutada,
} from '@/compartilhado/utilidades/gasto-calorico';
import {
  incrementarTreinoRealizado,
  obterHistoricoPeso,
  registrarExecucaoSerie,
} from '@/compartilhado/servicos/progresso-servico';
import { salvarHistoricoTreino } from '@/compartilhado/servicos/historico-servico';
import { gravarSessaoTreino } from '@/compartilhado/servicos/sessao-servico';
import { FimDoTreino } from './FimDoTreino';
import {
  obterPlanoTreinoCustomizado,
  obterTreinoDeHoje,
  descreverSerie,
  repeticoesAlvo,
} from '@/compartilhado/servicos/plano-gestao-servico';

interface ExercicioAoVivo {
  id: string;
  nome: string;
  series: number;
  reps: number | string;
  cargaSugerida: number;
  descansoSegundos: number;
}

export default function TelaTreinoAoVivo() {
  const { cores } = useTema();
  const estilos = useMemo(() => criarEstilos(cores), [cores]);
  const router = useRouter();
  const { treinoId } = useLocalSearchParams<{ treinoId?: string }>();

  const fecharTreino = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/treino');
  };

  // Sem treino para mostrar, a tela diz isso: nunca exercícios inventados.
  const [situacao, setSituacao] = useState<'carregando' | 'pronto' | 'vazio'>('carregando');
  const [listaExercicios, setListaExercicios] = useState<ExercicioAoVivo[]>([]);
  const [tituloTreino, setTituloTreino] = useState('Treino ao Vivo');
  const [inicioMs] = useState(() => Date.now());
  const [exerciciosFeitos, setExerciciosFeitos] = useState(0);
  const [indexExercicio, setIndexExercicio] = useState(0);
  const quiqueSerie = useQuique(1.06);
  const [serieAtual, setSerieAtual] = useState(1);
  const [cargaUsada, setCargaUsada] = useState('');
  const [tempoRestante, setTempoRestante] = useState(90);
  const [emDescanso, setEmDescanso] = useState(false);
  const [seriesFeitas, setSeriesFeitas] = useState(0);
  // Séries feitas de verdade (carga e reps): base da estimativa de kcal da RN20.
  const [seriesExecutadas, setSeriesExecutadas] = useState<SerieExecutada[]>([]);
  const [kcalEstimadas, setKcalEstimadas] = useState<number | null>(null);
  // RN21: depois do momento de conquista, o resumo com "Registrar com foto".
  const [duracaoFinal, setDuracaoFinal] = useState(0);
  const [mostrarFim, setMostrarFim] = useState(false);
  // Nível e medalhas novas, mostrados um a um depois do "Treino concluído" (RN22).

  // Com séries registradas, sair por engano perderia o treino: pede confirmação.
  const sairDoTreino = () => {
    if (seriesFeitas === 0) return fecharTreino();
    Alert.alert(
      'Sair do treino?',
      `Você já fez ${seriesFeitas} ${seriesFeitas === 1 ? 'série' : 'séries'}. O treino não será marcado como concluído.`,
      [
        { text: 'Continuar treino', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: fecharTreino },
      ],
    );
  };

  useEffect(() => {
    async function carregarTreinoReal() {
      try {
        // O treino pedido pela rota; sem parâmetro, o de hoje (com a troca do dia).
        const treino = treinoId
          ? ((await obterPlanoTreinoCustomizado()).find((p) => p.id === treinoId) ?? null)
          : await obterTreinoDeHoje();
        if (!treino || treino.exercicios.length === 0) {
          setSituacao('vazio');
          return;
        }
        setTituloTreino(treino.foco || treino.diaSemana);
        const adaptados: ExercicioAoVivo[] = treino.exercicios.map((ex) => ({
          id: ex.id,
          nome: ex.nome,
          series: ex.series || 4,
          // Valores do plano, sem inventar carga (0 = a pessoa informa).
          reps: ex.repeticoes,
          cargaSugerida: ex.cargaKg || 0,
          descansoSegundos: ex.tempoDescansoSegundos || 60,
        }));
        setListaExercicios(adaptados);
        setTempoRestante(adaptados[0].descansoSegundos);
        setSituacao('pronto');
      } catch (err) {
        console.warn('Erro ao carregar treino real para execução ao vivo:', err);
        setSituacao('vazio');
      }
    }
    carregarTreinoReal();
  }, [treinoId]);

  // Um passo por segundo; o fim do descanso fica no callback (sem setState síncrono no efeito).
  useEffect(() => {
    if (!emDescanso) return;
    const passo = setTimeout(
      () => {
        if (tempoRestante > 1) {
          setTempoRestante(tempoRestante - 1);
          return;
        }
        setTempoRestante(0);
        setEmDescanso(false);
        // Confirmação discreta: o haptic e o rótulo do timer, que vira "Pronto".
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
      tempoRestante > 0 ? 1000 : 0,
    );
    return () => clearTimeout(passo);
  }, [emDescanso, tempoRestante]);

  if (situacao === 'carregando') return <View style={estilos.container} />;
  if (situacao === 'vazio') {
    return (
      <View style={[estilos.container, estilos.centro]}>
        <EstadoVazio
          simbolo="dumbbell"
          titulo={treinoId ? 'Treino não encontrado' : 'Hoje é dia de descanso'}
          mensagem="Escolha um treino na aba Treino para começar."
          textoAcao="Voltar"
          aoAgir={fecharTreino}
        />
      </View>
    );
  }

  const exAtual = listaExercicios[indexExercicio] ?? listaExercicios[0];

  // Rodada 3 — Ajuste 1: Conclui a série e registra automaticamente no progressoServico
  const concluirSerie = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    quiqueSerie.quicar();

    const cargaFinal = parseFloat(cargaUsada) || exAtual.cargaSugerida;
    const repeticoes = repeticoesAlvo(exAtual.reps);

    // Registra no histórico por série do exercício
    await registrarExecucaoSerie(exAtual.id, exAtual.nome, serieAtual, cargaFinal, repeticoes);
    setSeriesFeitas((n) => n + 1);
    const executadas = [
      ...seriesExecutadas,
      {
        cargaKg: cargaFinal,
        repeticoes,
        composto: ehComposto(exAtual.nome),
        exercicio: exAtual.nome,
      },
    ];
    setSeriesExecutadas(executadas);

    if (serieAtual < exAtual.series) {
      setSerieAtual(serieAtual + 1);
      setTempoRestante(exAtual.descansoSegundos);
      setEmDescanso(true);
    } else {
      setExerciciosFeitos((n) => n + 1);
      if (indexExercicio < listaExercicios.length - 1) {
        setIndexExercicio(indexExercicio + 1);
        setSerieAtual(1);
        setTempoRestante(listaExercicios[indexExercicio + 1].descansoSegundos);
        setEmDescanso(true);
      } else {
        await incrementarTreinoRealizado();
        // Marca o dia como treinado: é o que a tira da semana da aba Treino lê.
        const hoje = new Date().toISOString().split('T')[0];
        const duracaoMinutos = Math.max(1, Math.round((Date.now() - inicioMs) / 60000));
        // Peso mais recente registrado; sem ele, a RN20 manda não calcular.
        const pesagens = await obterHistoricoPeso();
        const kcal = estimarKcalTreino({
          pesoKg: pesagens[pesagens.length - 1]?.pesoKg,
          duracaoMinutos,
          series: executadas,
        });
        setKcalEstimadas(kcal);
        setDuracaoFinal(duracaoMinutos);
        await salvarHistoricoTreino(hoje, {
          idSessao: `sessao-${inicioMs}`,
          data: hoje,
          foco: tituloTreino,
          duracaoMinutos,
          kcalEstimadas: kcal,
          // Este exercício acabou de terminar e ainda não entrou no estado.
          exerciciosConcluidos: exerciciosFeitos + 1,
          totalExercicios: listaExercicios.length,
          concluido: true,
          series: executadas,
        });
        // Servidor: grava a sessão (aderência RN28 e grupos leem dela).
        await gravarSessaoTreino({
          data: hoje,
          nomeTreino: tituloTreino,
          duracaoMinutos,
          kcalEstimadas: kcal,
        });
        setMostrarFim(true);
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
    // Tocar fora do campo fecha o teclado; o KeyboardAvoidingView sobe as ações para
    // "Concluir Série" não ficar escondido atrás do teclado numérico.
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={estilos.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Topo / Progresso da Sessão */}
        <View style={estilos.topo}>
          <TouchableOpacity
            style={estilos.btnSairAmarelo}
            onPress={sairDoTreino}
            activeOpacity={0.8}
          >
            <SymbolView name="xmark" size={14} tintColor={cores.texto} weight="regular" />
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
        <Animated.View style={quiqueSerie.estilo}>
          <CardVidro semBorda estilo={estilos.cardSerie}>
            <Text style={estilos.serieDetalhes}>
              Série <Text style={estilos.destaque}>{serieAtual}</Text> de {exAtual.series} ·{' '}
              {descreverSerie(exAtual.cargaSugerida, exAtual.reps)}
            </Text>
          </CardVidro>
        </Animated.View>

        {/* Timer de Descanso Circular */}
        <View style={estilos.timerContainer}>
          <AnelProgresso
            atual={tempoRestante}
            meta={exAtual.descansoSegundos}
            tamanho={180}
            espessura={14}
            mostrarValor={false}
            // O tempo já aparece no centro; o "0 restam" padrão confundia antes de começar.
            subtextoCustom=" "
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
            placeholder={exAtual.cargaSugerida > 0 ? String(exAtual.cargaSugerida) : 'Ex.: 20'}
            placeholderTextColor={cores.textoSecundario}
            value={cargaUsada}
            onChangeText={setCargaUsada}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
            inputAccessoryViewID={ID_ACESSORIO_CARGA}
          />
        </View>
        {Platform.OS === 'ios' ? (
          // O teclado numérico do iOS não tem tecla de confirmar: este "OK" fecha o teclado.
          <InputAccessoryView nativeID={ID_ACESSORIO_CARGA}>
            <View style={estilos.barraTeclado}>
              <TouchableOpacity onPress={Keyboard.dismiss} accessibilityRole="button" hitSlop={12}>
                <Text style={estilos.textoOkTeclado}>OK</Text>
              </TouchableOpacity>
            </View>
          </InputAccessoryView>
        ) : null}

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

        {mostrarFim ? (
          <FimDoTreino
            resumo={{
              nomeTreino: tituloTreino,
              duracaoMinutos: duracaoFinal,
              series: seriesExecutadas,
              kcalEstimadas,
            }}
            aoConcluir={fecharTreino}
          />
        ) : null}
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const ID_ACESSORIO_CARGA = 'acessorio-carga';

const criarEstilos = (cores: CoresTema) =>
  StyleSheet.create({
    barraTeclado: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: Espacamento.md,
      paddingVertical: Espacamento.sm,
      backgroundColor: cores.superficie,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: cores.separador,
    },
    textoOkTeclado: {
      color: cores.destaque,
      fontSize: Fonte.corpo,
      fontWeight: PesoFonte.semibold,
    },
    centro: { justifyContent: 'center' },
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
      backgroundColor: cores.destaque,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: Raio.full,
      shadowColor: cores.destaque,
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    },
    txtSairAmarelo: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Tipografia.rodape,
      fontWeight: PesoFonte.bold,
      color: cores.textoSobreDestaque,
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
