// ============================================================
// TELA: Dashboard / Início (app/(tabs)/inicio.tsx)
// ============================================================
// Clean Dark UI.
// Rodada 2 — Ajuste 1: Todos os cards são interativos e navegam para telas correspondentes.
// Rodada 2 — Ajuste 2: Adicionadas opções inversas para remover água (-250ml, -500ml, -1L).
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
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { BlurView } from 'expo-blur';
import { CardVidro, AnelProgresso, BotaoPrimario, CartaoNivel } from '@/compartilhado/ui';
import { IconeCookie } from '@/compartilhado/ui/IconesFitApp';
import { CardAderencia } from './CardAderencia';
import { GraficoEvolucao, PontoGrafico } from './GraficoEvolucao';
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
import {
  obterHistoricoPeso,
  adicionarEntradaPeso,
  calcularAderenciaSemanal,
  obterEvolucaoCargas,
  EstatisticasAderencia,
} from '@/compartilhado/servicos/progresso-servico';
import { calcularSequenciaDias } from './calcular-sequencia';
import { formatarKcalEstimada } from '@/compartilhado/utilidades/gasto-calorico';
import { repositorioPlano, repositorioAgua } from '@/compartilhado/servicos/repositorio';
import { buscarResumoGamificacao } from '@/compartilhado/servicos/gamificacao-servico';
import type { ResumoGamificacao } from '@/compartilhado/utilidades/gamificacao';
import { somarConsumoDoDia } from './consumo-do-dia';
import {
  obterPlanoTreinoCustomizado,
  obterTreinoDeHoje,
} from '@/compartilhado/servicos/plano-gestao-servico';

