// ============================================================
// TELA: Módulo de Treino (app/(tabs)/treino.tsx)
// ============================================================
// Clean Dark UI — referência Fitbod.
// Seletor de dias tipo chip, lista de exercícios horizontal enxuta,
// botão flat accent. Sem gradientes, sem emojis, sem glow.
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { CardVidro, BotaoPrimario } from '../../componentes/ui';
import { Cores, Espacamento, Fonte, PesoFonte, Raio } from '../../constantes/Cores';

interface Exercicio {
  nome: string;
  series: number;
  reps: number;
  carga: number;
  grupo: string;
}

interface DiaTreino {
  abreviacao: string;
  dia: string;
  nome: string;
  foco: string;
  exercicios: Exercicio[];
}

const diasTreino: DiaTreino[] = [
  {
    abreviacao: 'SEG',
    dia: 'Segunda',
    nome: 'Treino A',
    foco: 'Peito & Tríceps',
    exercicios: [
      { nome: 'Supino Reto com Barra', series: 4, reps: 10, carga: 60, grupo: 'Peito' },
      { nome: 'Supino Inclinado com Halteres', series: 3, reps: 12, carga: 24, grupo: 'Peito' },
      { nome: 'Crossover no Cabo', series: 3, reps: 15, carga: 20, grupo: 'Peito' },
      { nome: 'Tríceps Pulley com Corda', series: 4, reps: 12, carga: 35, grupo: 'Tríceps' },
    ],
  },
  {
    abreviacao: 'TER',
    dia: 'Terça',
    nome: 'Treino B',
    foco: 'Costas & Bíceps',
    exercicios: [
      { nome: 'Puxada Frontal no Pulley', series: 4, reps: 10, carga: 55, grupo: 'Costas' },
      { nome: 'Remada Curvada com Barra', series: 3, reps: 10, carga: 50, grupo: 'Costas' },
      { nome: 'Rosca Direta Barra W', series: 4, reps: 12, carga: 24, grupo: 'Bíceps' },
    ],
  },
  {
    abreviacao: 'QUA',
    dia: 'Quarta',
    nome: 'Treino C',
    foco: 'Pernas Completo',
    exercicios: [
      { nome: 'Agachamento Livre', series: 4, reps: 8, carga: 80, grupo: 'Quadríceps' },
      { nome: 'Leg Press 45°', series: 3, reps: 12, carga: 160, grupo: 'Quadríceps' },
      { nome: 'Cadeira Extensora', series: 3, reps: 15, carga: 50, grupo: 'Quadríceps' },
      { nome: 'Mesa Flexora', series: 4, reps: 12, carga: 40, grupo: 'Posterior' },
    ],
  },
  {
    abreviacao: 'QUI',
    dia: 'Quinta',
    nome: 'Descanso',
    foco: 'Recuperação ativa',
    exercicios: [],
  },
  {
    abreviacao: 'SEX',
    dia: 'Sexta',
    nome: 'Treino A',
    foco: 'Ombros & Trapézio',
    exercicios: [
      { nome: 'Desenvolvimento com Halteres', series: 4, reps: 10, carga: 20, grupo: 'Ombros' },
      { nome: 'Elevação Lateral', series: 4, reps: 15, carga: 10, grupo: 'Ombros' },
      { nome: 'Encolhimento com Barra', series: 3, reps: 12, carga: 60, grupo: 'Trapézio' },
    ],
  },
];

