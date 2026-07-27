// ============================================================
// TELA: Módulo de Treino (app/(tabs)/treino.tsx)
// ============================================================
// Exibe o plano semanal completo de treino, dividindo por dias
// e listando os exercícios, séries e cargas sugeridas.
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CardVidro, BotaoPrimario } from '../../componentes/ui';
import { Cores, Espacamento, Fonte, PesoFonte, Raio } from '../../constantes/Cores';

interface Exercicio {
  nome: string;
  series: number;
  reps: number;
  carga: number;
}

interface DiaTreino {
  dia: string;
  nome: string;
  foco: string;
  exercicios: Exercicio[];
}

export default function TelaTreino() {
  const router = useRouter();
  const [diaSelecionado, setDiaSelecionado] = useState(0);

  const diasTreino: DiaTreino[] = [
    {
      dia: 'Segunda',
      nome: 'Treino A',
      foco: 'Peito & Tríceps',
      exercicios: [
        { nome: 'Supino Reto com Barra', series: 4, reps: 10, carga: 60 },
        { nome: 'Supino Inclinado com Halteres', series: 3, reps: 12, carga: 24 },
        { nome: 'Crossover no Cabo', series: 3, reps: 15, carga: 20 },
        { nome: 'Tríceps Pulley com Corda', series: 4, reps: 12, carga: 35 },
      ],
    },
    {
      dia: 'Terça',
      nome: 'Treino B',
      foco: 'Costas & Bíceps',
      exercicios: [
        { nome: 'Puxada Frontal no Pulley', series: 4, reps: 10, carga: 55 },
        { nome: 'Remada Curvada com Barra', series: 3, reps: 10, carga: 50 },
        { nome: 'Rosca Direta Barra W', series: 4, reps: 12, carga: 24 },
      ],
    },
    {
      dia: 'Quarta',
      nome: 'Treino C',
      foco: 'Pernas Completo',
      exercicios: [
        { nome: 'Agachamento Livre', series: 4, reps: 8, carga: 80 },
        { nome: 'Leg Press 45°', series: 3, reps: 12, carga: 160 },
        { nome: 'Cadeira Extensora', series: 3, reps: 15, carga: 50 },
        { nome: 'Mesa Flexora', series: 4, reps: 12, carga: 40 },
      ],
    },
  ];

  const diaAtual = diasTreino[diaSelecionado];

  return (
    <View style={estilos.container}>
      <ScrollView contentContainerStyle={estilos.scrollContent}>
        {/* Topo */}
        <View style={estilos.cabecalho}>
          <Text style={estilos.titulo}>Plano de Treino</Text>
          <Text style={estilos.subtitulo}>Divisão ABC 5x · Foco em Hipertrofia</Text>
        </View>

        {/* Seletor de Dias da Semana */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.diasScroll}>
          {diasTreino.map((d, index) => (
            <TouchableOpacity
              key={index}
              style={[
                estilos.chipDia,
                diaSelecionado === index && estilos.chipDiaSelecionado,
              ]}
              onPress={() => setDiaSelecionado(index)}
            >
              <Text
                style={[
                  estilos.textoChipDia,
                  diaSelecionado === index && estilos.textoChipDiaSelecionado,
                ]}
              >
                {d.dia}
              </Text>
              <Text
                style={[
                  estilos.subChipDia,
                  diaSelecionado === index && estilos.textoChipDiaSelecionado,
                ]}
              >
                {d.nome}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Card do Dia Selecionado */}
        <CardVidro estilo={estilos.cardDiaHeader}>
          <View style={estilos.rowDiaHeader}>
            <View>
              <Text style={estilos.diaFoco}>{diaAtual.foco}</Text>
              <Text style={estilos.diaDetalhes}>{diaAtual.exercicios.length} exercícios organizados</Text>
            </View>
          </View>
        </CardVidro>

        {/* Lista de Exercícios */}
        <Text style={estilos.secaoTitulo}>Exercícios do Dia</Text>

        {diaAtual.exercicios.map((ex, i) => (
          <CardVidro key={i} estilo={estilos.cardExercicio}>
            <View style={estilos.rowExercicio}>
              <View style={estilos.badgeOrdem}>
                <Text style={estilos.ordemTexto}>{i + 1}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={estilos.exNome}>{ex.nome}</Text>
                <Text style={estilos.exSub}>
                  {ex.series} séries × {ex.reps} reps · {ex.carga}kg
                </Text>
              </View>
            </View>
          </CardVidro>
        ))}

        <BotaoPrimario
          texto="Iniciar Treino Ao Vivo ➔"
          aoPresionar={() => router.push('/treino-ao-vivo')}
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
    paddingBottom: 100,
  },
  cabecalho: {
    marginTop: Espacamento.md,
    marginBottom: Espacamento.lg,
  },
  titulo: {
    fontSize: Fonte.display,
    fontWeight: PesoFonte.extrabold,
    color: Cores.texto.principal,
  },
  subtitulo: {
    fontSize: Fonte.corpo,
    color: Cores.texto.secundario,
    marginTop: 2,
  },
  diasScroll: {
    flexDirection: 'row',
    marginBottom: Espacamento.xl,
  },
  chipDia: {
    paddingHorizontal: Espacamento.lg,
    paddingVertical: Espacamento.md,
    borderRadius: Raio.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: Cores.vidro.borda,
    marginRight: Espacamento.sm,
    alignItems: 'center',
  },
  chipDiaSelecionado: {
    backgroundColor: Cores.primaria.suave,
    borderColor: Cores.primaria.base,
  },
  textoChipDia: {
    fontSize: Fonte.label,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.secundario,
  },
  subChipDia: {
    fontSize: Fonte.micro,
    color: Cores.texto.secundario,
    marginTop: 2,
  },
  textoChipDiaSelecionado: {
    color: Cores.texto.principal,
  },
  cardDiaHeader: {
    marginBottom: Espacamento.xl,
  },
  rowDiaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  diaFoco: {
    fontSize: Fonte.titulo,
    fontWeight: PesoFonte.extrabold,
    color: Cores.texto.principal,
  },
  diaDetalhes: {
    fontSize: Fonte.label,
    color: Cores.secundaria,
    marginTop: 2,
  },
  secaoTitulo: {
    fontSize: Fonte.subtitulo,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
    marginBottom: Espacamento.md,
  },
  cardExercicio: {
    marginBottom: Espacamento.md,
  },
  rowExercicio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.md,
  },
  badgeOrdem: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Cores.primaria.suave,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ordemTexto: {
    color: Cores.primaria.base,
    fontWeight: PesoFonte.bold,
    fontSize: Fonte.corpo,
  },
  exNome: {
    fontSize: Fonte.corpo,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
  },
  exSub: {
    fontSize: Fonte.label,
    color: Cores.texto.secundario,
    marginTop: 2,
  },
  botaoIniciar: {
    marginTop: Espacamento.xl,
  },
});
