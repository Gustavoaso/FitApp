// ============================================================
// TELA: Módulo de Treino (app/(tabs)/treino.tsx)
// ============================================================
// Clean Dark UI.
// Rodada 3 — Ajuste 1:
// 1. Criação de treino em fluxo único (Nome do treino + Exercícios/Séries/Descanso na mesma tela)
// 2. Visualização das séries em LINHA (uma linha por série: Carga x Repetições)
// 3. Removido o botão '+' do card do dia (mantido apenas botão 'Trocar')
// ============================================================

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { BlurView } from 'expo-blur';
import { CardVidro, BotaoPrimario, TiraSemana } from '@/compartilhado/ui';
import type { MarcaDia } from '@/compartilhado/ui';
import {
  obterHistoricoTreinoCompleto,
  type RegistroTreinoDiario,
} from '@/compartilhado/servicos/historico-servico';
import { formatarKcalEstimada } from '@/compartilhado/utilidades/gasto-calorico';
import { gerarSemana } from '@/compartilhado/utilidades/semana';
import { CardResumoPlano } from './CardResumoPlano';
import { GradeTreinos } from './GradeTreinos';
import {
  CoresMacros,
  CoresTema,
  Espacamento,
  FamiliaFonte,
  Fonte,
  PesoFonte,
  Raio,
  Tipografia,
} from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import { supabase } from '@/compartilhado/supabase';
import {
  obterPlanoTreinoCustomizado,
  salvarPlanoTreinoCustomizado,
  adicionarExercicioAoDia,
  atualizarExercicio,
  removerExercicio,
  definirTreinoEspecialParaData,
  obterTreinoEspecialParaData,
  obterMapeamentoSemanal,
  descreverSerie,
  salvarMapeamentoSemanal,
  DiaTreinoCustomizado,
  ExercicioCustomizado,
} from '@/compartilhado/servicos/plano-gestao-servico';
import {
  obterSeriesUltimaExecucao,
  EstatisticasAderencia,
  recalcularMetaSemanalAuto,
  calcularAderenciaSemanal,
} from '@/compartilhado/servicos/progresso-servico';