export default function TelaTreino() {
  const router = useRouter();
  const [diaSelecionado, setDiaSelecionado] = useState(0);

  const diaAtual = diasTreino[diaSelecionado];
  const temTreino = diaAtual.exercicios.length > 0;

  return (
    <View style={estilos.container}>
      <ScrollView
        contentContainerStyle={estilos.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Cabeçalho ─────────────────────────────────────── */}
        <View style={estilos.cabecalho}>
          <Text style={estilos.titulo}>Treino</Text>
          <Text style={estilos.subtitulo}>Divisão ABC · Hipertrofia</Text>
        </View>

        {/* ── Seletor de dias ───────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={estilos.scrollDias}
          style={estilos.scrollDiasWrapper}
        >
          {diasTreino.map((d, i) => (
            <TouchableOpacity
              key={i}
              style={[estilos.chipDia, diaSelecionado === i && estilos.chipDiaSelecionado]}
              onPress={() => setDiaSelecionado(i)}
              activeOpacity={0.7}
            >
              <Text style={[estilos.chipAbrev, diaSelecionado === i && estilos.chipTextoAtivo]}>
                {d.abreviacao}
              </Text>
              <Text style={[estilos.chipNome, diaSelecionado === i && estilos.chipTextoAtivo]}>
                {d.nome}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Card do dia selecionado ───────────────────────── */}
        <CardVidro estilo={estilos.cardDiaHeader}>
          <View style={estilos.rowDiaHeader}>
            <View style={estilos.iconeFocoContainer}>
              <SymbolView
                name={temTreino ? 'dumbbell.fill' : 'dumbbell'}
                size={18}
                tintColor={temTreino ? Cores.accent : Cores.texto.desabilitado}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={estilos.diaFoco}>{diaAtual.foco}</Text>
              <Text style={estilos.diaDetalhes}>
                {temTreino
                  ? `${diaAtual.exercicios.length} exercícios`
                  : 'Sem treino programado'}
              </Text>
            </View>
            {temTreino && (
              <View style={estilos.badgeSessao}>
                <Text style={estilos.textoBadgeSessao}>{diaAtual.nome}</Text>
              </View>
            )}
          </View>
        </CardVidro>

        {/* ── Lista de exercícios ───────────────────────────── */}
        {temTreino ? (
          <>
            <Text style={estilos.secaoTitulo}>Exercícios</Text>

            {diaAtual.exercicios.map((ex, i) => (
              <CardVidro key={i} estilo={estilos.cardExercicio}>
                <View style={estilos.rowExercicio}>
                  {/* Número de ordem */}
                  <View style={estilos.ordemContainer}>
                    <Text style={estilos.ordemTexto}>{String(i + 1).padStart(2, '0')}</Text>
                  </View>

                  {/* Nome + detalhes */}
                  <View style={estilos.colExercicio}>
                    <Text style={estilos.exNome}>{ex.nome}</Text>
                    <Text style={estilos.exSub}>
                      {ex.series} séries · {ex.reps} reps · {ex.carga}kg
                    </Text>
                  </View>

                  {/* Grupo muscular */}
                  <View style={estilos.badgeGrupo}>
                    <Text style={estilos.textoBadgeGrupo}>{ex.grupo}</Text>
                  </View>
                </View>
              </CardVidro>
            ))}

            <BotaoPrimario
              texto="Iniciar Treino"
              aoPresionar={() => router.push('/treino-ao-vivo')}
              estilo={estilos.botaoIniciar}
            />
          </>
        ) : (
          <View style={estilos.containerVazio}>
            <Text style={estilos.textoVazioTitulo}>Dia de descanso</Text>
            <Text style={estilos.textoVazioSub}>Recuperação é parte do treino.</Text>
          </View>
        )}
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 120,
  },

  cabecalho: {
    marginBottom: 20,
  },
  titulo: {
    fontSize: Fonte.titulo,
    fontWeight: PesoFonte.semibold,
    color: Cores.texto.principal,
  },
  subtitulo: {
    fontSize: Fonte.label,
    color: Cores.texto.secundario,
    marginTop: 3,
  },

  scrollDiasWrapper: {
    marginBottom: 20,
  },
  scrollDias: {
    gap: Espacamento.sm,
    paddingRight: 4,
  },
  chipDia: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Raio.md,
    backgroundColor: Cores.fundo.superficie,
    borderWidth: 1,
    borderColor: Cores.borda.sutil,
    alignItems: 'center',
    minWidth: 56,
  },
  chipDiaSelecionado: {
    backgroundColor: Cores.accentSuave,
    borderColor: Cores.accentBorda,
  },
  chipAbrev: {
    fontSize: Fonte.micro,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.desabilitado,
    letterSpacing: 0.5,
  },
  chipNome: {
    fontSize: Fonte.micro,
    color: Cores.texto.desabilitado,
    marginTop: 2,
  },
  chipTextoAtivo: {
    color: Cores.accent,
  },

  cardDiaHeader: {
    marginBottom: 20,
  },
  rowDiaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconeFocoContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Cores.fundo.elevada,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Cores.borda.sutil,
  },
  diaFoco: {
    fontSize: Fonte.corpo,
    fontWeight: PesoFonte.semibold,
    color: Cores.texto.principal,
  },
  diaDetalhes: {
    fontSize: Fonte.micro,
    color: Cores.texto.secundario,
    marginTop: 2,
  },
  badgeSessao: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Raio.sm,
    backgroundColor: Cores.accentSuave,
    borderWidth: 1,
    borderColor: Cores.accentBorda,
  },
  textoBadgeSessao: {
    fontSize: Fonte.micro,
    color: Cores.accent,
    fontWeight: PesoFonte.semibold,
  },

  secaoTitulo: {
    fontSize: Fonte.label,
    fontWeight: PesoFonte.semibold,
    color: Cores.texto.secundario,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Espacamento.md,
  },

  cardExercicio: {
    marginBottom: Espacamento.sm,
    padding: Espacamento.md,
  },
  rowExercicio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.md,
  },
  ordemContainer: {
    width: 32,
    alignItems: 'center',
  },
  ordemTexto: {
    fontSize: 13,
    fontWeight: PesoFonte.bold,
    color: Cores.accent,
    fontVariant: ['tabular-nums'],
  },
  colExercicio: {
    flex: 1,
  },
  exNome: {
    fontSize: Fonte.corpo,
    fontWeight: PesoFonte.semibold,
    color: Cores.texto.principal,
  },
  exSub: {
    fontSize: Fonte.micro,
    color: Cores.texto.secundario,
    marginTop: 2,
  },
  badgeGrupo: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Raio.sm,
    backgroundColor: Cores.fundo.elevada,
    borderWidth: 1,
    borderColor: Cores.borda.sutil,
  },
  textoBadgeGrupo: {
    fontSize: 10,
    color: Cores.texto.desabilitado,
    fontWeight: PesoFonte.medio,
  },

  botaoIniciar: {
    marginTop: 20,
  },

  containerVazio: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  textoVazioTitulo: {
    fontSize: Fonte.corpo,
    fontWeight: PesoFonte.semibold,
    color: Cores.texto.secundario,
  },
  textoVazioSub: {
    fontSize: Fonte.label,
    color: Cores.texto.desabilitado,
    marginTop: 4,
  },
});
