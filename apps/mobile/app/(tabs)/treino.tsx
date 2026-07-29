// ============================================================
// TELA: Módulo de Treino (app/(tabs)/treino.tsx)
// ============================================================
// Clean Dark UI.
// Rodada 3 — Ajuste 1:
// 1. Criação de treino em fluxo único (Nome do treino + Exercícios/Séries/Descanso na mesma tela)
// 2. Visualização das séries em LINHA (uma linha por série: Carga x Repetições)
// 3. Removido o botão '+' do card do dia (mantido apenas botão 'Trocar')
// ============================================================

import React, { useState, useEffect } from 'react';
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
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { BlurView } from 'expo-blur';
import { CardVidro, BotaoPrimario } from '../../componentes/ui';
import { Cores, Espacamento, FamiliaFonte, Fonte, PesoFonte, Raio } from '../../constantes/Cores';
import { supabase } from '../../servicos/supabase';
import {
  obterPlanoTreinoCustomizado,
  salvarPlanoTreinoCustomizado,
  adicionarExercicioAoDia,
  atualizarExercicio,
  removerExercicio,
  definirTreinoEspecialParaData,
  obterTreinoEspecialParaData,
  obterMapeamentoSemanal,
  salvarMapeamentoSemanal,
  DiaTreinoCustomizado,
  ExercicioCustomizado,
} from '../../servicos/planoGestaoServico';
import { obterSeriesUltimaExecucao } from '../../servicos/progressoServico';

const DIAS_SEMANA_CARROSSEL = [
  { abrev: 'dom', diaNum: '26', data: '2026-07-26' },
  { abrev: 'seg', diaNum: '27', data: '2026-07-27' },
  { abrev: 'ter', diaNum: '28', data: '2026-07-28' },
  { abrev: 'qua', diaNum: '29', data: '2026-07-29' },
  { abrev: 'qui', diaNum: '30', data: '2026-07-30' },
  { abrev: 'sex', diaNum: '31', data: '2026-07-31' },
  { abrev: 'sáb', diaNum: '01', data: '2026-08-01' },
];

