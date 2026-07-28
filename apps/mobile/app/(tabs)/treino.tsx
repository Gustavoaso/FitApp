// ============================================================
// TELA: Módulo de Treino (app/(tabs)/treino.tsx)
// ============================================================
// Clean Dark UI — Rodada 2: Ajuste 3
// - Botão flutuante (FAB) que abre menu de opções:
//   1. "Criar novo treino"
//   2. "Meus treinos"
//   3. "Definir treino da semana"
// - Predefinição semanal com seleção automática ao abrir no dia seguinte.
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { BlurView } from 'expo-blur';
import { CardVidro, BotaoPrimario } from '../../componentes/ui';
import { Cores, Espacamento, FamiliaFonte, Fonte, PesoFonte, Raio } from '../../constantes/Cores';
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
  obterUltimaCargaExercicio,
  DiaTreinoCustomizado,
  ExercicioCustomizado,
} from '../../servicos/planoGestaoServico';

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

  // Histórico de últimas cargas
  const [ultimasCargas, setUltimasCargas] = useState<Record<string, { cargaKg: number; repeticoes: number }>>({});

  // Modais do Ajuste 3
  const [menuTreinoVisivel, setMenuTreinoVisivel] = useState(false);
  const [modalCriarNovoTreinoVisivel, setModalCriarNovoTreinoVisivel] = useState(false);
  const [modalMeusTreinosVisivel, setModalMeusTreinosVisivel] = useState(false);
  const [modalDefinirSemanaVisivel, setModalDefinirSemanaVisivel] = useState(false);

  // Modais de exercícios
  const [modalAdicionarVisivel, setModalAdicionarVisivel] = useState(false);
  const [modalEditarVisivel, setModalEditarVisivel] = useState(false);
  const [modalTrocarTreinoVisivel, setModalTrocarTreinoVisivel] = useState(false);

  const [exercicioEmEdicao, setExercicioEmEdicao] = useState<ExercicioCustomizado | null>(null);

  // Forms
  const [novoFocoTreino, setNovoFocoTreino] = useState('');
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

    const cargasMapa: Record<string, { cargaKg: number; repeticoes: number }> = {};
    for (const dia of dados) {
      for (const ex of dia.exercicios) {
        const u = await obterUltimaCargaExercicio(ex.id);
        if (u) {
          cargasMapa[ex.id] = { cargaKg: u.cargaKg, repeticoes: u.repeticoes };
        }
      }
    }
    setUltimasCargas(cargasMapa);
  };

  // Identifica a abreviação do dia no carrossel (dom, seg, ter...)
  const itemCarrossel = DIAS_SEMANA_CARROSSEL.find(d => d.data === diaSelecionado);
  const abrevDia = itemCarrossel ? itemCarrossel.abrev : 'seg';

  // Seleciona o treino pré-definido para aquele dia da semana (ou treino especial da data)
  const idTreinoPredefinido = mapeamentoSemanal[abrevDia];
  const treinoDefaultSemanal = planos.find(p => p.id === idTreinoPredefinido) || planos[0];
  const diaAtual = idTreinoEspecial ? planos.find(p => p.id === idTreinoEspecial) || treinoDefaultSemanal : treinoDefaultSemanal;

  const temTreino = diaAtual && diaAtual.exercicios && diaAtual.exercicios.length > 0;

  // 1. Criar novo treino (Rodada 2 — Ajuste 3)
  const lidarComCriarNovoTreino = async () => {
    if (!novoFocoTreino.trim()) return;
    const novoTreino: DiaTreinoCustomizado = {
      id: `dia-${Date.now()}`,
      diaSemana: 'Personalizado',
      foco: novoFocoTreino,
      exercicios: [
        { id: `ex-${Date.now()}`, nome: 'Exercício Base', grupoMuscular: 'Geral', series: 4, repeticoes: 10, cargaKg: 20, tempoDescansoSegundos: 60 },
      ],
    };
    const atualizados = [...planos, novoTreino];
    setPlanos(atualizados);
    await salvarPlanoTreinoCustomizado(atualizados);
    setNovoFocoTreino('');
    setModalCriarNovoTreinoVisivel(false);
  };

  // 2. Definir treino para um dia da semana (Rodada 2 — Ajuste 3)
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

        {/* ── Card do Foco do Dia ────────────────────────────── */}
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
                {temTreino ? `${diaAtual.exercicios.length} exercícios` : 'Descanso ativo'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity
                style={estilos.btnTrocarTreino}
                onPress={() => setModalTrocarTreinoVisivel(true)}
              >
                <SymbolView name="arrow.triangle.2.circlepath" size={14} tintColor={Cores.accent} weight="bold" />
                <Text style={estilos.txtTrocarTreino}>Trocar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={estilos.btnAdicionarExercicio}
                onPress={() => setModalAdicionarVisivel(true)}
              >
                <SymbolView name="plus" size={14} tintColor={Cores.accent} weight="bold" />
              </TouchableOpacity>
            </View>
          </View>
        </CardVidro>

        {/* ── Lista de Exercícios ───────────────────────────── */}
        {temTreino ? (
          <>
            <Text style={estilos.secaoTitulo}>Exercícios do Dia</Text>

            {diaAtual.exercicios.map((ex, i) => {
              const ultima = ultimasCargas[ex.id];
              return (
                <CardVidro key={ex.id} semBorda estilo={estilos.cardExercicioSemBorda}>
                  <TouchableOpacity
                    onPress={() => {
                      setExercicioEmEdicao(ex);
                      setModalEditarVisivel(true);
                    }}
                    activeOpacity={0.7}
                    style={estilos.rowExercicio}
                  >
                    <View style={estilos.ordemContainer}>
                      <Text style={estilos.ordemTexto}>{String(i + 1).padStart(2, '0')}</Text>
                    </View>

                    <View style={estilos.colExercicio}>
                      <Text style={estilos.exNome}>{ex.nome}</Text>
                      <Text style={estilos.exSub}>
                        {ex.series} séries · {ex.repeticoes} reps · {ex.cargaKg}kg · {ex.tempoDescansoSegundos || 60}s descanso
                      </Text>
                      <Text style={estilos.exUltimaExecucao}>
                        Última: {ultima ? `${ultima.cargaKg}kg x ${ultima.repeticoes} reps` : `${ex.cargaKg}kg (atual)`}
                      </Text>
                    </View>

                    <View style={estilos.badgeGrupo}>
                      <Text style={estilos.textoBadgeGrupo}>{ex.grupoMuscular}</Text>
                    </View>
                  </TouchableOpacity>
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

      {/* ── FAB Primário Amarelo: Abre Menu Flutuante (Rodada 2 — Ajuste 3) ── */}
      <TouchableOpacity
        style={estilos.fabAmarelo}
        onPress={() => setMenuTreinoVisivel(true)}
        activeOpacity={0.85}
      >
        <View style={estilos.fabInnerAmarelo}>
          <SymbolView name="plus" size={26} tintColor="#FFFFFF" weight="bold" />
        </View>
      </TouchableOpacity>

      {/* ── Menu Flutuante de Opções de Treino (Rodada 2 — Ajuste 3) ── */}
      <Modal visible={menuTreinoVisivel} animationType="fade" transparent statusBarTranslucent>
        <TouchableOpacity
          style={estilos.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuTreinoVisivel(false)}
        />
        <BlurView intensity={90} tint="dark" style={estilos.menuSheetContainer}>
          <View style={estilos.modalHandle} />
          <Text style={estilos.modalTitulo}>Opções de Treino</Text>

          {/* Opção 1: Criar novo treino */}
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
              <Text style={estilos.subtituloMenuOpcao}>Montar uma nova rotina (ex: Treino C)</Text>
            </View>
          </TouchableOpacity>

          {/* Opção 2: Meus treinos */}
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
              <Text style={estilos.subtituloMenuOpcao}>Lista de todos os treinos criados por você</Text>
            </View>
          </TouchableOpacity>

          {/* Opção 3: Definir treino da semana */}
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
              <Text style={estilos.subtituloMenuOpcao}>Predefinir treino para cada dia (Seg, Ter...)</Text>
            </View>
          </TouchableOpacity>
        </BlurView>
      </Modal>

      {/* ── Modal Criar Novo Treino (Rodada 2 — Ajuste 3) ─────── */}
      <Modal visible={modalCriarNovoTreinoVisivel} animationType="slide" transparent statusBarTranslucent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={estilos.modalOverlay} activeOpacity={1} onPress={() => setModalCriarNovoTreinoVisivel(false)} />
          <BlurView intensity={80} tint="dark" style={estilos.modalCard}>
            <View style={estilos.modalHandle} />
            <Text style={estilos.modalTitulo}>Criar Novo Treino</Text>

            <TextInput
              style={estilos.input}
              placeholder="Foco do treino (ex: Ombros & Trapézio)"
              placeholderTextColor={Cores.texto.desabilitado}
              value={novoFocoTreino}
              onChangeText={setNovoFocoTreino}
              autoFocus
            />

            <View style={estilos.modalAcoes}>
              <TouchableOpacity onPress={() => setModalCriarNovoTreinoVisivel(false)} style={estilos.btnCancelar}>
                <Text style={estilos.txtCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={lidarComCriarNovoTreino} style={estilos.btnSalvar}>
                <Text style={estilos.txtSalvar}>Criar Treino</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Modal Meus Treinos (Rodada 2 — Ajuste 3) ─────────── */}
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

      {/* ── Modal Definir Treino da Semana (Rodada 2 — Ajuste 3) ── */}
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

      {/* ── Modal Adicionar Exercício ───────────────────────── */}
      <Modal visible={modalAdicionarVisivel} animationType="slide" transparent statusBarTranslucent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={estilos.modalOverlay} activeOpacity={1} onPress={() => setModalAdicionarVisivel(false)} />
          <BlurView intensity={80} tint="dark" style={estilos.modalCard}>
            <View style={estilos.modalHandle} />
            <Text style={estilos.modalTitulo}>Adicionar Exercício</Text>

            <TextInput
              style={estilos.input}
              placeholder="Nome do exercício..."
              placeholderTextColor={Cores.texto.desabilitado}
              value={novoNome}
              onChangeText={setNovoNome}
            />

            <TextInput
              style={estilos.input}
              placeholder="Grupo muscular (ex: Peito, Costas...)"
              placeholderTextColor={Cores.texto.desabilitado}
              value={novoGrupo}
              onChangeText={setNovoGrupo}
            />

            <View style={estilos.rowInputs}>
              <TextInput
                style={[estilos.input, { flex: 1 }]}
                placeholder="Séries"
                keyboardType="numeric"
                value={novasSeries}
                onChangeText={setNovasSeries}
              />
              <TextInput
                style={[estilos.input, { flex: 1 }]}
                placeholder="Reps"
                keyboardType="numeric"
                value={novasReps}
                onChangeText={setNovasReps}
              />
              <TextInput
                style={[estilos.input, { flex: 1 }]}
                placeholder="Carga (kg)"
                keyboardType="numeric"
                value={novaCarga}
                onChangeText={setNovaCarga}
              />
              <TextInput
                style={[estilos.input, { flex: 1 }]}
                placeholder="Descanso (s)"
                keyboardType="numeric"
                value={novoDescanso}
                onChangeText={setNovoDescanso}
              />
            </View>

            <View style={estilos.modalAcoes}>
              <TouchableOpacity onPress={() => setModalAdicionarVisivel(false)} style={estilos.btnCancelar}>
                <Text style={estilos.txtCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={lidarComSalvarNovoExercicio} style={estilos.btnSalvar}>
                <Text style={estilos.txtSalvar}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </KeyboardAvoidingView>
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Cores.fundo.elevada,
    borderRadius: 8,
  },
  txtTrocarTreino: {
    fontFamily: FamiliaFonte.semibold,
    fontSize: 11,
    color: Cores.accent,
  },
  btnAdicionarExercicio: {
    padding: 8,
    backgroundColor: Cores.fundo.elevada,
    borderRadius: 8,
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
    marginBottom: 12,
    padding: Espacamento.lg,
    borderWidth: 0,
    marginHorizontal: -20,
  },
  rowExercicio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.md,
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
    fontSize: 13,
    color: Cores.texto.secundario,
    marginTop: 2,
  },
  exUltimaExecucao: {
    fontFamily: FamiliaFonte.regular,
    fontSize: 11,
    color: Cores.accent,
    marginTop: 3,
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

  // FAB Amarelo (Rodada 2 — Ajuste 3)
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