export default function TelaInicio() {
  const { cores, escuro } = useTema();
  const estilos = useMemo(() => criarEstilos(cores), [cores]);
  const router = useRouter();

  const [gamificacao, setGamificacao] = useState<ResumoGamificacao | null>(null);
  const [caloriasConsumidas, setCaloriasConsumidas] = useState(0);
  const [caloriasMeta, setCaloriasMeta] = useState(0);

  const [proteina, setProteina] = useState(0);
  const [proteinaMeta, setProteinaMeta] = useState(0);

  const [carboidrato, setCarboidrato] = useState(0);
  const [carboidratoMeta, setCarboidratoMeta] = useState(0);

  const [gordura, setGordura] = useState(0);
  const [gorduraMeta, setGorduraMeta] = useState(0);

  // Hidratação
  const [aguaConsumidaMl, setAguaConsumidaMl] = useState(0);
  const [metaAguaMl, setMetaAguaMl] = useState(2500);
  const [modalMetaAguaVisivel, setModalMetaAguaVisivel] = useState(false);
  const [novaMetaAguaStr, setNovaMetaAguaStr] = useState('');

  // Treino de hoje
  const [treinoHojeTitulo, setTreinoHojeTitulo] = useState('Treino do Dia');
  const [treinoHojeSub, setTreinoHojeSub] = useState('Carregando treino...');
  const [treinoHojeId, setTreinoHojeId] = useState<string | null>(null);
  const [kcalTreinoHoje, setKcalTreinoHoje] = useState<number | null>(null);

  // Estados de progresso
  const [dadosGraficoPeso, setDadosGraficoPeso] = useState<PontoGrafico[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasAderencia>({
    diasTreinados: 0,
    metaDiasTreino: 0,
    exerciciosRealizados: 0,
    metaExercicios: 0,
    refeicoesConcluidas: 0,
    totalRefeicoesPrevistas: 0,
    porcentagemAderenciaGeral: 0,
  });

  const [sequenciaDias, setSequenciaDias] = useState(0);

  // Modal registrar peso
  const [modalPesoVisivel, setModalPesoVisivel] = useState(false);
  const [novoPesoStr, setNovoPesoStr] = useState('85.0');

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  const diaSemana = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const diasemana = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);

  const porcentagemCalorias = Math.round((caloriasConsumidas / (caloriasMeta || 1)) * 100);

  const carregarDadosProgresso = async () => {
    const cargas = await obterEvolucaoCargas();
    const datasTreino = cargas.flatMap((c) => c.historicoCargas.map((h) => h.data));
    // Mesma referência de data (UTC) usada ao registrar a série.
    setSequenciaDias(calcularSequenciaDias(datasTreino, new Date().toISOString().slice(0, 10)));

    const metas = await repositorioPlano.obterMetasAtivasUsuario();
    if (metas) {
      if (metas.caloriasMeta) setCaloriasMeta(metas.caloriasMeta);
      if (metas.proteinaMeta) setProteinaMeta(metas.proteinaMeta);
      if (metas.carboidratoMeta) setCarboidratoMeta(metas.carboidratoMeta);
      if (metas.gorduraMeta) setGorduraMeta(metas.gorduraMeta);
      if (metas.metaAguaMl) setMetaAguaMl(metas.metaAguaMl);
    }

    // Calcula macronutrientes consumidos hoje a partir das refeições concluídas
    const hojeStr = new Date().toISOString().split('T')[0];
    const { obterHistoricoDieta, obterHistoricoTreino } =
      await import('@/compartilhado/servicos/historico-servico');
    const salvoRefeicoes = await obterHistoricoDieta(hojeStr);
    // Gasto do treino de hoje (RN20): só mostra, nunca soma às calorias da dieta.
    const treinoFeito = await obterHistoricoTreino(hojeStr);
    setKcalTreinoHoje(treinoFeito?.concluido ? (treinoFeito.kcalEstimadas ?? null) : null);

    // Tudo o que a aba Dieta registrou hoje (ver consumo-do-dia.ts).
    const consumo = somarConsumoDoDia(salvoRefeicoes);
    setCaloriasConsumidas(consumo.calorias);
    setProteina(consumo.proteinas);
    setCarboidrato(consumo.carbos);
    setGordura(consumo.gorduras);

    // 1. Busca hidratação do Supabase para a data de hoje
    const registroAgua = await repositorioAgua.buscarAguaDoDia(hojeStr);
    if (registroAgua) {
      setAguaConsumidaMl(registroAgua.total_ml || 0);
      if (registroAgua.meta_ml) setMetaAguaMl(registroAgua.meta_ml);
    }

    // 2. Busca o treino planejado para hoje
    try {
      // Mesma regra da aba Treino: a troca do dia vale, e dia sem treino é descanso
      // (antes o Início mostrava o primeiro treino do plano como "hoje").
      const treinoHoje = await obterTreinoDeHoje();
      if (treinoHoje) {
        setTreinoHojeTitulo(treinoHoje.foco || treinoHoje.diaSemana);
        setTreinoHojeSub(`${treinoHoje.exercicios.length} exercícios · ~45 min`);
        setTreinoHojeId(treinoHoje.id);
      } else if ((await obterPlanoTreinoCustomizado()).length > 0) {
        setTreinoHojeTitulo('Descanso Planejado');
        setTreinoHojeSub('Aproveite para recuperar as energias');
        setTreinoHojeId(null);
      } else {
        setTreinoHojeTitulo('Sem Treino Cadastrado');
        setTreinoHojeSub('Crie ou recalcule um plano no perfil');
        setTreinoHojeId(null);
      }
    } catch (errTreino) {
      console.warn('Erro ao carregar treino do dia:', errTreino);
    }

    const historicoPesos = await obterHistoricoPeso();
    const pontos: PontoGrafico[] = historicoPesos.map((p) => ({
      label: p.data.slice(8, 10) + '/' + p.data.slice(5, 7),
      valor: p.pesoKg,
    }));
    setDadosGraficoPeso(pontos);

    const stats = await calcularAderenciaSemanal();
    setEstatisticas(stats);
    setGamificacao(await buscarResumoGamificacao(new Date().toISOString().split('T')[0]));
  };

  useFocusEffect(
    useCallback(() => {
      carregarDadosProgresso();
    }, []),
  );

  const lidarComSalvarPeso = async () => {
    const valor = parseFloat(novoPesoStr.replace(',', '.'));
    if (!isNaN(valor) && valor > 30 && valor < 300) {
      const atualizados = await adicionarEntradaPeso(valor);
      const pontos: PontoGrafico[] = atualizados.map((p) => ({
        label: p.data.slice(8, 10) + '/' + p.data.slice(5, 7),
        valor: p.pesoKg,
      }));
      setDadosGraficoPeso(pontos);
    }
    setModalPesoVisivel(false);
  };

  // Adicionar consumo de água
  const adicionarAgua = async (quantidadeMl: number) => {
    const novoTotal = Math.min(aguaConsumidaMl + quantidadeMl, metaAguaMl + 3000);
    setAguaConsumidaMl(novoTotal);
    const hojeStr = new Date().toISOString().split('T')[0];
    await repositorioAgua.salvarAguaDoDia(hojeStr, novoTotal, metaAguaMl);
  };

  // Remover consumo de água (função inversa)
  const removerAgua = async (quantidadeMl: number) => {
    const novoTotal = Math.max(0, aguaConsumidaMl - quantidadeMl);
    setAguaConsumidaMl(novoTotal);
    const hojeStr = new Date().toISOString().split('T')[0];
    await repositorioAgua.salvarAguaDoDia(hojeStr, novoTotal, metaAguaMl);
  };

  const salvarMetaAgua = async () => {
    const valor = parseInt(novaMetaAguaStr, 10);
    if (!isNaN(valor) && valor >= 500 && valor <= 10000) {
      setMetaAguaMl(valor);
      const hojeStr = new Date().toISOString().split('T')[0];
      await repositorioAgua.salvarAguaDoDia(hojeStr, aguaConsumidaMl, valor);
    }
    setModalMetaAguaVisivel(false);
  };

  return (
    <View style={estilos.container}>
      <ScrollView
        contentContainerStyle={estilos.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Bar ────────────────────────────────────────── */}
        <View style={estilos.topBar}>
          <View>
            <Text style={estilos.saudacao}>{saudacao}</Text>
            <Text style={estilos.dataAtual}>{diasemana}</Text>
          </View>

          <View style={estilos.topBarDireita}>
            <View
              style={estilos.streakBadge}
              accessible
              accessibilityLabel={`Sequência: ${sequenciaDias} ${sequenciaDias === 1 ? 'dia' : 'dias'}`}
            >
              <SymbolView
                name="bolt.fill"
                size={14}
                tintColor={cores.destaqueTexto}
                weight="bold"
              />
              <Text style={estilos.streakTexto}>{sequenciaDias}</Text>
            </View>
          </View>
        </View>

        {/* ── Card Principal: Calorias (Rodada 5 — Ajuste 3: Somente visualização) ── */}
        <View>
          <CardVidro semBorda estilo={estilos.cardCalorias}>
            <View style={estilos.rowCalorias}>
              {/* Não encolhe com a coluna ao lado; com texto grande, o "restam" quebra linha. */}
              <View style={estilos.colAnelCalorias}>
                <AnelProgresso
                  atual={caloriasConsumidas}
                  meta={caloriasMeta}
                  tamanho={88}
                  espessura={5}
                  mostrarValor={true}
                />
              </View>

              <View style={estilos.colInfoCalorias}>
                <Text style={estilos.labelCalorias}>Calorias hoje</Text>
                <Text style={estilos.valorCalorias}>{caloriasConsumidas.toLocaleString()}</Text>
                <Text style={estilos.metaCalorias}>meta {caloriasMeta.toLocaleString()} kcal</Text>

                <View style={estilos.barraFundo}>
                  <View style={[estilos.barraProgresso, { width: `${porcentagemCalorias}%` }]} />
                </View>
                <Text style={estilos.textoPorcentagem}>{porcentagemCalorias}% concluído</Text>
              </View>
            </View>
          </CardVidro>
        </View>

        {/* ── Macronutrientes (Rodada 5 — Ajuste 3: Somente visualização) ── */}
        <Text style={estilos.secaoTitulo}>Macronutrientes</Text>
        <View>
          <View style={estilos.gridMacros}>
            {[
              {
                icone: <SymbolView name="fork.knife" size={16} tintColor={cores.textoSecundario} />,
                nome: 'Proteína',
                atual: proteina,
                meta: proteinaMeta,
              },
              {
                icone: <IconeCookie tamanho={16} cor={cores.textoSecundario} />,
                nome: 'Carbos',
                atual: carboidrato,
                meta: carboidratoMeta,
              },
              {
                icone: <SymbolView name="drop" size={16} tintColor={cores.textoSecundario} />,
                nome: 'Gordura',
                atual: gordura,
                meta: gorduraMeta,
              },
            ].map((macro, i) => (
              <CardVidro key={i} semBorda estilo={estilos.cardMacro}>
                <View style={estilos.rowMacroTopo}>
                  {macro.icone}
                  <Text style={estilos.macroNome}>{macro.nome}</Text>
                </View>
                <Text style={estilos.macroValor}>
                  {macro.atual}
                  <Text style={estilos.macroUnidade}>g</Text>
                </Text>
                <View style={estilos.barraFundoMacro}>
                  <View
                    style={[
                      estilos.barraProgressoMacro,
                      // Sem meta, barra vazia (antes x/0 = Infinity enchia a barra).
                      {
                        width: `${macro.meta > 0 ? Math.min((macro.atual / macro.meta) * 100, 100) : 0}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={estilos.macroMeta}>/{macro.meta}g</Text>
              </CardVidro>
            ))}
          </View>
        </View>

        {gamificacao ? <CartaoNivel resumo={gamificacao} /> : null}

        {/* ── Painel de Aderência Semanal (Rodada 5 — Ajuste 3: Somente visualização) ── */}
        <View>
          <CardAderencia estatisticas={estatisticas} />
        </View>

        {/* ── Gráfico de Evolução de Peso ───────────────────── */}
        <CardVidro semBorda estilo={estilos.cardEvolucao}>
          <View style={estilos.headerEvolucao}>
            <Text style={estilos.tituloEvolucao}>Evolução de Peso</Text>
            <TouchableOpacity style={estilos.btnNovoPeso} onPress={() => setModalPesoVisivel(true)}>
              <SymbolView name="plus" size={12} tintColor={cores.destaque} weight="bold" />
              <Text style={estilos.txtNovoPeso}>Registrar</Text>
            </TouchableOpacity>
          </View>
          <GraficoEvolucao dados={dadosGraficoPeso} unidade="kg" altura={130} />
        </CardVidro>

        {/* ── Hidratação Editável & Função Inversa de Remoção (Ajuste 2) ── */}
        <Text style={estilos.secaoTitulo}>Hidratação</Text>
        <CardVidro semBorda estilo={estilos.cardAgua}>
          <View style={estilos.rowAguaTopo}>
            <View style={estilos.rowAguaInfo}>
              <SymbolView name="drop.fill" size={18} tintColor={cores.destaque} />
              <Text style={estilos.aguaLabel}>Meta de Água</Text>
            </View>
            <TouchableOpacity
              onPress={() => setModalMetaAguaVisivel(true)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Text style={estilos.aguaValor}>
                {aguaConsumidaMl}
                <Text style={estilos.aguaUnidade}> / {metaAguaMl}ml</Text>
              </Text>
              <SymbolView name="pencil" size={12} tintColor={cores.textoSecundario} />
            </TouchableOpacity>
          </View>

          {/* Barra contínua de água */}
          <View style={estilos.barraFundoAgua}>
            <View
              style={[
                estilos.barraProgressoAgua,
                { width: `${Math.min((aguaConsumidaMl / metaAguaMl) * 100, 100)}%` },
              ]}
            />
          </View>

          {/* Adicionar consumo (+250ml, +500ml, +1L) */}
          <Text style={estilos.subtituloAguaAcao}>Adicionar consumo:</Text>
          <View style={estilos.rowIncrementosAgua}>
            <TouchableOpacity style={estilos.btnIncrementoAgua} onPress={() => adicionarAgua(250)}>
              <Text style={estilos.txtIncrementoAgua}>+ 250ml</Text>
            </TouchableOpacity>
            <TouchableOpacity style={estilos.btnIncrementoAgua} onPress={() => adicionarAgua(500)}>
              <Text style={estilos.txtIncrementoAgua}>+ 500ml</Text>
            </TouchableOpacity>
            <TouchableOpacity style={estilos.btnIncrementoAgua} onPress={() => adicionarAgua(1000)}>
              <Text style={estilos.txtIncrementoAgua}>+ 1L</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={estilos.btnEditarMetaAgua}
              onPress={() => setModalMetaAguaVisivel(true)}
            >
              <Text style={estilos.txtEditarMetaAgua}>Meta</Text>
            </TouchableOpacity>
          </View>

          {/* Rodada 2 — Ajuste 2: Remover consumo (-250ml, -500ml, -1L) */}
          <Text style={estilos.subtituloAguaAcaoRemover}>Retirar consumo (função inversa):</Text>
          <View style={estilos.rowIncrementosAgua}>
            <TouchableOpacity style={estilos.btnRemoverAgua} onPress={() => removerAgua(250)}>
              <Text style={estilos.txtRemoverAgua}>- 250ml</Text>
            </TouchableOpacity>
            <TouchableOpacity style={estilos.btnRemoverAgua} onPress={() => removerAgua(500)}>
              <Text style={estilos.txtRemoverAgua}>- 500ml</Text>
            </TouchableOpacity>
            <TouchableOpacity style={estilos.btnRemoverAgua} onPress={() => removerAgua(1000)}>
              <Text style={estilos.txtRemoverAgua}>- 1L</Text>
            </TouchableOpacity>
          </View>
        </CardVidro>

        {/* ── Próxima Sessão de Treino (Rodada 5 — Ajuste 3: Somente visualização) ── */}
        <Text style={estilos.secaoTitulo}>Próxima Sessão</Text>
        <View>
          <CardVidro semBorda estilo={estilos.cardTreino}>
            <View style={estilos.rowTreino}>
              <View style={estilos.colTreino}>
                <Text style={estilos.badgeTreino}>HOJE</Text>
                <Text style={estilos.treinoTitulo}>{treinoHojeTitulo}</Text>
                <Text style={estilos.treinoSub}>{treinoHojeSub}</Text>
                {kcalTreinoHoje !== null ? (
                  <Text style={estilos.treinoSub}>
                    {`Concluído · ${formatarKcalEstimada(kcalTreinoHoje)}`}
                  </Text>
                ) : null}
              </View>
              <View style={estilos.iconeTreinoContainer}>
                <SymbolView name="bolt.fill" size={20} tintColor={cores.destaque} />
              </View>
            </View>

            {/* Sem treino hoje, o botão leva à aba Treino em vez de abrir um treino qualquer. */}
            <BotaoPrimario
              texto={treinoHojeId ? 'Iniciar Treino ao Vivo' : 'Ver treinos'}
              aoPresionar={() =>
                treinoHojeId
                  ? router.push({ pathname: '/treino-ao-vivo', params: { treinoId: treinoHojeId } })
                  : router.push('/(tabs)/treino')
              }
              estilo={estilos.botaoIniciar}
            />
          </CardVidro>
        </View>
      </ScrollView>

      {/* ── Modal Editar Meta de Água ─────────────────────── */}
      <Modal visible={modalMetaAguaVisivel} animationType="slide" transparent statusBarTranslucent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={estilos.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalMetaAguaVisivel(false)}
          />
          <BlurView intensity={80} tint={escuro ? 'dark' : 'light'} style={estilos.modalCard}>
            <View style={estilos.modalHandle} />
            <Text style={estilos.modalTitulo}>Editar Meta de Água</Text>

            <TextInput
              style={estilos.input}
              placeholder="Meta em ml (ex: 2500)"
              placeholderTextColor={cores.textoSecundario}
              keyboardType="number-pad"
              value={novaMetaAguaStr}
              onChangeText={setNovaMetaAguaStr}
              autoFocus
            />

            <View style={estilos.modalAcoes}>
              <TouchableOpacity
                onPress={() => setModalMetaAguaVisivel(false)}
                style={estilos.btnCancelar}
              >
                <Text style={estilos.txtCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={salvarMetaAgua} style={estilos.btnSalvar}>
                <Text style={estilos.txtSalvar}>Salvar Meta</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Modal Registrar Peso ────────────────────────────── */}
      <Modal visible={modalPesoVisivel} animationType="slide" transparent statusBarTranslucent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={estilos.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalPesoVisivel(false)}
          />
          <BlurView intensity={80} tint={escuro ? 'dark' : 'light'} style={estilos.modalCard}>
            <View style={estilos.modalHandle} />
            <Text style={estilos.modalTitulo}>Registrar Peso Atual</Text>

            <TextInput
              style={estilos.input}
              placeholder="Peso em kg (ex: 85.0)"
              placeholderTextColor={cores.textoSecundario}
              keyboardType="decimal-pad"
              value={novoPesoStr}
              onChangeText={setNovoPesoStr}
              autoFocus
            />

            <View style={estilos.modalAcoes}>
              <TouchableOpacity
                onPress={() => setModalPesoVisivel(false)}
                style={estilos.btnCancelar}
              >
                <Text style={estilos.txtCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={lidarComSalvarPeso} style={estilos.btnSalvar}>
                <Text style={estilos.txtSalvar}>Salvar Peso</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const criarEstilos = (cores: CoresTema) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: cores.fundo,
    },
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
    saudacao: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.titulo,
      fontWeight: PesoFonte.bold,
      color: cores.texto,
    },
    dataAtual: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Fonte.label,
      color: cores.textoSecundario,
      marginTop: 3,
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

    cardCalorias: {
      marginBottom: 20,
      marginHorizontal: -20,
    },
    rowCalorias: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
    },
    colAnelCalorias: {
      flexShrink: 0,
      maxWidth: '45%',
    },
    colInfoCalorias: {
      flex: 1,
    },
    labelCalorias: {
      fontFamily: FamiliaFonte.semibold,
      fontSize: Fonte.micro,
      color: cores.textoSecundario,
      fontWeight: PesoFonte.semibold,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 4,
    },
    valorCalorias: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.display,
      fontWeight: PesoFonte.bold,
      color: cores.texto,
      letterSpacing: -0.5,
    },
    metaCalorias: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Fonte.micro,
      color: cores.textoSecundario,
      marginBottom: 10,
    },
    barraFundo: {
      height: 3,
      backgroundColor: cores.destaqueSuave,
      borderRadius: 2,
      overflow: 'hidden',
      marginBottom: 5,
    },
    barraProgresso: {
      height: '100%',
      backgroundColor: cores.destaque,
      borderRadius: 2,
    },
    textoPorcentagem: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Fonte.micro,
      color: cores.textoSecundario,
    },

    secaoTitulo: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.label,
      fontWeight: PesoFonte.bold,
      color: cores.textoSecundario,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: Espacamento.md,
      marginTop: 12,
    },
    gridMacros: {
      flexDirection: 'row',
      gap: Espacamento.sm,
      marginBottom: 16,
    },
    cardMacro: {
      flex: 1,
      padding: Espacamento.md,
    },
    rowMacroTopo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginBottom: 6,
    },
    macroNome: {
      fontSize: Fonte.micro,
      color: cores.textoSecundario,
      fontFamily: FamiliaFonte.regular,
    },
    macroValor: {
      fontSize: 18,
      fontFamily: FamiliaFonte.bold,
      fontWeight: PesoFonte.bold,
      color: cores.texto,
    },
    macroUnidade: {
      fontSize: Fonte.micro,
      color: cores.textoSecundario,
      fontFamily: FamiliaFonte.regular,
    },
    barraFundoMacro: {
      height: 2,
      backgroundColor: cores.destaqueSuave,
      borderRadius: 1,
      overflow: 'hidden',
      marginTop: 8,
      marginBottom: 4,
    },
    barraProgressoMacro: {
      height: '100%',
      backgroundColor: cores.destaque,
      borderRadius: 1,
    },
    macroMeta: {
      fontSize: Fonte.micro,
      color: cores.textoSecundario,
      fontFamily: FamiliaFonte.regular,
    },

    cardEvolucao: {
      marginVertical: 12,
      marginHorizontal: -20,
      padding: 16,
    },
    headerEvolucao: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
    },
    tituloEvolucao: {
      flexShrink: 1,
      fontFamily: FamiliaFonte.bold,
      fontSize: Tipografia.subtitulo,
      fontWeight: PesoFonte.bold,
      color: cores.texto,
    },
    btnNovoPeso: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: cores.elevada,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
    },
    txtNovoPeso: {
      fontFamily: FamiliaFonte.semibold,
      fontSize: Fonte.micro,
      color: cores.destaque,
    },

    cardAgua: {
      marginBottom: 16,
      marginHorizontal: -20,
    },
    rowAguaTopo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    rowAguaInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    aguaLabel: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.corpo,
      color: cores.texto,
    },
    aguaValor: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.corpo,
      color: cores.destaque,
    },
    aguaUnidade: {
      fontFamily: FamiliaFonte.regular,
      color: cores.textoSecundario,
      fontSize: Fonte.label,
    },
    barraFundoAgua: {
      height: 6,
      backgroundColor: cores.destaqueSuave,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 14,
    },
    barraProgressoAgua: {
      height: '100%',
      backgroundColor: cores.destaque,
      borderRadius: 3,
    },
    subtituloAguaAcao: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Fonte.micro,
      color: cores.textoSecundario,
      marginBottom: 6,
    },
    subtituloAguaAcaoRemover: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Fonte.micro,
      color: cores.textoSecundario,
      marginTop: 10,
      marginBottom: 6,
    },
    rowIncrementosAgua: {
      flexDirection: 'row',
      gap: 8,
    },
    btnIncrementoAgua: {
      flex: 1,
      backgroundColor: cores.destaqueSuave,
      borderWidth: 1,
      borderColor: cores.separador,
      paddingVertical: 8,
      borderRadius: Raio.sm,
      alignItems: 'center',
    },
    txtIncrementoAgua: {
      fontFamily: FamiliaFonte.semibold,
      fontSize: Fonte.micro,
      color: cores.destaque,
    },
    btnRemoverAgua: {
      flex: 1,
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.3)',
      paddingVertical: 8,
      borderRadius: Raio.sm,
      alignItems: 'center',
    },
    txtRemoverAgua: {
      fontFamily: FamiliaFonte.semibold,
      fontSize: Fonte.micro,
      color: cores.erro,
    },
    btnEditarMetaAgua: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: cores.elevada,
      borderRadius: Raio.sm,
      alignItems: 'center',
    },
    txtEditarMetaAgua: {
      fontFamily: FamiliaFonte.semibold,
      fontSize: Fonte.micro,
      color: cores.textoSecundario,
    },

    cardTreino: {
      marginBottom: 24,
      marginHorizontal: -20,
    },
    rowTreino: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Espacamento.lg,
    },
    colTreino: {
      flex: 1,
    },
    badgeTreino: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.micro,
      color: cores.destaque,
      letterSpacing: 1,
      marginBottom: 4,
    },
    treinoTitulo: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.subtitulo,
      color: cores.texto,
    },
    treinoSub: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Fonte.label,
      color: cores.textoSecundario,
      marginTop: 3,
    },
    iconeTreinoContainer: {
      width: 36,
      height: 36,
      borderRadius: Raio.lg,
      backgroundColor: cores.destaqueSuave,
      alignItems: 'center',
      justifyContent: 'center',
    },
    botaoIniciar: {
      marginTop: 12,
    },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
    modalHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: cores.separador,
      alignSelf: 'center',
      marginBottom: 16,
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
      marginBottom: 16,
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
      marginBottom: 20,
    },
    modalAcoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
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
  });