export default function TelaTreino() {
  const router = useRouter();
  const [diaSelecionado, setDiaSelecionado] = useState('2026-07-27');
  const [planos, setPlanos] = useState<DiaTreinoCustomizado[]>([]);
  const [mapeamentoSemanal, setMapeamentoSemanal] = useState<Record<string, string>>({});
  const [idTreinoEspecial, setIdTreinoEspecial] = useState<string | null>(null);

  // Rodada 3 — Ajuste 1: Mapa do histórico de cada série por exercício (ex: { 'ex-1': { 1: {carga: 60, reps: 10} } })
  const [historicoSeriesMapa, setHistoricoSeriesMapa] = useState<Record<string, Record<number, { cargaKg: number; repeticoes: number }>>>({});

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
  const [exerciciosTempNovoTreino, setExerciciosTempNovoTreino] = useState<ExercicioCustomizado[]>([]);
  const [nomeExTemp, setNomeExTemp] = useState('');
  const [grupoExTemp, setGrupoExTemp] = useState('Peito');
  const [seriesExTemp, setSeriesExTemp] = useState('4');
  const [repsExTemp, setRepsExTemp] = useState('10');
  const [cargaExTemp, setCargaExTemp] = useState('60');
  const [descansoExTemp, setDescansoExTemp] = useState('60');

  // Autocomplete ExerciseDB & Navegação por Grupo Muscular (Rodada 5 — Ajuste 5)
  const [sugestoesExercicios, setSugestoesExercicios] = useState<any[]>([]);
  const [grupoMuscularFiltro, setGrupoMuscularFiltro] = useState<string>('Todos');
  const GRUPOS_MUSCULARES = ['Todos', 'Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Core', 'Cardio'];

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

  useEffect(() => {
    carregarPlanos();
  }, [diaSelecionado]);

  const carregarPlanos = async () => {
    const dados = await obterPlanoTreinoCustomizado();
    setPlanos(dados);

    const mapSemana = await obterMapeamentoSemanal();
    setMapeamentoSemanal(mapSemana);

    const especial = await obterTreinoEspecialParaData(diaSelecionado);
    setIdTreinoEspecial(especial);

    // Rodada 3 — Ajuste 1: Carrega histórico por série de cada exercício
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
  };

  const itemCarrossel = DIAS_SEMANA_CARROSSEL.find(d => d.data === diaSelecionado);
  const abrevDia = itemCarrossel ? itemCarrossel.abrev : 'seg';

  const idTreinoPredefinido = mapeamentoSemanal[abrevDia];
  const treinoDefaultSemanal = planos.find(p => p.id === idTreinoPredefinido) || planos[0];
  const diaAtual = idTreinoEspecial ? planos.find(p => p.id === idTreinoEspecial) || treinoDefaultSemanal : treinoDefaultSemanal;

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
    setExerciciosTempNovoTreino(prev => [...prev, novoEx]);
    setNomeExTemp('');
  };

  // Rodada 3 — Ajuste 1: Salva o novo treino completo (Nome + Exercícios/Séries/Descanso numa tela só)
  const lidarComCriarNovoTreino = async () => {
    if (!novoFocoTreino.trim()) return;
    const novoTreino: DiaTreinoCustomizado = {
      id: `dia-${Date.now()}`,
      diaSemana: 'Personalizado',
      foco: novoFocoTreino,
      exercicios: exerciciosTempNovoTreino.length > 0 ? exerciciosTempNovoTreino : [
        { id: `ex-${Date.now()}`, nome: 'Supino Reto com Barra', grupoMuscular: 'Peito', series: 4, repeticoes: 10, cargaKg: 60, tempoDescansoSegundos: 90 },
      ],
    };
    const atualizados = [...planos, novoTreino];
    setPlanos(atualizados);
    await salvarPlanoTreinoCustomizado(atualizados);
    setNovoFocoTreino('');
    setExerciciosTempNovoTreino([]);
    setModalCriarNovoTreinoVisivel(false);
  };

  const lidarComDefinirDiaSemana = async (abrev: string, idTreino: string) => {
    const novoMap = { ...mapeamentoSemanal, [abrev]: idTreino };
    setMapeamentoSemanal(novoMap);
    await salvarMapeamentoSemanal(novoMap);
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
      <ScrollView contentContainerStyle={estilos.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Top Bar Limpa ────────────────────────────────────── */}
        <View style={estilos.topBar}>
          <Text style={estilos.topBarTitulo}>Treino</Text>

          <View style={estilos.topBarDireita}>
            <View style={estilos.streakBadge}>
              <SymbolView name="bolt.fill" size={14} tintColor="#EAB308" weight="bold" />
              <Text style={estilos.streakTexto}>1</Text>
            </View>
          </View>
        </View>

        {/* ── Carrossel Semanal de Dias ─────────────────────── */}
        <View style={estilos.carrosselContainer}>
          {DIAS_SEMANA_CARROSSEL.map((dia) => {
            const sel = dia.data === diaSelecionado;
            return (
              <TouchableOpacity
                key={dia.data}
                onPress={() => setDiaSelecionado(dia.data)}
                activeOpacity={0.7}
                style={estilos.itemDia}
              >
                <Text style={[estilos.diaAbrev, sel && estilos.diaAbrevSelecionado]}>
                  {dia.abrev}
                </Text>
                <Text style={[estilos.diaNum, sel && estilos.diaNumSelecionado]}>
                  {dia.diaNum}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Card do Foco do Dia (Rodada 3 — Ajuste 1: Mantido APENAS botão 'Trocar', removido '+') ── */}
        <CardVidro semBorda estilo={estilos.cardDiaHeader}>
          <View style={estilos.rowDiaHeader}>
            <View style={estilos.iconeFocoContainer}>
              <SymbolView
                name={temTreino ? 'dumbbell.fill' : 'dumbbell'}
                size={18}
                tintColor={temTreino ? Cores.accent : Cores.texto.desabilitado}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={estilos.diaFoco}>{diaAtual ? diaAtual.foco : 'Recuperação'}</Text>
              <Text style={estilos.diaDetalhes}>
                {temTreino ? `${diaAtual.exercicios.length} exercícios programados` : 'Descanso ativo'}
              </Text>
            </View>

            {/* Botão de Trocar Treino */}
            <TouchableOpacity
              style={estilos.btnTrocarTreino}
              onPress={() => setModalTrocarTreinoVisivel(true)}
            >
              <SymbolView name="arrow.triangle.2.circlepath" size={14} tintColor={Cores.accent} weight="bold" />
              <Text style={estilos.txtTrocarTreino}>Trocar</Text>
            </TouchableOpacity>
          </View>
        </CardVidro>

        {/* ── Lista de Exercícios com Visualização por Série em LINHA (Ajuste 1) ── */}
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
                        {ex.series} séries · {ex.repeticoes} reps · {ex.tempoDescansoSegundos || 60}s descanso
                      </Text>
                    </View>

                    <View style={estilos.badgeGrupo}>
                      <Text style={estilos.textoBadgeGrupo}>{ex.grupoMuscular}</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Rodada 3 — Ajuste 1: Exibição das séries em LINHA (uma por linha com Carga x Reps) */}
                  <View style={estilos.containerLinhasSeries}>
                    {numSeriesArray.map(nSerie => {
                      const reg = seriesHistorico[nSerie];
                      const cargaExibir = reg ? reg.cargaKg : ex.cargaKg;
                      const repsExibir = reg ? reg.repeticoes : ex.repeticoes;

                      return (
                        <View key={nSerie} style={estilos.linhaSerieItem}>
                          <Text style={estilos.txtNumeroSerie}>Série {nSerie}</Text>
                          <View style={estilos.linhaDivisoraPontilhada} />
                          <Text style={estilos.txtValoresSerie}>{cargaExibir} kg  ×  {repsExibir} reps</Text>
                        </View>
                      );
                    })}
                  </View>
                </CardVidro>
              );
            })}

            <BotaoPrimario
              texto="Iniciar Treino ao Vivo"
              aoPresionar={() => router.push('/treino-ao-vivo')}
              estilo={estilos.botaoIniciar}
            />
          </>
        ) : (
          <View style={estilos.containerVazio}>
            <Text style={estilos.textoVazioTitulo}>Dia de Descanso</Text>
            <Text style={estilos.textoVazioSub}>Recuperação ativa muscular</Text>
          </View>
        )}
      </ScrollView>

      {/* ── FAB Primário Amarelo: Abre Menu Flutuante ── */}
      <TouchableOpacity
        style={estilos.fabAmarelo}
        onPress={() => setMenuTreinoVisivel(true)}
        activeOpacity={0.85}
      >
        <View style={estilos.fabInnerAmarelo}>
          <SymbolView name="plus" size={26} tintColor="#FFFFFF" weight="bold" />
        </View>
      </TouchableOpacity>

      {/* ── Menu Flutuante de Opções ──────────────────────────── */}
      <Modal visible={menuTreinoVisivel} animationType="fade" transparent statusBarTranslucent>
        <TouchableOpacity
          style={estilos.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuTreinoVisivel(false)}
        />
        <BlurView intensity={90} tint="dark" style={estilos.menuSheetContainer}>
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
              <SymbolView name="plus.circle.fill" size={22} tintColor={Cores.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={estilos.tituloMenuOpcao}>Criar novo treino</Text>
              <Text style={estilos.subtituloMenuOpcao}>Nomear treino e adicionar exercícios no mesmo fluxo</Text>
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
              <SymbolView name="dumbbell.fill" size={22} tintColor="#EAB308" />
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
              <SymbolView name="calendar" size={22} tintColor="#3B82F6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={estilos.tituloMenuOpcao}>Definir treino da semana</Text>
              <Text style={estilos.subtituloMenuOpcao}>Predefinir treino para cada dia da semana</Text>
            </View>
          </TouchableOpacity>
        </BlurView>
      </Modal>

      {/* ── Modal Criar Novo Treino em ÚNICA TELA (Rodada 3 — Ajuste 1) ── */}
      <Modal visible={modalCriarNovoTreinoVisivel} animationType="slide" transparent statusBarTranslucent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={estilos.modalOverlay} activeOpacity={1} onPress={() => setModalCriarNovoTreinoVisivel(false)} />
          <BlurView intensity={80} tint="dark" style={estilos.modalCard}>
            <View style={estilos.modalHandle} />
            <Text style={estilos.modalTitulo}>Criar Novo Treino</Text>

            <Text style={estilos.labelForm}>Nome / Foco do Treino:</Text>
            <TextInput
              style={estilos.input}
              placeholder="Ex: Treino D - Ombros & Trapézio"
              placeholderTextColor={Cores.texto.desabilitado}
              value={novoFocoTreino}
              onChangeText={setNovoFocoTreino}
            />

            <Text style={estilos.labelForm}>Buscar por Grupo Muscular ou Nome (ExerciseDB):</Text>
            {/* Carrossel de Grupos Musculares */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {GRUPOS_MUSCULARES.map(grupo => (
                  <TouchableOpacity
                    key={grupo}
                    onPress={() => setGrupoMuscularFiltro(grupo)}
                    style={[
                      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)' },
                      grupoMuscularFiltro === grupo && { backgroundColor: Cores.accent },
                    ]}
                  >
                    <Text style={[{ fontSize: 12, color: Cores.texto.secundario, fontFamily: FamiliaFonte.bold }, grupoMuscularFiltro === grupo && { color: '#080A0E' }]}>
                      {grupo}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TextInput
              style={estilos.input}
              placeholder="Digite o nome do exercício (ex: Supino, Rosca...)"
              placeholderTextColor={Cores.texto.desabilitado}
              value={nomeExTemp}
              onChangeText={setNomeExTemp}
            />

            {/* Sugestões de Exercícios com Imagem / GIF do ExerciseDB */}
            {sugestoesExercicios.length > 0 && (
              <ScrollView style={{ maxHeight: 160, marginBottom: 12 }}>
                {sugestoesExercicios.map(ex => (
                  <TouchableOpacity
                    key={ex.id || ex.id_externo || ex.nome}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      padding: 8,
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderRadius: 10,
                      marginBottom: 6,
                    }}
                    onPress={() => {
                      setNomeExTemp(ex.nome);
                      setGrupoExTemp(ex.grupo_primario || 'Geral');
                    }}
                  >
                    {ex.gif_url ? (
                      <Image source={{ uri: ex.gif_url }} style={{ width: 36, height: 36, borderRadius: 6 }} />
                    ) : (
                      <View style={{ width: 36, height: 36, borderRadius: 6, backgroundColor: Cores.accentSuave, alignItems: 'center', justifyContent: 'center' }}>
                        <SymbolView name="figure.cross.training" size={18} tintColor={Cores.accent} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: FamiliaFonte.bold, fontSize: 13, color: Cores.texto.principal }}>{ex.nome}</Text>
                      <Text style={{ fontFamily: FamiliaFonte.regular, fontSize: 11, color: Cores.texto.secundario }}>
                        {ex.grupo_primario} · {ex.equipamento || 'Livre'}
                      </Text>
                    </View>
                    <SymbolView name="plus.circle.fill" size={18} tintColor={Cores.accent} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={estilos.rowInputs}>
              <TextInput
                style={[estilos.input, { flex: 1 }]}
                placeholder="Séries"
                keyboardType="numeric"
                value={seriesExTemp}
                onChangeText={setSeriesExTemp}
              />
              <TextInput
                style={[estilos.input, { flex: 1 }]}
                placeholder="Reps"
                keyboardType="numeric"
                value={repsExTemp}
                onChangeText={setRepsExTemp}
              />
              <TextInput
                style={[estilos.input, { flex: 1 }]}
                placeholder="Carga (kg)"
                keyboardType="numeric"
                value={cargaExTemp}
                onChangeText={setCargaExTemp}
              />
              <TextInput
                style={[estilos.input, { flex: 1 }]}
                placeholder="Descanso(s)"
                keyboardType="numeric"
                value={descansoExTemp}
                onChangeText={setDescansoExTemp}
              />
            </View>

            <TouchableOpacity style={estilos.btnAddExTemp} onPress={adicionarExercicioTempAoNovoTreino}>
              <SymbolView name="plus" size={14} tintColor="#080A0E" weight="bold" />
              <Text style={estilos.txtAddExTemp}>Incluir Exercício</Text>
            </TouchableOpacity>

            {exerciciosTempNovoTreino.length > 0 ? (
              <View style={estilos.boxAlimentosTemp}>
                <Text style={estilos.txtItensAdicionadosHeader}>Exercícios adicionados ({exerciciosTempNovoTreino.length}):</Text>
                {exerciciosTempNovoTreino.map((ex) => (
                  <View key={ex.id} style={estilos.itemTempRow}>
                    <Text style={estilos.itemTempNome}>{ex.nome} ({ex.series}x{ex.repeticoes} · {ex.cargaKg}kg · {ex.tempoDescansoSegundos}s)</Text>
                    <TouchableOpacity onPress={() => setExerciciosTempNovoTreino(prev => prev.filter(i => i.id !== ex.id))}>
                      <SymbolView name="trash" size={12} tintColor={Cores.feedback.erro} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={estilos.modalAcoes}>
              <TouchableOpacity onPress={() => setModalCriarNovoTreinoVisivel(false)} style={estilos.btnCancelar}>
                <Text style={estilos.txtCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={lidarComCriarNovoTreino} style={estilos.btnSalvar}>
                <Text style={estilos.txtSalvar}>Salvar Treino Completo</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Modal Meus Treinos ───────────────────────────────── */}
      <Modal visible={modalMeusTreinosVisivel} animationType="slide" transparent statusBarTranslucent>
        <TouchableOpacity style={estilos.modalOverlay} activeOpacity={1} onPress={() => setModalMeusTreinosVisivel(false)} />
        <BlurView intensity={80} tint="dark" style={estilos.modalCard}>
          <View style={estilos.modalHandle} />
          <Text style={estilos.modalTitulo}>Meus Treinos Criados</Text>

          {planos.map(p => (
            <View key={p.id} style={estilos.itemTrocaTreino}>
              <View style={{ flex: 1 }}>
                <Text style={estilos.nomeTrocaTreino}>{p.foco}</Text>
                <Text style={estilos.subTrocaTreino}>{p.exercicios.length} exercícios cadastrados</Text>
              </View>
            </View>
          ))}

          <View style={estilos.modalAcoes}>
            <TouchableOpacity onPress={() => setModalMeusTreinosVisivel(false)} style={estilos.btnSalvar}>
              <Text style={estilos.txtSalvar}>Concluído</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>

      {/* ── Modal Definir Treino da Semana ──────────────────── */}
      <Modal visible={modalDefinirSemanaVisivel} animationType="slide" transparent statusBarTranslucent>
        <TouchableOpacity style={estilos.modalOverlay} activeOpacity={1} onPress={() => setModalDefinirSemanaVisivel(false)} />
        <BlurView intensity={80} tint="dark" style={estilos.modalCard}>
          <View style={estilos.modalHandle} />
          <Text style={estilos.modalTitulo}>Definir Treino da Semana</Text>
          <Text style={estilos.subtituloModal}>Escolha qual treino será feito em cada dia:</Text>

          {['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'].map(abrev => {
            const idAtual = mapeamentoSemanal[abrev];
            const treinoAtualMap = planos.find(p => p.id === idAtual) || planos[0];

            return (
              <View key={abrev} style={estilos.rowSemanaConfig}>
                <Text style={estilos.txtSemanaDia}>{abrev.toUpperCase()}</Text>

                <TouchableOpacity
                  style={estilos.btnSelectSemana}
                  onPress={() => {
                    const nextIndex = (planos.findIndex(p => p.id === idAtual) + 1) % planos.length;
                    lidarComDefinirDiaSemana(abrev, planos[nextIndex].id);
                  }}
                >
                  <Text style={estilos.txtSelectSemanaVal}>{treinoAtualMap ? treinoAtualMap.foco : 'Selecione'}</Text>
                  <SymbolView name="chevron.right" size={12} tintColor={Cores.accent} />
                </TouchableOpacity>
              </View>
            );
          })}

          <View style={estilos.modalAcoes}>
            <TouchableOpacity onPress={() => setModalDefinirSemanaVisivel(false)} style={estilos.btnSalvar}>
              <Text style={estilos.txtSalvar}>Salvar Predefinição</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>

      {/* ── Modal Trocar Treino do Dia ──────────────────────── */}
      <Modal visible={modalTrocarTreinoVisivel} animationType="slide" transparent statusBarTranslucent>
        <TouchableOpacity style={estilos.modalOverlay} activeOpacity={1} onPress={() => setModalTrocarTreinoVisivel(false)} />
        <BlurView intensity={80} tint="dark" style={estilos.modalCard}>
          <View style={estilos.modalHandle} />
          <Text style={estilos.modalTitulo}>Trocar Treino para esta Data</Text>

          {planos.map(p => (
            <TouchableOpacity
              key={p.id}
              style={[estilos.itemTrocaTreino, diaAtual.id === p.id && estilos.itemTrocaTreinoAtivo]}
              onPress={() => lidarComTrocarTreinoData(p.id)}
            >
              <View style={{ flex: 1 }}>
                <Text style={estilos.nomeTrocaTreino}>{p.foco}</Text>
                <Text style={estilos.subTrocaTreino}>{p.exercicios.length} exercícios</Text>
              </View>
              {diaAtual.id === p.id && (
                <SymbolView name="checkmark.circle.fill" size={20} tintColor={Cores.accent} />
              )}
            </TouchableOpacity>
          ))}

          <View style={estilos.modalAcoes}>
            <TouchableOpacity onPress={() => setModalTrocarTreinoVisivel(false)} style={estilos.btnCancelar}>
              <Text style={estilos.txtCancelar}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>

      {/* ── Modal Editar / Excluir Exercício ───────────────── */}
      {exercicioEmEdicao && (
        <Modal visible={modalEditarVisivel} animationType="slide" transparent statusBarTranslucent>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <TouchableOpacity style={estilos.modalOverlay} activeOpacity={1} onPress={() => setModalEditarVisivel(false)} />
            <BlurView intensity={80} tint="dark" style={estilos.modalCard}>
              <View style={estilos.modalHandle} />
              <Text style={estilos.modalTitulo}>Editar Exercício</Text>

              <TextInput
                style={estilos.input}
                value={exercicioEmEdicao.nome}
                onChangeText={t => setExercicioEmEdicao({ ...exercicioEmEdicao, nome: t })}
              />

              <View style={estilos.rowInputs}>
                <View style={{ flex: 1 }}>
                  <Text style={estilos.labelInput}>Séries</Text>
                  <TextInput
                    style={estilos.input}
                    keyboardType="numeric"
                    value={String(exercicioEmEdicao.series)}
                    onChangeText={t => setExercicioEmEdicao({ ...exercicioEmEdicao, series: parseInt(t, 10) || 0 })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={estilos.labelInput}>Reps</Text>
                  <TextInput
                    style={estilos.input}
                    keyboardType="numeric"
                    value={String(exercicioEmEdicao.repeticoes)}
                    onChangeText={t => setExercicioEmEdicao({ ...exercicioEmEdicao, repeticoes: parseInt(t, 10) || 0 })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={estilos.labelInput}>Carga (kg)</Text>
                  <TextInput
                    style={estilos.input}
                    keyboardType="numeric"
                    value={String(exercicioEmEdicao.cargaKg)}
                    onChangeText={t => setExercicioEmEdicao({ ...exercicioEmEdicao, cargaKg: parseFloat(t) || 0 })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={estilos.labelInput}>Descanso (s)</Text>
                  <TextInput
                    style={estilos.input}
                    keyboardType="numeric"
                    value={String(exercicioEmEdicao.tempoDescansoSegundos || 60)}
                    onChangeText={t => setExercicioEmEdicao({ ...exercicioEmEdicao, tempoDescansoSegundos: parseInt(t, 10) || 60 })}
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
                  <TouchableOpacity onPress={() => setModalEditarVisivel(false)} style={estilos.btnCancelar}>
                    <Text style={estilos.txtCancelar}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={lidarComSalvarEdicaoExercicio} style={estilos.btnSalvar}>
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

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo.principal },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
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
    color: Cores.texto.principal,
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
    backgroundColor: Cores.fundo.superficie,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Raio.full,
    borderWidth: 1,
    borderColor: Cores.borda.sutil,
  },
  streakTexto: {
    fontFamily: FamiliaFonte.bold,
    fontSize: 13,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
  },

  carrosselContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  itemDia: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaAbrev: {
    fontFamily: FamiliaFonte.regular,
    fontSize: 13,
    color: Cores.texto.desabilitado,
    marginBottom: 6,
  },
  diaAbrevSelecionado: {
    fontFamily: FamiliaFonte.semibold,
    color: Cores.texto.principal,
  },
  diaNum: {
    fontFamily: FamiliaFonte.regular,
    fontSize: 17,
    color: Cores.texto.desabilitado,
  },
  diaNumSelecionado: {
    fontFamily: FamiliaFonte.bold,
    fontSize: 20,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
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
    backgroundColor: Cores.fundo.elevada,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaFoco: {
    fontFamily: FamiliaFonte.bold,
    fontSize: 16,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
  },
  diaDetalhes: {
    fontFamily: FamiliaFonte.regular,
    fontSize: 13,
    color: Cores.texto.secundario,
    marginTop: 2,
  },
  btnTrocarTreino: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: Cores.fundo.elevada,
    borderRadius: 8,
  },
  txtTrocarTreino: {
    fontFamily: FamiliaFonte.semibold,
    fontSize: 12,
    color: Cores.accent,
  },

  secaoTitulo: {
    fontFamily: FamiliaFonte.bold,
    fontSize: Fonte.label,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.secundario,
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
    fontSize: 14,
    fontWeight: PesoFonte.bold,
    color: Cores.accent,
  },
  colExercicio: {
    flex: 1,
  },
  exNome: {
    fontFamily: FamiliaFonte.bold,
    fontSize: 15,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
  },
  exSub: {
    fontFamily: FamiliaFonte.regular,
    fontSize: 12,
    color: Cores.texto.secundario,
    marginTop: 2,
  },
  badgeGrupo: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Raio.sm,
    backgroundColor: Cores.fundo.elevada,
  },
  textoBadgeGrupo: {
    fontFamily: FamiliaFonte.semibold,
    fontSize: 11,
    color: Cores.texto.secundario,
  },

  // Rodada 3 — Ajuste 1: Estilização da exibição das séries em LINHA
  containerLinhasSeries: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
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
    fontSize: 12,
    color: Cores.texto.secundario,
  },
  linhaDivisoraPontilhada: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginHorizontal: 8,
  },
  txtValoresSerie: {
    fontFamily: FamiliaFonte.bold,
    fontSize: 13,
    color: Cores.texto.principal,
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
    color: Cores.texto.principal,
  },
  textoVazioSub: {
    fontFamily: FamiliaFonte.regular,
    fontSize: Fonte.label,
    color: Cores.texto.secundario,
    marginTop: 4,
  },

  // FAB Amarelo
  fabAmarelo: {
    position: 'absolute',
    bottom: 96,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: Cores.amarelo,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  fabInnerAmarelo: {
    width: '100%',
    height: '100%',
    backgroundColor: Cores.amarelo,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modais e Sheet
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Cores.borda.forte,
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
    backgroundColor: 'rgba(16,19,24,0.98)',
    borderTopWidth: 1,
    borderColor: Cores.borda.sutil,
  },
  itemMenuOpcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  iconeMenuOpcao: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Cores.fundo.elevada,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloMenuOpcao: {
    fontFamily: FamiliaFonte.bold,
    fontSize: Fonte.corpo,
    color: Cores.texto.principal,
  },
  subtituloMenuOpcao: {
    fontFamily: FamiliaFonte.regular,
    fontSize: 12,
    color: Cores.texto.secundario,
    marginTop: 2,
  },

  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    backgroundColor: 'rgba(16,19,24,0.97)',
    borderTopWidth: 1,
    borderColor: Cores.borda.sutil,
  },
  modalTitulo: {
    fontFamily: FamiliaFonte.bold,
    fontSize: Fonte.subtitulo,
    color: Cores.texto.principal,
    marginBottom: 12,
  },
  subtituloModal: {
    fontFamily: FamiliaFonte.regular,
    fontSize: Fonte.label,
    color: Cores.texto.secundario,
    marginBottom: 16,
  },
  labelForm: {
    fontFamily: FamiliaFonte.bold,
    fontSize: 12,
    color: Cores.texto.secundario,
    marginBottom: 6,
    marginTop: 6,
  },
  btnAddExTemp: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Cores.accent,
    paddingVertical: 10,
    borderRadius: Raio.md,
    marginBottom: 12,
  },
  txtAddExTemp: {
    fontFamily: FamiliaFonte.bold,
    fontSize: 13,
    color: '#080A0E',
  },
  boxAlimentosTemp: {
    backgroundColor: Cores.fundo.elevada,
    padding: 12,
    borderRadius: Raio.md,
    marginBottom: 16,
  },
  txtItensAdicionadosHeader: {
    fontFamily: FamiliaFonte.bold,
    fontSize: 11,
    color: Cores.accent,
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
    fontSize: 12,
    color: Cores.texto.principal,
  },

  rowSemanaConfig: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  txtSemanaDia: {
    fontFamily: FamiliaFonte.bold,
    fontSize: Fonte.corpo,
    color: Cores.texto.principal,
  },
  btnSelectSemana: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Cores.fundo.elevada,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Raio.sm,
  },
  txtSelectSemanaVal: {
    fontFamily: FamiliaFonte.semibold,
    fontSize: 13,
    color: Cores.accent,
  },

  itemTrocaTreino: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: Cores.fundo.elevada,
    borderRadius: Raio.md,
    marginBottom: 10,
  },
  itemTrocaTreinoAtivo: {
    borderWidth: 1,
    borderColor: Cores.accent,
  },
  nomeTrocaTreino: {
    fontFamily: FamiliaFonte.bold,
    fontSize: Fonte.corpo,
    color: Cores.texto.principal,
  },
  subTrocaTreino: {
    fontFamily: FamiliaFonte.regular,
    fontSize: 12,
    color: Cores.texto.secundario,
    marginTop: 2,
  },

  input: {
    backgroundColor: Cores.fundo.elevada,
    borderWidth: 1,
    borderColor: Cores.borda.media,
    borderRadius: Raio.md,
    padding: 12,
    fontSize: Fonte.corpo,
    color: Cores.texto.principal,
    fontFamily: FamiliaFonte.regular,
    marginBottom: 12,
  },
  labelInput: {
    fontFamily: FamiliaFonte.regular,
    fontSize: 11,
    color: Cores.texto.secundario,
    marginBottom: 4,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 6,
  },
  modalAcoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 },
  modalAcoesSpace: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  btnCancelar: { paddingVertical: 10, paddingHorizontal: 16 },
  txtCancelar: { fontFamily: FamiliaFonte.semibold, color: Cores.texto.secundario, fontSize: Fonte.corpo },
  btnSalvar: { backgroundColor: Cores.accent, paddingVertical: 10, paddingHorizontal: 20, borderRadius: Raio.md },
  txtSalvar: { fontFamily: FamiliaFonte.bold, color: '#080A0E', fontSize: Fonte.corpo },
  btnExcluir: { paddingVertical: 10, paddingHorizontal: 16 },
  txtExcluir: { fontFamily: FamiliaFonte.semibold, color: Cores.feedback.erro, fontSize: Fonte.corpo },
});