export default function TelaTreino() {
  const { cores, escuro } = useTema();
  const estilos = useMemo(() => criarEstilos(cores), [cores]);
  const router = useRouter();
  const [abaModo, setAbaModo] = useState<'registrado' | 'planejado'>('registrado');
  const [estatisticas, setEstatisticas] = useState<EstatisticasAderencia | null>(null);
  const [modalReformularSemanaVisivel, setModalReformularSemanaVisivel] = useState(false);

  const [diaSelecionado, setDiaSelecionado] = useState(
    () => new Date().toISOString().split('T')[0],
  );
  const [planos, setPlanos] = useState<DiaTreinoCustomizado[]>([]);
  const [historicoTreinos, setHistoricoTreinos] = useState<Record<string, RegistroTreinoDiario>>(
    {},
  );
  const [mapeamentoSemanal, setMapeamentoSemanal] = useState<Record<string, string>>({});
  const [idTreinoEspecial, setIdTreinoEspecial] = useState<string | null>(null);

  // Rodada 3 — Ajuste 1: Mapa do histórico de cada série por exercício (ex: { 'ex-1': { 1: {carga: 60, reps: 10} } })
  const [historicoSeriesMapa, setHistoricoSeriesMapa] = useState<
    Record<string, Record<number, { cargaKg: number; repeticoes: number }>>
  >({});

  // Modais
  const [menuTreinoVisivel, setMenuTreinoVisivel] = useState(false);
  const [modalCriarNovoTreinoVisivel, setModalCriarNovoTreinoVisivel] = useState(false);
  const [modalMeusTreinosVisivel, setModalMeusTreinosVisivel] = useState(false);
  const [modalDefinirSemanaVisivel, setModalDefinirSemanaVisivel] = useState(false);

  // Modais de exercícios
  const [modalAdicionarVisivel, setModalAdicionarVisivel] = useState(false);
  const [modalEditarVisivel, setModalEditarVisivel] = useState(false);
  const [modalTrocarTreinoVisivel, setModalTrocarTreinoVisivel] = useState(false);

  const [exercicioEmEdicao, setExercicioEmEdicao] = useState<ExercicioCustomizado | null>(null);

  // Forms do novo treino em fluxo único
  const [novoFocoTreino, setNovoFocoTreino] = useState('');
  const [exerciciosTempNovoTreino, setExerciciosTempNovoTreino] = useState<ExercicioCustomizado[]>(
    [],
  );
  const [nomeExTemp, setNomeExTemp] = useState('');
  const [grupoExTemp, setGrupoExTemp] = useState('Peito');
  const [seriesExTemp, setSeriesExTemp] = useState('');
  const [repsExTemp, setRepsExTemp] = useState('');
  const [cargaExTemp, setCargaExTemp] = useState('');
  const [descansoExTemp, setDescansoExTemp] = useState('');
  const [diaEmTrocaConfig, setDiaEmTrocaConfig] = useState<string | null>(null);
  const [modalSeletorTreinoVisivel, setModalSeletorTreinoVisivel] = useState(false);

  // Autocomplete ExerciseDB & Navegação por Grupo Muscular (Rodada 5 — Ajuste 5)
  const [sugestoesExercicios, setSugestoesExercicios] = useState<any[]>([]);
  const [grupoMuscularFiltro, setGrupoMuscularFiltro] = useState<string>('Todos');
  const GRUPOS_MUSCULARES = [
    'Todos',
    'Peito',
    'Costas',
    'Pernas',
    'Ombros',
    'Braços',
    'Core',
    'Cardio',
  ];

  useEffect(() => {
    async function buscarExerciciosBase() {
      try {
        let query = supabase.from('base_exercicios').select('*');
        if (nomeExTemp && nomeExTemp.trim().length >= 2) {
          query = query.ilike('nome', `%${nomeExTemp.trim()}%`);
        } else if (grupoMuscularFiltro !== 'Todos') {
          query = query.ilike('grupo_primario', `%${grupoMuscularFiltro}%`);
        }
        const { data } = await query.limit(10);
        setSugestoesExercicios(data || []);
      } catch (err) {
        console.warn('Erro ao buscar exercicios:', err);
      }
    }
    buscarExerciciosBase();
  }, [nomeExTemp, grupoMuscularFiltro]);

  // Form de edição/adição avulsa
  const [novoNome, setNovoNome] = useState('');
  const [novoGrupo, setNovoGrupo] = useState('Peito');
  const [novasSeries, setNovasSeries] = useState('4');
  const [novasReps, setNovasReps] = useState('10');
  const [novaCarga, setNovaCarga] = useState('60');
  const [novoDescanso, setNovoDescanso] = useState('60');

  const carregarPlanos = async () => {
    const dados = await obterPlanoTreinoCustomizado();
    setPlanos(dados);

    const mapSemana = await obterMapeamentoSemanal();
    setMapeamentoSemanal(mapSemana);

    const especial = await obterTreinoEspecialParaData(diaSelecionado);
    setIdTreinoEspecial(especial);

    const seriesMapa: Record<string, Record<number, { cargaKg: number; repeticoes: number }>> = {};
    for (const dia of dados) {
      for (const ex of dia.exercicios) {
        const hs = await obterSeriesUltimaExecucao(ex.id);
        if (hs) {
          seriesMapa[ex.id] = hs;
        }
      }
    }
    setHistoricoSeriesMapa(seriesMapa);

    const stats = await calcularAderenciaSemanal();
    setEstatisticas(stats);

    setHistoricoTreinos(await obterHistoricoTreinoCompleto());
  };

  useFocusEffect(
    useCallback(() => {
      carregarPlanos();
    }, [diaSelecionado]),
  );

  const [diasExpandidos, setDiasExpandidos] = useState<Record<string, boolean>>({});

  const alternarExpansaoDia = (abrev: string) => {
    setDiasExpandidos((prev) => ({ ...prev, [abrev]: !prev[abrev] }));
  };

  const semanaAtual = useMemo(() => gerarSemana(diaSelecionado), [diaSelecionado]);
  const abrevDia = semanaAtual.find((d) => d.data === diaSelecionado)?.abrev ?? 'seg';
  const registroDoDia = historicoTreinos[diaSelecionado];

  // Ponto por dia: verde = treino concluído; lima = hoje ou futuro com treino no cronograma.
  const marcasSemana = useMemo(() => {
    const hojeIso = new Date().toISOString().split('T')[0];
    const marcas: Record<string, MarcaDia | undefined> = {};
    for (const dia of semanaAtual) {
      const idTr = mapeamentoSemanal[dia.abrev];
      const planejado = !!idTr && idTr !== 'descanso' && dia.data >= hojeIso;
      marcas[dia.data] = historicoTreinos[dia.data]?.concluido
        ? 'feito'
        : planejado
          ? 'planejado'
          : undefined;
    }
    return marcas;
  }, [semanaAtual, mapeamentoSemanal, historicoTreinos]);

  const idTreinoPredefinido = mapeamentoSemanal[abrevDia];
  const treinoDefaultSemanal =
    idTreinoPredefinido && idTreinoPredefinido !== 'descanso'
      ? planos.find((p) => p.id === idTreinoPredefinido) || null
      : null;
  const diaAtual = idTreinoEspecial
    ? planos.find((p) => p.id === idTreinoEspecial) || treinoDefaultSemanal
    : treinoDefaultSemanal;

  const temTreino = diaAtual && diaAtual.exercicios && diaAtual.exercicios.length > 0;

  // Rodada 3 — Ajuste 1: Adiciona exercício temporário ao novo treino em fluxo único
  const adicionarExercicioTempAoNovoTreino = () => {
    if (!nomeExTemp.trim()) return;
    const novoEx: ExercicioCustomizado = {
      id: `extemp-${Date.now()}`,
      nome: nomeExTemp,
      grupoMuscular: grupoExTemp || 'Geral',
      series: parseInt(seriesExTemp, 10) || 4,
      repeticoes: parseInt(repsExTemp, 10) || 10,
      cargaKg: parseFloat(cargaExTemp) || 20,
      tempoDescansoSegundos: parseInt(descansoExTemp, 10) || 60,
    };
    setExerciciosTempNovoTreino((prev) => [...prev, novoEx]);
    setNomeExTemp('');
  };

  // Rodada 3 — Ajuste 1: Salva o novo treino completo (Nome + Exercícios/Séries/Descanso numa tela só)
  const lidarComCriarNovoTreino = async () => {
    if (!novoFocoTreino.trim()) return;
    const novoTreino: DiaTreinoCustomizado = {
      id: `dia-${Date.now()}`,
      diaSemana: 'Personalizado',
      foco: novoFocoTreino,
      exercicios:
        exerciciosTempNovoTreino.length > 0
          ? exerciciosTempNovoTreino
          : [
              {
                id: `ex-${Date.now()}`,
                nome: 'Supino Reto com Barra',
                grupoMuscular: 'Peito',
                series: 4,
                repeticoes: 10,
                cargaKg: 60,
                tempoDescansoSegundos: 90,
              },
            ],
    };
    const atualizados = [...planos, novoTreino];
    setPlanos(atualizados);
    await salvarPlanoTreinoCustomizado(atualizados);
    await recalcularMetaSemanalAuto(undefined, true);
    const stats = await calcularAderenciaSemanal();
    setEstatisticas(stats);
    setNovoFocoTreino('');
    setExerciciosTempNovoTreino([]);
    setModalCriarNovoTreinoVisivel(false);
  };

  const lidarComDefinirDiaSemana = async (abrev: string, idTreino: string) => {
    const novoMap = { ...mapeamentoSemanal, [abrev]: idTreino };
    setMapeamentoSemanal(novoMap);
    await salvarMapeamentoSemanal(novoMap);
    await recalcularMetaSemanalAuto(undefined, true);
    const stats = await calcularAderenciaSemanal();
    setEstatisticas(stats);
  };

  const lidarComSalvarNovoExercicio = async () => {
    if (!diaAtual) return;
    const atualizado = await adicionarExercicioAoDia(diaAtual.id, {
      nome: novoNome || 'Novo Exercício',
      grupoMuscular: novoGrupo,
      series: parseInt(novasSeries, 10) || 4,
      repeticoes: parseInt(novasReps, 10) || 10,
      cargaKg: parseFloat(novaCarga) || 20,
      tempoDescansoSegundos: parseInt(novoDescanso, 10) || 60,
    });
    setPlanos(atualizado);
    setModalAdicionarVisivel(false);
    setNovoNome('');
  };

  const lidarComSalvarEdicaoExercicio = async () => {
    if (!diaAtual || !exercicioEmEdicao) return;
    const atualizado = await atualizarExercicio(diaAtual.id, exercicioEmEdicao);
    setPlanos(atualizado);
    setModalEditarVisivel(false);
    setExercicioEmEdicao(null);
  };

  const lidarComRemoverExercicio = async (idExercicio: string) => {
    if (!diaAtual) return;
    const atualizado = await removerExercicio(diaAtual.id, idExercicio);
    setPlanos(atualizado);
    setModalEditarVisivel(false);
    setExercicioEmEdicao(null);
  };

  const lidarComTrocarTreinoData = async (idTreino: string) => {
    await definirTreinoEspecialParaData(diaSelecionado, idTreino);
    setIdTreinoEspecial(idTreino);
    setModalTrocarTreinoVisivel(false);
  };

  return (
    <View style={estilos.container}>
      <ScrollView
        contentContainerStyle={estilos.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Bar Limpa ────────────────────────────────────── */}
        <View style={estilos.topBar}>
          {/* O título "Treino" agora é o título grande do header nativo. */}
          <View />

          <View style={estilos.topBarDireita}>
            <View style={estilos.streakBadge}>
              <SymbolView
                name="bolt.fill"
                size={14}
                tintColor={cores.destaqueTexto}
                weight="regular"
              />
              <Text style={estilos.streakTexto}>1</Text>
            </View>
          </View>
        </View>

        {/* ── Segmented Control: Registrado x Planejado ── */}
        <View style={estilos.segmentControlContainer}>
          <TouchableOpacity
            style={[estilos.segmentTab, abaModo === 'registrado' && estilos.segmentTabAtiva]}
            onPress={() => setAbaModo('registrado')}
          >
            <Text style={[estilos.segmentTxt, abaModo === 'registrado' && estilos.segmentTxtAtivo]}>
              Registrado
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[estilos.segmentTab, abaModo === 'planejado' && estilos.segmentTabAtiva]}
            onPress={() => setAbaModo('planejado')}
          >
            <Text style={[estilos.segmentTxt, abaModo === 'planejado' && estilos.segmentTxtAtivo]}>
              Planejado
            </Text>
          </TouchableOpacity>
        </View>

        {abaModo === 'planejado' ? (
          /* ── ABA PLANEJADO: Cronograma Semanal & Guia Flexível ── */
          <View style={{ gap: 16 }}>
            {/* Banner Resumo de Progresso */}
            <CardVidro semBorda estilo={estilos.bannerResumoPlanejado}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <SymbolView name="flag.checkered" size={20} tintColor={cores.destaque} />
                <View style={{ flex: 1 }}>
                  <Text style={estilos.txtBannerTitulo}>
                    {estatisticas?.diasTreinados || 0} de {estatisticas?.metaDiasTreino || 0}{' '}
                    treinos concluídos
                  </Text>
                  <Text style={estilos.txtBannerSub}>
                    {estatisticas?.exerciciosRealizados || 0} de {estatisticas?.metaExercicios || 0}{' '}
                    exercícios executados nesta semana
                  </Text>
                </View>
              </View>
            </CardVidro>

            {/* Ação: Reformular Semana Completa */}
            <TouchableOpacity
              style={estilos.btnReformularSemana}
              onPress={() => setModalDefinirSemanaVisivel(true)}
              activeOpacity={0.8}
            >
              <SymbolView
                name="arrow.triangle.2.circlepath"
                size={16}
                tintColor={cores.textoSobreDestaque}
                weight="regular"
              />
              <Text style={estilos.txtReformularSemana}>Reformular Semana Completa</Text>
            </TouchableOpacity>

            {/* Cronograma dos 7 Dias da Semana */}
            <Text style={estilos.secaoTitulo}>Cronograma dos 7 Dias</Text>

            {[
              { abrev: 'seg', nome: 'Segunda-feira' },
              { abrev: 'ter', nome: 'Terça-feira' },
              { abrev: 'qua', nome: 'Quarta-feira' },
              { abrev: 'qui', nome: 'Quinta-feira' },
              { abrev: 'sex', nome: 'Sexta-feira' },
              { abrev: 'sáb', nome: 'Sábado' },
              { abrev: 'dom', nome: 'Domingo' },
            ].map((diaItem) => {
              const idTr = mapeamentoSemanal[diaItem.abrev];
              const tObj = planos.find((p) => p.id === idTr);
              const expandido = !!diasExpandidos[diaItem.abrev];

              return (
                <CardVidro key={diaItem.abrev} semBorda estilo={estilos.cardItemCronograma}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => alternarExpansaoDia(diaItem.abrev)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={estilos.txtDiaSemanaNome}>{diaItem.nome}</Text>
                        <SymbolView
                          name={expandido ? 'chevron.up' : 'chevron.down'}
                          size={12}
                          tintColor={cores.destaque}
                        />
                      </View>
                      <Text style={estilos.txtFocoAlocado}>{tObj ? tObj.foco : 'Descanso'}</Text>
                      <Text style={estilos.txtQtdExAlocado}>
                        {tObj && tObj.exercicios
                          ? `${tObj.exercicios.length} exercícios (toque para expandir)`
                          : 'Recuperação ativa'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={estilos.btnAlterarDiaPlanejado}
                      onPress={() => {
                        setDiaEmTrocaConfig(diaItem.abrev);
                        setModalSeletorTreinoVisivel(true);
                      }}
                    >
                      <Text style={estilos.txtAlterarDiaPlanejado}>Alterar</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {expandido && tObj && tObj.exercicios && tObj.exercicios.length > 0 && (
                    <View style={estilos.containerExerciciosExpandidos}>
                      {tObj.exercicios.map((ex, idx) => (
                        <View key={ex.id || idx} style={estilos.itemExercicioExpandido}>
                          <Text style={estilos.numExExpandido}>
                            {String(idx + 1).padStart(2, '0')}
                          </Text>
                          <View style={{ flex: 1 }}>
                            <Text style={estilos.nomeExExpandido}>{ex.nome}</Text>
                            <Text style={estilos.subExExpandido}>
                              {ex.series} séries × {descreverSerie(ex.cargaKg, ex.repeticoes)}
                            </Text>
                          </View>
                          <Text style={estilos.badgeGrupoExpandido}>{ex.grupoMuscular}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </CardVidro>
              );
            })}
          </View>
        ) : (
          /* ── ABA REGISTRADO: Execução & Histórico Diário ── */
          <>
            {/* Indicador de Divergência se o treino atual for diferente do planejado */}
            {idTreinoEspecial && idTreinoEspecial !== idTreinoPredefinido && (
              <View style={estilos.badgeDivergenciaContainer}>
                <SymbolView name="sparkles" size={14} tintColor={cores.destaque} />
                <Text style={estilos.txtDivergencia}>Diferente do planejado inicial</Text>
              </View>
            )}

            {/* ── Tira da semana, resumo do plano e grade de treinos (mockup v1) ── */}
            <TiraSemana
              dataSelecionada={diaSelecionado}
              aoSelecionar={setDiaSelecionado}
              marcas={marcasSemana}
            />
            <CardResumoPlano
              feitos={estatisticas?.diasTreinados ?? 0}
              meta={estatisticas?.metaDiasTreino ?? 0}
            />
            <GradeTreinos
              treinos={planos.map((p) => ({
                id: p.id,
                foco: p.foco,
                totalExercicios: p.exercicios.length,
              }))}
              aoAbrir={(treinoId) =>
                router.push({ pathname: '/(tabs)/treino/[treinoId]', params: { treinoId } })
              }
            />

            {/* ── Card do Foco do Dia ── */}
            <CardVidro semBorda estilo={estilos.cardDiaHeader}>
              <View style={estilos.rowDiaHeader}>
                <View style={estilos.iconeFocoContainer}>
                  <SymbolView
                    name={temTreino ? 'dumbbell.fill' : 'dumbbell'}
                    size={18}
                    tintColor={temTreino ? cores.destaque : cores.textoSecundario}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={estilos.diaFoco}>{diaAtual ? diaAtual.foco : 'Recuperação'}</Text>
                  <Text style={estilos.diaDetalhes}>
                    {temTreino
                      ? `${diaAtual.exercicios.length} exercícios programados`
                      : 'Descanso ativo'}
                  </Text>
                  {registroDoDia?.concluido && registroDoDia.kcalEstimadas != null ? (
                    <Text style={estilos.diaDetalhes}>
                      {`Feito em ${registroDoDia.duracaoMinutos} min · ${formatarKcalEstimada(registroDoDia.kcalEstimadas)}`}
                    </Text>
                  ) : null}
                </View>

                {/* Botão de Trocar Treino */}
                <TouchableOpacity
                  style={estilos.btnTrocarTreino}
                  onPress={() => setModalTrocarTreinoVisivel(true)}
                >
                  <SymbolView
                    name="arrow.triangle.2.circlepath"
                    size={14}
                    tintColor={cores.destaque}
                    weight="regular"
                  />
                  <Text style={estilos.txtTrocarTreino}>Trocar</Text>
                </TouchableOpacity>
              </View>
            </CardVidro>

            {/* ── Lista de Exercícios ── */}
            {temTreino ? (
              <>
                <Text style={estilos.secaoTitulo}>Exercícios do Dia</Text>

                {diaAtual.exercicios.map((ex, i) => {
                  const seriesHistorico = historicoSeriesMapa[ex.id] || {};
                  const numSeriesArray = Array.from({ length: ex.series }, (_, idx) => idx + 1);

                  return (
                    <CardVidro key={ex.id} semBorda estilo={estilos.cardExercicioSemBorda}>
                      <TouchableOpacity
                        onPress={() => {
                          setExercicioEmEdicao(ex);
                          setModalEditarVisivel(true);
                        }}
                        activeOpacity={0.7}
                        style={estilos.rowExercicioTopo}
                      >
                        <View style={estilos.ordemContainer}>
                          <Text style={estilos.ordemTexto}>{String(i + 1).padStart(2, '0')}</Text>
                        </View>

                        <View style={estilos.colExercicio}>
                          <Text style={estilos.exNome}>{ex.nome}</Text>
                          <Text style={estilos.exSub}>
                            {ex.series} séries · {String(ex.repeticoes || '—')} reps ·{' '}
                            {ex.tempoDescansoSegundos || 60}s descanso
                          </Text>
                        </View>

                        <View style={estilos.badgeGrupo}>
                          <Text style={estilos.textoBadgeGrupo}>{ex.grupoMuscular}</Text>
                        </View>
                      </TouchableOpacity>

                      <View style={estilos.containerLinhasSeries}>
                        {numSeriesArray.map((nSerie) => {
                          const reg = seriesHistorico[nSerie];
                          const cargaExibir = reg ? reg.cargaKg : ex.cargaKg;
                          const repsExibir = reg ? reg.repeticoes : ex.repeticoes;

                          return (
                            <View key={nSerie} style={estilos.linhaSerieItem}>
                              <Text style={estilos.txtNumeroSerie}>Série {nSerie}</Text>
                              <View style={estilos.linhaDivisoraPontilhada} />
                              <Text style={estilos.txtValoresSerie}>
                                {descreverSerie(cargaExibir, repsExibir)}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </CardVidro>
                  );
                })}

                <BotaoPrimario
                  texto="Iniciar Treino ao Vivo"
                  // O treino mostrado (dia escolhido ou troca), não sempre o de hoje.
                  aoPresionar={() =>
                    router.push({ pathname: '/treino-ao-vivo', params: { treinoId: diaAtual.id } })
                  }
                  estilo={estilos.botaoIniciar}
                />
              </>
            ) : (
              <View style={estilos.containerVazio}>
                <Text style={estilos.textoVazioTitulo}>Dia de Descanso</Text>
                <Text style={estilos.textoVazioSub}>Recuperação ativa muscular</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* ── FAB Primário Amarelo: Abre Menu Flutuante ── */}
      <TouchableOpacity
        style={estilos.fabAmarelo}
        onPress={() => setMenuTreinoVisivel(true)}
        activeOpacity={0.85}
      >
        <View style={estilos.fabInnerAmarelo}>
          <SymbolView name="plus" size={26} tintColor={cores.texto} weight="regular" />
        </View>
      </TouchableOpacity>

      {/* ── Menu Flutuante de Opções ──────────────────────────── */}
      <Modal visible={menuTreinoVisivel} animationType="fade" transparent statusBarTranslucent>
        <TouchableOpacity
          style={estilos.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuTreinoVisivel(false)}
        />
        <BlurView
          intensity={90}
          tint={escuro ? 'dark' : 'light'}
          style={estilos.menuSheetContainer}
        >
          <View style={estilos.modalHandle} />
          <Text style={estilos.modalTitulo}>Opções de Treino</Text>

          <TouchableOpacity
            style={estilos.itemMenuOpcao}
            onPress={() => {
              setMenuTreinoVisivel(false);
              setModalCriarNovoTreinoVisivel(true);
            }}
            activeOpacity={0.7}
          >
            <View style={estilos.iconeMenuOpcao}>
              <SymbolView name="plus.circle.fill" size={20} tintColor={cores.destaque} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={estilos.tituloMenuOpcao}>Criar novo treino</Text>
              <Text style={estilos.subtituloMenuOpcao}>
                Nomear treino e adicionar exercícios no mesmo fluxo
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={estilos.itemMenuOpcao}
            onPress={() => {
              setMenuTreinoVisivel(false);
              setModalMeusTreinosVisivel(true);
            }}
            activeOpacity={0.7}
          >
            <View style={estilos.iconeMenuOpcao}>
              <SymbolView name="dumbbell.fill" size={20} tintColor={cores.destaqueTexto} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={estilos.tituloMenuOpcao}>Meus treinos</Text>
              <Text style={estilos.subtituloMenuOpcao}>Lista de todos os treinos criados</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={estilos.itemMenuOpcao}
            onPress={() => {
              setMenuTreinoVisivel(false);
              setModalDefinirSemanaVisivel(true);
            }}
            activeOpacity={0.7}
          >
            <View style={estilos.iconeMenuOpcao}>
              <SymbolView name="calendar" size={20} tintColor={cores.destaqueTexto} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={estilos.tituloMenuOpcao}>Definir treino da semana</Text>
              <Text style={estilos.subtituloMenuOpcao}>
                Predefinir treino para cada dia da semana
              </Text>
            </View>
          </TouchableOpacity>
        </BlurView>
      </Modal>

      {/* ── Modal Criar Novo Treino em ÚNICA TELA (Rodada 3 — Ajuste 1) ── */}
      <Modal
        visible={modalCriarNovoTreinoVisivel}
        animationType="slide"
        transparent
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={estilos.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalCriarNovoTreinoVisivel(false)}
          />
          <BlurView intensity={80} tint={escuro ? 'dark' : 'light'} style={estilos.modalCard}>
            <View style={estilos.modalHandle} />
            <Text style={estilos.modalTitulo}>Criar Novo Treino</Text>

            <Text style={estilos.labelForm}>Nome / Foco do Treino:</Text>
            <TextInput
              style={estilos.input}
              placeholder="Ex: Treino D - Ombros & Trapézio"
              placeholderTextColor={cores.textoSecundario}
              value={novoFocoTreino}
              onChangeText={setNovoFocoTreino}
            />

            <Text style={estilos.labelForm}>Buscar por Grupo Muscular ou Nome (ExerciseDB):</Text>
            {/* Carrossel de Grupos Musculares */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 10 }}
            >
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {GRUPOS_MUSCULARES.map((grupo) => (
                  <TouchableOpacity
                    key={grupo}
                    onPress={() => setGrupoMuscularFiltro(grupo)}
                    style={[
                      {
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: Raio.md,
                        backgroundColor: cores.destaqueSuave,
                      },
                      grupoMuscularFiltro === grupo && { backgroundColor: cores.destaque },
                    ]}
                  >
                    <Text
                      style={[
                        {
                          fontSize: Fonte.micro,
                          color: cores.textoSecundario,
                          fontFamily: FamiliaFonte.bold,
                        },
                        grupoMuscularFiltro === grupo && { color: cores.textoSobreDestaque },
                      ]}
                    >
                      {grupo}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TextInput
              style={estilos.input}
              placeholder="Digite o nome do exercício (ex: Supino, Rosca...)"
              placeholderTextColor={cores.textoSecundario}
              value={nomeExTemp}
              onChangeText={setNomeExTemp}
            />

            {/* Sugestões de Exercícios com Imagem / GIF do ExerciseDB */}
            {sugestoesExercicios.length > 0 && (
              <ScrollView style={{ maxHeight: 160, marginBottom: 12 }}>
                {sugestoesExercicios.map((ex) => (
                  <TouchableOpacity
                    key={ex.id || ex.id_externo || ex.nome}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      padding: 8,
                      backgroundColor: cores.destaqueSuave,
                      borderRadius: 10,
                      marginBottom: 6,
                    }}
                    onPress={() => {
                      setNomeExTemp(ex.nome);
                      setGrupoExTemp(ex.grupo_primario || 'Geral');
                    }}
                  >
                    {ex.gif_url ? (
                      <Image
                        source={{ uri: ex.gif_url }}
                        style={{ width: 36, height: 36, borderRadius: 6 }}
                      />
                    ) : (
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 6,
                          backgroundColor: cores.destaqueSuave,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <SymbolView
                          name="figure.cross.training"
                          size={18}
                          tintColor={cores.destaque}
                        />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: FamiliaFonte.bold,
                          fontSize: Tipografia.rodape,
                          color: cores.texto,
                        }}
                      >
                        {ex.nome}
                      </Text>
                      <Text
                        style={{
                          fontFamily: FamiliaFonte.regular,
                          fontSize: Fonte.micro,
                          color: cores.textoSecundario,
                        }}
                      >
                        {ex.grupo_primario} · {ex.equipamento || 'Livre'}
                      </Text>
                    </View>
                    <SymbolView name="plus.circle.fill" size={18} tintColor={cores.destaque} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={estilos.rowInputs}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: FamiliaFonte.regular,
                    fontSize: Fonte.micro,
                    color: cores.textoSecundario,
                    marginBottom: 4,
                  }}
                >
                  Séries
                </Text>
                <TextInput
                  style={estilos.input}
                  placeholder="ex: 4"
                  placeholderTextColor={cores.textoSecundario}
                  keyboardType="numeric"
                  value={seriesExTemp}
                  onChangeText={setSeriesExTemp}
                />
              </View>

              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text
                  style={{
                    fontFamily: FamiliaFonte.regular,
                    fontSize: Fonte.micro,
                    color: cores.textoSecundario,
                    marginBottom: 4,
                  }}
                >
                  Reps
                </Text>
                <TextInput
                  style={estilos.input}
                  placeholder="ex: 10"
                  placeholderTextColor={cores.textoSecundario}
                  keyboardType="numeric"
                  value={repsExTemp}
                  onChangeText={setRepsExTemp}
                />
              </View>

              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text
                  style={{
                    fontFamily: FamiliaFonte.regular,
                    fontSize: Fonte.micro,
                    color: cores.textoSecundario,
                    marginBottom: 4,
                  }}
                >
                  Carga (kg)
                </Text>
                <TextInput
                  style={estilos.input}
                  placeholder="ex: 20"
                  placeholderTextColor={cores.textoSecundario}
                  keyboardType="numeric"
                  value={cargaExTemp}
                  onChangeText={setCargaExTemp}
                />
              </View>

              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text
                  style={{
                    fontFamily: FamiliaFonte.regular,
                    fontSize: Fonte.micro,
                    color: cores.textoSecundario,
                    marginBottom: 4,
                  }}
                >
                  Descanso (s)
                </Text>
                <TextInput
                  style={estilos.input}
                  placeholder="ex: 60"
                  placeholderTextColor={cores.textoSecundario}
                  keyboardType="numeric"
                  value={descansoExTemp}
                  onChangeText={setDescansoExTemp}
                />
              </View>
            </View>

            <TouchableOpacity
              style={estilos.btnAddExTemp}
              onPress={adicionarExercicioTempAoNovoTreino}
            >
              <SymbolView
                name="plus"
                size={14}
                tintColor={cores.textoSobreDestaque}
                weight="regular"
              />
              <Text style={estilos.txtAddExTemp}>Incluir Exercício</Text>
            </TouchableOpacity>

            {exerciciosTempNovoTreino.length > 0 ? (
              <View style={estilos.boxAlimentosTemp}>
                <Text style={estilos.txtItensAdicionadosHeader}>
                  Exercícios adicionados ({exerciciosTempNovoTreino.length}):
                </Text>
                {exerciciosTempNovoTreino.map((ex) => (
                  <View key={ex.id} style={estilos.itemTempRow}>
                    <Text style={estilos.itemTempNome}>
                      {ex.nome} ({ex.series}x{ex.repeticoes} · {ex.cargaKg}kg ·{' '}
                      {ex.tempoDescansoSegundos}s)
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        setExerciciosTempNovoTreino((prev) => prev.filter((i) => i.id !== ex.id))
                      }
                    >
                      <SymbolView name="trash" size={12} tintColor={cores.erro} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={estilos.modalAcoes}>
              <TouchableOpacity
                onPress={() => setModalCriarNovoTreinoVisivel(false)}
                style={estilos.btnCancelar}
              >
                <Text style={estilos.txtCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={lidarComCriarNovoTreino} style={estilos.btnSalvar}>
                <Text style={estilos.txtSalvar}>Salvar Treino Completo</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Modal Meus Treinos (Permite Excluir Treinos Criados) ── */}
      <Modal
        visible={modalMeusTreinosVisivel}
        animationType="slide"
        transparent
        statusBarTranslucent
      >
        <TouchableOpacity
          style={estilos.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalMeusTreinosVisivel(false)}
        />
        <BlurView intensity={80} tint={escuro ? 'dark' : 'light'} style={estilos.modalCard}>
          <View style={estilos.modalHandle} />
          <Text style={estilos.modalTitulo}>Meus Treinos Criados</Text>

          {planos.map((p) => (
            <View key={p.id} style={estilos.itemTrocaTreino}>
              <View style={{ flex: 1 }}>
                <Text style={estilos.nomeTrocaTreino}>{p.foco}</Text>
                <Text style={estilos.subTrocaTreino}>
                  {p.exercicios.length} exercícios cadastrados
                </Text>
              </View>

              <TouchableOpacity
                style={{ padding: 8 }}
                onPress={async () => {
                  const novos = planos.filter((item) => item.id !== p.id);
                  setPlanos(novos);
                  await salvarPlanoTreinoCustomizado(novos);
                }}
              >
                <SymbolView name="trash" size={16} tintColor={cores.erro} />
              </TouchableOpacity>
            </View>
          ))}

          <View style={estilos.modalAcoes}>
            <TouchableOpacity
              onPress={() => setModalMeusTreinosVisivel(false)}
              style={estilos.btnSalvar}
            >
              <Text style={estilos.txtSalvar}>Concluído</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>

      {/* ── Modal Definir Treino da Semana ──────────────────── */}
      <Modal
        visible={modalDefinirSemanaVisivel}
        animationType="slide"
        transparent
        statusBarTranslucent
      >
        <TouchableOpacity
          style={estilos.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalDefinirSemanaVisivel(false)}
        />
        <BlurView intensity={80} tint={escuro ? 'dark' : 'light'} style={estilos.modalCard}>
          <View style={estilos.modalHandle} />
          <Text style={estilos.modalTitulo}>Definir Treino da Semana</Text>
          <Text style={estilos.subtituloModal}>Escolha qual treino será feito em cada dia:</Text>

          {['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'].map((abrev) => {
            const idAtual = mapeamentoSemanal[abrev];
            const treinoAtualMap =
              idAtual === 'descanso' ? null : planos.find((p) => p.id === idAtual);

            return (
              <View key={abrev} style={estilos.rowSemanaConfig}>
                <Text style={estilos.txtSemanaDia}>{abrev.toUpperCase()}</Text>

                <TouchableOpacity
                  style={estilos.btnSelectSemana}
                  onPress={() => {
                    setDiaEmTrocaConfig(abrev);
                    setModalSeletorTreinoVisivel(true);
                  }}
                >
                  <Text style={estilos.txtSelectSemanaVal}>
                    {idAtual === 'descanso'
                      ? 'Descanso (Sem Treino)'
                      : treinoAtualMap
                        ? treinoAtualMap.foco
                        : 'Selecione'}
                  </Text>
                  <SymbolView name="chevron.right" size={12} tintColor={cores.destaque} />
                </TouchableOpacity>
              </View>
            );
          })}

          <View style={estilos.modalAcoes}>
            <TouchableOpacity
              onPress={() => setModalDefinirSemanaVisivel(false)}
              style={estilos.btnSalvar}
            >
              <Text style={estilos.txtSalvar}>Salvar Predefinição</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>

      {/* ── Card/Menu Flutuante para Seleção de Treino (Ajuste 3) ── */}
      <Modal
        visible={modalSeletorTreinoVisivel}
        animationType="fade"
        transparent
        statusBarTranslucent
      >
        <TouchableOpacity
          style={estilos.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalSeletorTreinoVisivel(false)}
        />
        <BlurView intensity={90} tint={escuro ? 'dark' : 'light'} style={estilos.modalCard}>
          <View style={estilos.modalHandle} />
          <Text style={estilos.modalTitulo}>
            Selecione o Treino para {diaEmTrocaConfig ? diaEmTrocaConfig.toUpperCase() : 'este dia'}
          </Text>

          <ScrollView style={{ maxHeight: 320, width: '100%', marginVertical: 12 }}>
            {/* Opção 1: Descanso (Dia Sem Treino) */}
            <TouchableOpacity
              style={[estilos.itemTrocaTreino, { backgroundColor: cores.destaqueSuave }]}
              onPress={() => {
                if (diaEmTrocaConfig) {
                  lidarComDefinirDiaSemana(diaEmTrocaConfig, 'descanso');
                }
                setModalSeletorTreinoVisivel(false);
              }}
            >
              <SymbolView
                name="bed.double.fill"
                size={20}
                tintColor={cores.textoSecundario}
                style={{ marginRight: 12 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={estilos.nomeTrocaTreino}>Descanso (Dia Sem Treino)</Text>
                <Text style={estilos.subTrocaTreino}>Dia reservado para recuperação muscular</Text>
              </View>
            </TouchableOpacity>

            {/* Opção 2: Treinos Gerados e Personalizados */}
            <Text
              style={{
                fontFamily: FamiliaFonte.bold,
                fontSize: Fonte.micro,
                color: cores.destaque,
                marginTop: 12,
                marginBottom: 6,
              }}
            >
              TREINOS DISPONÍVEIS:
            </Text>
            {planos.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={estilos.itemTrocaTreino}
                onPress={() => {
                  if (diaEmTrocaConfig) {
                    lidarComDefinirDiaSemana(diaEmTrocaConfig, p.id);
                  } else {
                    lidarComTrocarTreinoData(p.id);
                  }
                  setModalSeletorTreinoVisivel(false);
                }}
              >
                <SymbolView
                  name="dumbbell.fill"
                  size={18}
                  tintColor={cores.destaque}
                  style={{ marginRight: 12 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={estilos.nomeTrocaTreino}>{p.foco}</Text>
                  <Text style={estilos.subTrocaTreino}>{p.exercicios.length} exercícios</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={estilos.modalAcoes}>
            <TouchableOpacity
              onPress={() => setModalSeletorTreinoVisivel(false)}
              style={estilos.btnCancelar}
            >
              <Text style={estilos.txtCancelar}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>

      {/* ── Modal Editar / Excluir Exercício ───────────────── */}
      {exercicioEmEdicao && (
        <Modal visible={modalEditarVisivel} animationType="slide" transparent statusBarTranslucent>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <TouchableOpacity
              style={estilos.modalOverlay}
              activeOpacity={1}
              onPress={() => setModalEditarVisivel(false)}
            />
            <BlurView intensity={80} tint={escuro ? 'dark' : 'light'} style={estilos.modalCard}>
              <View style={estilos.modalHandle} />
              <Text style={estilos.modalTitulo}>Editar Exercício</Text>

              <TextInput
                style={estilos.input}
                value={exercicioEmEdicao.nome}
                onChangeText={(t) => setExercicioEmEdicao({ ...exercicioEmEdicao, nome: t })}
              />

              <View style={estilos.rowInputs}>
                <View style={{ flex: 1 }}>
                  <Text style={estilos.labelInput}>Séries</Text>
                  <TextInput
                    style={estilos.input}
                    keyboardType="numeric"
                    value={String(exercicioEmEdicao.series)}
                    onChangeText={(t) =>
                      setExercicioEmEdicao({ ...exercicioEmEdicao, series: parseInt(t, 10) || 0 })
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={estilos.labelInput}>Reps</Text>
                  <TextInput
                    style={estilos.input}
                    keyboardType="numeric"
                    value={String(exercicioEmEdicao.repeticoes)}
                    onChangeText={(t) =>
                      setExercicioEmEdicao({
                        ...exercicioEmEdicao,
                        repeticoes: parseInt(t, 10) || 0,
                      })
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={estilos.labelInput}>Carga (kg)</Text>
                  <TextInput
                    style={estilos.input}
                    keyboardType="numeric"
                    value={String(exercicioEmEdicao.cargaKg)}
                    onChangeText={(t) =>
                      setExercicioEmEdicao({ ...exercicioEmEdicao, cargaKg: parseFloat(t) || 0 })
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={estilos.labelInput}>Descanso (s)</Text>
                  <TextInput
                    style={estilos.input}
                    keyboardType="numeric"
                    value={String(exercicioEmEdicao.tempoDescansoSegundos || 60)}
                    onChangeText={(t) =>
                      setExercicioEmEdicao({
                        ...exercicioEmEdicao,
                        tempoDescansoSegundos: parseInt(t, 10) || 60,
                      })
                    }
                  />
                </View>
              </View>

              <View style={estilos.modalAcoesSpace}>
                <TouchableOpacity
                  onPress={() => lidarComRemoverExercicio(exercicioEmEdicao.id)}
                  style={estilos.btnExcluir}
                >
                  <Text style={estilos.txtExcluir}>Excluir</Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => setModalEditarVisivel(false)}
                    style={estilos.btnCancelar}
                  >
                    <Text style={estilos.txtCancelar}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={lidarComSalvarEdicaoExercicio}
                    style={estilos.btnSalvar}
                  >
                    <Text style={estilos.txtSalvar}>Salvar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </BlurView>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </View>
  );
}

const criarEstilos = (cores: CoresTema) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: cores.fundo },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: Espacamento.sm, // o título grande fica no header nativo
      paddingBottom: 120,
    },

    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    topBarTitulo: {
      fontFamily: FamiliaFonte.bold,
      fontSize: 20,
      fontWeight: PesoFonte.bold,
      color: cores.texto,
    },
    topBarDireita: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    streakBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: cores.superficie,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: Raio.full,
      borderWidth: 1,
      borderColor: cores.separador,
    },
    streakTexto: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Tipografia.rodape,
      fontWeight: PesoFonte.bold,
      color: cores.texto,
    },

    cardDiaHeader: {
      marginBottom: 24,
      padding: Espacamento.lg,
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
      backgroundColor: cores.elevada,
      alignItems: 'center',
      justifyContent: 'center',
    },
    diaFoco: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.corpo,
      fontWeight: PesoFonte.bold,
      color: cores.texto,
    },
    diaDetalhes: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Tipografia.rodape,
      color: cores.textoSecundario,
      marginTop: 2,
    },
    btnTrocarTreino: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 7,
      backgroundColor: cores.elevada,
      borderRadius: 8,
    },
    txtTrocarTreino: {
      fontFamily: FamiliaFonte.semibold,
      fontSize: Fonte.micro,
      color: cores.destaque,
    },

    secaoTitulo: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.label,
      fontWeight: PesoFonte.bold,
      color: cores.textoSecundario,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: Espacamento.md,
    },

    cardExercicioSemBorda: {
      marginBottom: 16,
      padding: Espacamento.lg,
      borderWidth: 0,
      marginHorizontal: -20,
    },
    rowExercicioTopo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Espacamento.md,
      marginBottom: 12,
    },
    ordemContainer: {
      width: 28,
      alignItems: 'center',
    },
    ordemTexto: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.label,
      fontWeight: PesoFonte.bold,
      color: cores.destaque,
    },
    colExercicio: {
      flex: 1,
    },
    exNome: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Tipografia.subtitulo,
      fontWeight: PesoFonte.bold,
      color: cores.texto,
    },
    exSub: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Fonte.micro,
      color: cores.textoSecundario,
      marginTop: 2,
    },
    badgeGrupo: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: Raio.sm,
      backgroundColor: cores.elevada,
    },
    textoBadgeGrupo: {
      fontFamily: FamiliaFonte.semibold,
      fontSize: Fonte.micro,
      color: cores.textoSecundario,
    },

    // Rodada 3 — Ajuste 1: Estilização da exibição das séries em LINHA
    containerLinhasSeries: {
      backgroundColor: cores.destaqueSuave,
      borderRadius: Raio.md,
      padding: 10,
      gap: 6,
    },
    linhaSerieItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    txtNumeroSerie: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.micro,
      color: cores.textoSecundario,
    },
    linhaDivisoraPontilhada: {
      flex: 1,
      height: 1,
      borderStyle: 'dashed',
      borderWidth: 0.5,
      borderColor: cores.separador,
      marginHorizontal: 8,
    },
    txtValoresSerie: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Tipografia.rodape,
      color: cores.texto,
    },

    botaoIniciar: {
      marginTop: 24,
    },

    containerVazio: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    textoVazioTitulo: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.corpo,
      color: cores.texto,
    },
    textoVazioSub: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Fonte.label,
      color: cores.textoSecundario,
      marginTop: 4,
    },

    // FAB Amarelo
    fabAmarelo: {
      position: 'absolute',
      bottom: 96,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: Raio.lg,
      overflow: 'hidden',
      shadowColor: CoresMacros.carboidrato,
      shadowOpacity: 0.4,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 8,
    },
    fabInnerAmarelo: {
      width: '100%',
      height: '100%',
      backgroundColor: CoresMacros.carboidrato,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Modais e Sheet
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
    modalHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: cores.separador,
      alignSelf: 'center',
      marginBottom: 16,
    },
    menuSheetContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      backgroundColor: cores.elevada,
      borderTopWidth: 1,
      borderColor: cores.separador,
    },
    itemMenuOpcao: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: cores.destaqueSuave,
    },
    iconeMenuOpcao: {
      width: 42,
      height: 42,
      borderRadius: Raio.md,
      backgroundColor: cores.elevada,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tituloMenuOpcao: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.corpo,
      color: cores.texto,
    },
    subtituloMenuOpcao: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Fonte.micro,
      color: cores.textoSecundario,
      marginTop: 2,
    },

    modalCard: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      backgroundColor: cores.elevada,
      borderTopWidth: 1,
      borderColor: cores.separador,
    },
    modalTitulo: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.subtitulo,
      color: cores.texto,
      marginBottom: 12,
    },
    subtituloModal: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Fonte.label,
      color: cores.textoSecundario,
      marginBottom: 16,
    },
    labelForm: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.micro,
      color: cores.textoSecundario,
      marginBottom: 6,
      marginTop: 6,
    },
    btnAddExTemp: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: cores.destaque,
      paddingVertical: 10,
      borderRadius: Raio.md,
      marginBottom: 12,
    },
    txtAddExTemp: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Tipografia.rodape,
      color: cores.textoSobreDestaque,
    },
    boxAlimentosTemp: {
      backgroundColor: cores.elevada,
      padding: 12,
      borderRadius: Raio.md,
      marginBottom: 16,
    },
    txtItensAdicionadosHeader: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.micro,
      color: cores.destaque,
      marginBottom: 6,
    },
    itemTempRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
    },
    itemTempNome: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Fonte.micro,
      color: cores.texto,
    },

    rowSemanaConfig: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: cores.destaqueSuave,
    },
    txtSemanaDia: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.corpo,
      color: cores.texto,
    },
    btnSelectSemana: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: cores.elevada,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: Raio.sm,
    },
    txtSelectSemanaVal: {
      fontFamily: FamiliaFonte.semibold,
      fontSize: Tipografia.rodape,
      color: cores.destaque,
    },

    itemTrocaTreino: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      backgroundColor: cores.elevada,
      borderRadius: Raio.md,
      marginBottom: 10,
    },
    itemTrocaTreinoAtivo: {
      borderWidth: 1,
      borderColor: cores.destaque,
    },
    nomeTrocaTreino: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.corpo,
      color: cores.texto,
    },
    subTrocaTreino: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Fonte.micro,
      color: cores.textoSecundario,
      marginTop: 2,
    },

    input: {
      backgroundColor: cores.elevada,
      borderWidth: 1,
      borderColor: cores.separador,
      borderRadius: Raio.md,
      padding: 12,
      fontSize: Fonte.corpo,
      color: cores.texto,
      fontFamily: FamiliaFonte.regular,
      marginBottom: 12,
    },
    modalInputPesquisa: {
      backgroundColor: cores.elevada,
      borderRadius: Raio.md,
      paddingHorizontal: 16,
      paddingVertical: 12,
      color: cores.texto,
      fontFamily: FamiliaFonte.regular,
      fontSize: Fonte.corpo,
      borderWidth: 1,
      borderColor: cores.separador,
      marginBottom: 12,
    },
    segmentControlContainer: {
      flexDirection: 'row',
      backgroundColor: cores.elevada,
      borderRadius: Raio.md,
      padding: 4,
      marginBottom: 16,
    },
    segmentTab: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: Raio.sm,
    },
    segmentTabAtiva: {
      backgroundColor: cores.destaque,
    },
    segmentTxt: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.label,
      color: cores.textoSecundario,
    },
    segmentTxtAtivo: {
      color: cores.textoSobreDestaque,
    },
    bannerResumoPlanejado: {
      padding: 14,
      backgroundColor: 'rgba(234, 179, 8, 0.08)',
      borderColor: 'rgba(234, 179, 8, 0.2)',
      borderWidth: 1,
    },
    txtBannerTitulo: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.label,
      color: cores.texto,
    },
    txtBannerSub: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Fonte.micro,
      color: cores.textoSecundario,
      marginTop: 2,
    },
    btnReformularSemana: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: cores.destaque,
      paddingVertical: 12,
      borderRadius: Raio.md,
    },
    txtReformularSemana: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.label,
      color: cores.textoSobreDestaque,
    },
    cardItemCronograma: {
      padding: 14,
      marginBottom: 10,
    },
    txtDiaSemanaNome: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.label,
      color: cores.destaque,
    },
    txtFocoAlocado: {
      fontFamily: FamiliaFonte.semibold,
      fontSize: Tipografia.subtitulo,
      color: cores.texto,
      marginTop: 2,
    },
    txtQtdExAlocado: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Fonte.micro,
      color: cores.textoSecundario,
      marginTop: 2,
    },
    btnAlterarDiaPlanejado: {
      backgroundColor: cores.elevada,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: Raio.sm,
      borderWidth: 1,
      borderColor: cores.separador,
    },
    txtAlterarDiaPlanejado: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.micro,
      color: cores.texto,
    },
    badgeDivergenciaContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(234, 179, 8, 0.12)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: Raio.full,
      alignSelf: 'flex-start',
      marginBottom: 12,
    },
    txtDivergencia: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.micro,
      color: cores.destaque,
    },
    containerExerciciosExpandidos: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: cores.destaqueSuave,
      gap: 8,
    },
    itemExercicioExpandido: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: cores.elevada,
      padding: 10,
      borderRadius: Raio.sm,
    },
    numExExpandido: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.micro,
      color: cores.destaque,
    },
    nomeExExpandido: {
      fontFamily: FamiliaFonte.semibold,
      fontSize: Tipografia.rodape,
      color: cores.texto,
    },
    subExExpandido: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Fonte.micro,
      color: cores.textoSecundario,
      marginTop: 1,
    },
    badgeGrupoExpandido: {
      fontFamily: FamiliaFonte.bold,
      fontSize: 10,
      color: cores.textoSecundario,
      backgroundColor: cores.destaqueSuave,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
    },
    labelInput: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Fonte.micro,
      color: cores.textoSecundario,
      marginBottom: 4,
    },
    rowInputs: {
      flexDirection: 'row',
      gap: 6,
    },
    modalAcoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 },
    modalAcoesSpace: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12,
    },
    btnCancelar: { paddingVertical: 10, paddingHorizontal: 16 },
    txtCancelar: {
      fontFamily: FamiliaFonte.semibold,
      color: cores.textoSecundario,
      fontSize: Fonte.corpo,
    },
    btnSalvar: {
      backgroundColor: cores.destaque,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: Raio.md,
    },
    txtSalvar: {
      fontFamily: FamiliaFonte.bold,
      color: cores.textoSobreDestaque,
      fontSize: Fonte.corpo,
    },
    btnExcluir: { paddingVertical: 10, paddingHorizontal: 16 },
    txtExcluir: { fontFamily: FamiliaFonte.semibold, color: cores.erro, fontSize: Fonte.corpo },
  });
