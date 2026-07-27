// ============================================================
// TELA: Treino ao Vivo (app/treino-ao-vivo/index.tsx)
// ============================================================
// Modo de execução do treino em tempo real.
// Exibe exercício atual, séries, peso usado, timer de descanso
// circular e botões de ação com feedback háptico.
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { CardVidro, BotaoPrimario, AnelProgresso } from '../../componentes/ui';
import { Cores, Espacamento, Fonte, PesoFonte, Raio } from '../../constantes/Cores';
import { formatarTempo } from '@fitapp/utilidades';

// Dados simulados do treino atual
const exercicios = [
  { id: '1', nome: 'Supino Reto com Barra', series: 4, reps: 10, cargaSugerida: 60, descansoSegundos: 90 },
  { id: '2', nome: 'Supino Inclinado com Halteres', series: 3, reps: 12, cargaSugerida: 24, descansoSegundos: 60 },
  { id: '3', nome: 'Tríceps Pulley com Corda', series: 4, reps: 12, cargaSugerida: 35, descansoSegundos: 60 },
];

export default function TelaTreinoAoVivo() {
  const router = useRouter();

  const [indexExercicio, setIndexExercicio] = useState(0);
  const [serieAtual, setSerieAtual] = useState(1);
  const [cargaUsada, setCargaUsada] = useState('');
  const [tempoRestante, setTempoRestante] = useState(90);
  const [emDescanso, setEmDescanso] = useState(false);

  const exAtual = exercicios[indexExercicio];

  // Timer de descanso
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (emDescanso && tempoRestante > 0) {
      interval = setInterval(() => {
        setTempoRestante((t) => t - 1);
      }, 1000);
    } else if (tempoRestante === 0 && emDescanso) {
      setEmDescanso(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Descanso Concluído!', 'Hora da próxima série!');
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [emDescanso, tempoRestante]);

  const concluirSerie = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (serieAtual < exAtual.series) {
      // Avança para a próxima série e inicia descanso
      setSerieAtual(serieAtual + 1);
      setTempoRestante(exAtual.descansoSegundos);
      setEmDescanso(true);
    } else {
      // Concluiu todas as séries deste exercício -> avança para próximo exercício
      if (indexExercicio < exercicios.length - 1) {
        setIndexExercicio(indexExercicio + 1);
        setSerieAtual(1);
        setTempoRestante(exercicios[indexExercicio + 1].descansoSegundos);
        setEmDescanso(true);
      } else {
        // Treino concluído!
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Parabéns! 🎉', 'Treino concluído com sucesso!');
        router.back();
      }
    }
  };

  const pularExercicio = () => {
    if (indexExercicio < exercicios.length - 1) {
      setIndexExercicio(indexExercicio + 1);
      setSerieAtual(1);
      setEmDescanso(false);
    } else {
      router.back();
    }
  };

  return (
    <View style={estilos.container}>
      {/* Topo / Progresso da Sessão */}
      <View style={estilos.topo}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={estilos.textoSair}>✕ Sair</Text>
        </TouchableOpacity>
        <Text style={estilos.tituloTreino}>Peito + Tríceps</Text>
        <Text style={estilos.progressoTexto}>
          Exercício {indexExercicio + 1}/{exercicios.length}
        </Text>
      </View>

      {/* Nome do Exercício */}
      <View style={estilos.exercicioHeader}>
        <Text style={estilos.exercicioNome}>{exAtual.nome}</Text>
      </View>

      {/* Card da Série Atual */}
      <CardVidro estilo={estilos.cardSerie}>
        <Text style={estilos.serieDetalhes}>
          Série <Text style={estilos.destaque}>{serieAtual}</Text> de {exAtual.series} · {exAtual.reps} reps · {exAtual.cargaSugerida}kg
        </Text>
      </CardVidro>

      {/* Timer de Descanso Circular */}
      <View style={estilos.timerContainer}>
        <AnelProgresso
          atual={tempoRestante}
          meta={exAtual.descansoSegundos}
          tamanho={180}
          espessura={14}
          cor={emDescanso ? Cores.secundaria : Cores.primaria.base}
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
          placeholderTextColor={Cores.texto.secundario}
          value={cargaUsada}
          onChangeText={setCargaUsada}
        />
      </View>

      {/* Botões de Ação */}
      <View style={estilos.acoesRow}>
        <TouchableOpacity style={estilos.botaoGlass} onPress={pularExercicio}>
          <Text style={estilos.textoGlass}>Pular</Text>
        </TouchableOpacity>

        <BotaoPrimario
          texto={serieAtual === exAtual.series && indexExercicio === exercicios.length - 1 ? 'Finalizar Treino' : 'Concluir Série ✓'}
          aoPresionar={concluirSerie}
          estilo={{ flex: 2 }}
        />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Cores.fundo.principal,
    padding: Espacamento.xxl,
    justifyContent: 'space-between',
  },
  topo: {
    marginTop: Espacamento.xl,
  },
  textoSair: {
    color: Cores.texto.secundario,
    fontSize: Fonte.corpo,
    marginBottom: Espacamento.sm,
  },
  tituloTreino: {
    fontSize: Fonte.titulo,
    fontWeight: PesoFonte.extrabold,
    color: Cores.texto.principal,
  },
  progressoTexto: {
    fontSize: Fonte.label,
    color: Cores.secundaria,
    fontWeight: PesoFonte.bold,
    marginTop: 2,
  },
  exercicioHeader: {
    alignItems: 'center',
    marginVertical: Espacamento.md,
  },
  exercicioNome: {
    fontSize: Fonte.display,
    fontWeight: PesoFonte.extrabold,
    color: Cores.texto.principal,
    textAlign: 'center',
  },
  cardSerie: {
    alignItems: 'center',
    paddingVertical: Espacamento.md,
  },
  serieDetalhes: {
    fontSize: Fonte.subtitulo,
    color: Cores.texto.principal,
  },
  destaque: {
    color: Cores.primaria.base,
    fontWeight: PesoFonte.extrabold,
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Espacamento.md,
  },
  timerTextoAbsolute: {
    position: 'absolute',
    alignItems: 'center',
  },
  timerTempo: {
    fontSize: 40,
    fontWeight: PesoFonte.extrabold,
    color: Cores.texto.principal,
  },
  timerLabel: {
    fontSize: Fonte.label,
    color: Cores.texto.secundario,
    marginTop: 2,
  },
  inputCargaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espacamento.md,
  },
  cargaLabel: {
    fontSize: Fonte.corpo,
    color: Cores.texto.secundario,
  },
  inputCarga: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Cores.vidro.borda,
    borderRadius: Raio.md,
    paddingHorizontal: Espacamento.md,
    paddingVertical: Espacamento.sm,
    fontSize: Fonte.corpo,
    color: Cores.texto.principal,
    width: 80,
    textAlign: 'center',
  },
  acoesRow: {
    flexDirection: 'row',
    gap: Espacamento.md,
    marginBottom: Espacamento.xl,
  },
  botaoGlass: {
    flex: 1,
    backgroundColor: Cores.vidro.fundo,
    borderWidth: 1,
    borderColor: Cores.vidro.borda,
    borderRadius: Raio.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Espacamento.lg,
  },
  textoGlass: {
    color: Cores.texto.principal,
    fontSize: Fonte.corpo,
    fontWeight: PesoFonte.bold,
  },
});
