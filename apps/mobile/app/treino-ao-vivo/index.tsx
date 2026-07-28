// ============================================================
// TELA: Treino ao Vivo (app/treino-ao-vivo/index.tsx)
// ============================================================
// Modo de execução do treino em tempo real.
// Ajuste 6: Botão 'Sair' estilo pílula amarela (#EAB308) no canto superior esquerdo.
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { CardVidro, BotaoPrimario, AnelProgresso } from '../../componentes/ui';
import { Cores, Espacamento, FamiliaFonte, Fonte, PesoFonte, Raio } from '../../constantes/Cores';
import { formatarTempo } from '@fitapp/utilidades';

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
      setSerieAtual(serieAtual + 1);
      setTempoRestante(exAtual.descansoSegundos);
      setEmDescanso(true);
    } else {
      if (indexExercicio < exercicios.length - 1) {
        setIndexExercicio(indexExercicio + 1);
        setSerieAtual(1);
        setTempoRestante(exercicios[indexExercicio + 1].descansoSegundos);
        setEmDescanso(true);
      } else {
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
      {/* Topo / Progresso da Sessão (Ajuste 6: Botão Sair Amarelo no Canto Superior Esquerdo) */}
      <View style={estilos.topo}>
        <TouchableOpacity
          style={estilos.btnSairAmarelo}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <SymbolView name="xmark" size={14} tintColor="#FFFFFF" weight="bold" />
          <Text style={estilos.txtSairAmarelo}>Sair</Text>
        </TouchableOpacity>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={estilos.tituloTreino}>Peito + Tríceps</Text>
          <Text style={estilos.progressoTexto}>
            Exercício {indexExercicio + 1}/{exercicios.length}
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
          placeholderTextColor={Cores.texto.desabilitado}
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
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Cores.fundo.principal,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },

  // Ajuste 6: Estilo botão pílula amarela no canto superior esquerdo
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
    color: Cores.texto.principal,
  },
  progressoTexto: {
    fontFamily: FamiliaFonte.regular,
    fontSize: Fonte.micro,
    color: Cores.texto.secundario,
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
    color: Cores.texto.principal,
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
    color: Cores.texto.secundario,
  },
  destaque: {
    fontFamily: FamiliaFonte.bold,
    color: Cores.accent,
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
    color: Cores.texto.principal,
  },
  timerLabel: {
    fontFamily: FamiliaFonte.regular,
    fontSize: Fonte.label,
    color: Cores.texto.secundario,
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
    color: Cores.texto.secundario,
  },
  inputCarga: {
    fontFamily: FamiliaFonte.bold,
    fontSize: Fonte.corpo,
    color: Cores.texto.principal,
    backgroundColor: Cores.fundo.elevada,
    borderWidth: 1,
    borderColor: Cores.borda.media,
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
    color: Cores.texto.desabilitado,
  },
  botaoConcluir: {},
});
