// ============================================================
// TELA: Dieta / Diário Alimentar (app/(tabs)/dieta.tsx)
// ============================================================
// Design reestruturado totalmente inspirado no MyFitnessPal
// mantendo a estética Liquid Glass Dark UI do FitApp.
// ============================================================

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { CardVidro, BotaoPrimario } from '@/compartilhado/ui';
import { CardRefeicao } from './CardRefeicao';
import { BuscaAlimentosModal } from './BuscaAlimentosModal';
import { CoresTema, CoresMacros, Espacamento, FamiliaFonte, Fonte, PesoFonte, Raio } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import { formatarCalorias } from '@/compartilhado/utilidades';
import { obterHistoricoDieta, salvarHistoricoDieta, RegistroRefeicaoDiaria } from '@/compartilhado/servicos/historico-servico';
import { repositorioPlano, repositorioDieta, type ReceitaUsuario } from '@/compartilhado/servicos/repositorio';
import { atualizarContagemRefeicao, calcularAderenciaSemanal } from '@/compartilhado/servicos/progresso-servico';
import type { AlimentoBusca } from './BuscaAlimentosModal';
import type { PlanoIAGerado } from '@/compartilhado/tipos';

interface RefeicaoDiaria {
  id: string;
  nome: string;
  icone: string;
  horario: string;
  concluida: boolean;
  alimentos: Array<{
    id: string;
    nome: string;
    porcao: string;
    calorias: number;
    proteinas: number;
    carbos: number;
    gorduras: number;
  }>;
}

const REFEICOES_BASE: RefeicaoDiaria[] = [
  { id: 'cafe', nome: 'Café da Manhã', icone: 'cup.and.saucer.fill', horario: '07:30', concluida: false, alimentos: [] },
  { id: 'almoco', nome: 'Almoço', icone: 'fork.knife', horario: '12:30', concluida: false, alimentos: [] },
  { id: 'lanche', nome: 'Lanche', icone: 'takeoutbag.and.cup.and.straw.fill', horario: '16:00', concluida: false, alimentos: [] },
  { id: 'jantar', nome: 'Jantar', icone: 'moon.stars.fill', horario: '19:30', concluida: false, alimentos: [] },
];

const ABAS = [
  { chave: 'diario', label: 'Diário de Hoje' },
  { chave: 'planejado', label: 'Plano Semanal' },
] as const;

const DIAS_SEMANA_PLANO = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

function converterParaResumo(item: any): RefeicaoDiaria['alimentos'][number] {
  return {
    id: String(item.id || item.id_externo || `${item.nome}-${Date.now()}`),
    nome: item.nome,
    porcao: item.porcao || item.porcao_descricao || '100g',
    calorias: Number(item.calorias || item.calorias_100g || 0),
    proteinas: Number(item.proteinas || item.proteinas_100g || 0),
    carbos: Number(item.carbos || item.carboidratos_100g || 0),
    gorduras: Number(item.gorduras || item.gorduras_100g || 0),
  };
}

export default function TelaDieta() {
  const { cores } = useTema();
  const estilos = useMemo(() => criarEstilos(cores), [cores]);
  const [dataSelecionada, setDataSelecionada] = useState(() => new Date().toISOString().split('T')[0]);
  const [refeicoes, setRefeicoes] = useState<RefeicaoDiaria[]>(REFEICOES_BASE);
  const [refeicaoAtual, setRefeicaoAtual] = useState('Café da Manhã');
  const [refeicaoExpandidaId, setRefeicaoExpandidaId] = useState<string | null>(null);

  // Alternância de unidades nos macros (gramas ou %)
  const [modoExibicaoMacros, setModoExibicaoMacros] = useState<'g' | '%'>('g');

  const [modalBuscaVisivel, setModalBuscaVisivel] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<'diario' | 'planejado'>('diario');
  const [metaCalorias, setMetaCalorias] = useState(2400);
  const [metaProteinas, setMetaProteinas] = useState(160);
  const [metaCarbos, setMetaCarbos] = useState(280);
  const [metaGorduras, setMetaGorduras] = useState(72);
  const [estatisticas, setEstatisticas] = useState<{ refeicoesConcluidas: number; totalRefeicoesPrevistas: number; porcentagemAderenciaGeral: number } | null>(null);
  const [planoBase, setPlanoBase] = useState<PlanoIAGerado | null>(null);
  const [planoEditavel, setPlanoEditavel] = useState<PlanoIAGerado | null>(null);
  const [salvandoPlano, setSalvandoPlano] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      carregarDados();
    }, [dataSelecionada])
  );

  const carregarDados = async () => {
    const metas = await repositorioPlano.obterMetasAtivasUsuario();
    if (metas) {
      setMetaCalorias(metas.caloriasMeta || 2400);
      setMetaProteinas(metas.proteinaMeta || 160);
      setMetaCarbos(metas.carboidratoMeta || 280);
      setMetaGorduras(metas.gorduraMeta || 72);
    }

    const salvo = await obterHistoricoDieta(dataSelecionada);
    if (salvo && salvo.length > 0) {
      setRefeicoes(
        REFEICOES_BASE.map((ref) => {
          const encontrado = salvo.find((r) => r.idRefeicao === ref.nome);
          return encontrado
            ? {
              ...ref,
              concluida: encontrado.concluida,
              alimentos: (encontrado.alimentos || []).map(converterParaResumo),
            }
            : { ...ref, alimentos: [] };
        })
      );
    } else {
      setRefeicoes(REFEICOES_BASE.map(r => ({ ...r, alimentos: [] })));
    }

    const stats = await calcularAderenciaSemanal();
    setEstatisticas(stats);

    const editavel = await repositorioDieta.buscarPlanoDietaEditavelAtivo();
    if (editavel?.plano_json) {
      setPlanoBase(editavel.plano_json);
      setPlanoEditavel(editavel.plano_json);
      return;
    }

    const ultimoPlano = await repositorioDieta.buscarUltimoPlanoIA();
    if (ultimoPlano?.plano_gerado) {
      setPlanoBase(ultimoPlano.plano_gerado);
      setPlanoEditavel(ultimoPlano.plano_gerado);
    }
  };

  // Navegação de datas (< Hoje >)
  const mudarData = (dias: number) => {
    const d = new Date(dataSelecionada + 'T12:00:00');
    d.setDate(d.getDate() + dias);
    setDataSelecionada(d.toISOString().split('T')[0]);
  };

  const ehHoje = dataSelecionada === new Date().toISOString().split('T')[0];
  const textoDataHeader = useMemo(() => {
    if (ehHoje) return 'Hoje';
    const d = new Date(dataSelecionada + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
  }, [dataSelecionada, ehHoje]);

  const totais = useMemo(() => {
    return refeicoes.reduce(
      (acc, ref) => ({
        calorias: acc.calorias + ref.alimentos.reduce((s, a) => s + a.calorias, 0),
        proteinas: acc.proteinas + ref.alimentos.reduce((s, a) => s + a.proteinas, 0),
        carbos: acc.carbos + ref.alimentos.reduce((s, a) => s + a.carbos, 0),
        gorduras: acc.gorduras + ref.alimentos.reduce((s, a) => s + a.gorduras, 0),
      }),
      { calorias: 0, proteinas: 0, carbos: 0, gorduras: 0 }
    );
  }, [refeicoes]);

  const caloriasRestantes = Math.max(0, metaCalorias - totais.calorias);
  const pctCalorias = Math.min(100, Math.round((totais.calorias / (metaCalorias || 1)) * 100));

  const salvarDia = async (atualizadas: RefeicaoDiaria[]) => {
    setRefeicoes(atualizadas);

    const paraSalvar: RegistroRefeicaoDiaria[] = atualizadas.map((r) => ({
      idRefeicao: r.nome,
      data: dataSelecionada,
      concluida: r.concluida,
      alimentos: r.alimentos.map((a) => ({
        id: a.id,
        nome: a.nome,
        porcao: a.porcao,
        calorias: a.calorias,
        proteinas: a.proteinas,
        carbos: a.carbos,
        gorduras: a.gorduras,
      })),
    }));

    await salvarHistoricoDieta(dataSelecionada, paraSalvar);
    await repositorioDieta.salvarDietaDoDia(dataSelecionada, paraSalvar);
    for (const refeicao of atualizadas) {
      await atualizarContagemRefeicao(dataSelecionada, refeicao.nome, refeicao.alimentos.length > 0);
    }
  };

  const abrirBuscaNaRefeicao = (nome: string) => {
    setRefeicaoAtual(nome);
    setModalBuscaVisivel(true);
  };

  const adicionarAlimento = async (alimento: AlimentoBusca) => {
    const item = converterParaResumo(alimento);
    const atualizadas = refeicoes.map((ref) =>
      ref.nome === refeicaoAtual ? { ...ref, alimentos: [...ref.alimentos, item] } : ref
    );
    await salvarDia(atualizadas);
    setModalBuscaVisivel(false);
  };

  // Recurso "Copiar de outro dia" (Copy from)
  const lidarComCopiarRefeicao = async (nomeRefeicao: string) => {
    const d = new Date(dataSelecionada + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    const dataOntem = d.toISOString().split('T')[0];

    Alert.alert(
      'Copiar Refeição',
      `Deseja copiar o ${nomeRefeicao} cadastrado em ${dataOntem.slice(8, 10)}/${dataOntem.slice(5, 7)} para o dia de hoje?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Copiar de Ontem',
          onPress: async () => {
            const sucesso = await repositorioDieta.copiarRefeicaoDeData(dataOntem, dataSelecionada, nomeRefeicao);
            if (sucesso) {
              await carregarDados();
              Alert.alert('Sucesso!', `${nomeRefeicao} copiado com sucesso.`);
            } else {
              Alert.alert('Aviso', `Nenhum alimento registrado no ${nomeRefeicao} de ontem.`);
            }
          },
        },
      ]
    );
  };

  const favoritarAlimento = async (alimento: AlimentoBusca, favorito: boolean) => {
    await repositorioDieta.alternarFavoritoAlimento(alimento.id, favorito);
  };

  const salvarReceita = async (receita: Omit<ReceitaUsuario, 'id'>) => {
    await repositorioDieta.salvarReceitaUsuario(receita as any);
  };

  const planoParaExibir = planoEditavel || planoBase;
  const refeicoesPlanejadas = planoParaExibir?.dieta?.refeicoes || [];

  const salvarPlanoManualmente = async () => {
    if (!planoEditavel) return;
    setSalvandoPlano(true);
    try {
      await repositorioDieta.salvarPlanoDietaEditavel(planoEditavel, null);
      Alert.alert('Plano salvo', 'As alterações do planejamento alimentar foram salvas.');
    } finally {
      setSalvandoPlano(false);
    }
  };

  const refeicoesDisponiveis = refeicoes.map((r) => r.nome);

  return (
    <View style={estilos.container}>
      <ScrollView
        contentContainerStyle={estilos.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >

        {/* ── Top Bar de Navegação de Datas (< Hoje >) ───────────────────────────── */}
        <View style={estilos.topBarData}>
          <TouchableOpacity onPress={() => mudarData(-1)} style={estilos.btnSetaData}>
            <SymbolView name="chevron.left" size={16} tintColor={cores.texto} weight="bold" />
          </TouchableOpacity>

          <TouchableOpacity style={estilos.seletorDataCentral} onPress={() => setDataSelecionada(new Date().toISOString().split('T')[0])}>
            <SymbolView name="calendar" size={16} tintColor={cores.destaque} />
            <Text style={estilos.txtDataCentral}>{textoDataHeader}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => mudarData(1)} style={estilos.btnSetaData}>
            <SymbolView name="chevron.right" size={16} tintColor={cores.texto} weight="bold" />
          </TouchableOpacity>
        </View>

        {/* ── MyFitnessPal Card Header 1: Calories Consumed & Remaining (Left) ── */}
        <CardVidro semBorda estilo={estilos.cardCaloriasMFP}>
          <View style={estilos.rowHeaderCalorias}>
            <View>
              <Text style={estilos.labelKcalMFP}>Calorias</Text>
              <Text style={estilos.valKcalMFP}>
                {totais.calorias.toLocaleString()} <Text style={estilos.subValKcal}>/ {metaCalorias.toLocaleString()}</Text>
              </Text>
            </View>

            <View style={estilos.colKcalRestantes}>
              <Text style={estilos.valRestantes}>{caloriasRestantes.toLocaleString()}</Text>
              <Text style={estilos.labelRestantes}>restantes</Text>
            </View>
          </View>

          <View style={estilos.trilhoProgressoKcal}>
            <View style={[estilos.preenchimentoKcal, { width: `${pctCalorias}%` }]} />
          </View>
        </CardVidro>

        {/* ── MyFitnessPal Card Header 2: 3 Macro Progress Bars with Toggle ── */}
        <CardVidro semBorda estilo={estilos.cardMacrosMFP}>
          <View style={estilos.headerMacrosRow}>
            <Text style={estilos.tituloMacrosMFP}>Macronutrientes</Text>
            <TouchableOpacity
              style={estilos.btnToggleUnidade}
              onPress={() => setModoExibicaoMacros(prev => prev === 'g' ? '%' : 'g')}
            >
              <SymbolView name="arrow.triangle.2.circlepath" size={12} tintColor={cores.destaque} />
              <Text style={estilos.txtToggleUnidade}>{modoExibicaoMacros === 'g' ? 'Exibir %' : 'Exibir gramas'}</Text>
            </TouchableOpacity>
          </View>

          <View style={estilos.gridBarrasMacros}>
            {/* Carbos */}
            <View style={estilos.itemMacroLinha}>
              <View style={estilos.infoMacroLinha}>
                <Text style={estilos.nomeMacroLinha}>Carbos</Text>
                <Text style={estilos.valMacroLinha}>
                  {modoExibicaoMacros === 'g'
                    ? `${totais.carbos}g / ${metaCarbos}g`
                    : `${Math.round((totais.carbos / (metaCarbos || 1)) * 100)}%`}
                </Text>
              </View>
              <View style={estilos.trilhoMacro}>
                <View
                  style={[
                    estilos.preenchimentoMacro,
                    { backgroundColor: CoresMacros.carboidrato, width: `${Math.min(100, (totais.carbos / (metaCarbos || 1)) * 100)}%` },
                  ]}
                />
              </View>
            </View>

            {/* Gordura */}
            <View style={estilos.itemMacroLinha}>
              <View style={estilos.infoMacroLinha}>
                <Text style={estilos.nomeMacroLinha}>Gordura</Text>
                <Text style={estilos.valMacroLinha}>
                  {modoExibicaoMacros === 'g'
                    ? `${totais.gorduras}g / ${metaGorduras}g`
                    : `${Math.round((totais.gorduras / (metaGorduras || 1)) * 100)}%`}
                </Text>
              </View>
              <View style={estilos.trilhoMacro}>
                <View
                  style={[
                    estilos.preenchimentoMacro,
                    { backgroundColor: CoresMacros.gordura, width: `${Math.min(100, (totais.gorduras / (metaGorduras || 1)) * 100)}%` },
                  ]}
                />
              </View>
            </View>

            {/* Proteína */}
            <View style={estilos.itemMacroLinha}>
              <View style={estilos.infoMacroLinha}>
                <Text style={estilos.nomeMacroLinha}>Proteína</Text>
                <Text style={estilos.valMacroLinha}>
                  {modoExibicaoMacros === 'g'
                    ? `${totais.proteinas}g / ${metaProteinas}g`
                    : `${Math.round((totais.proteinas / (metaProteinas || 1)) * 100)}%`}
                </Text>
              </View>
              <View style={estilos.trilhoMacro}>
                <View
                  style={[
                    estilos.preenchimentoMacro,
                    { backgroundColor: CoresMacros.proteina, width: `${Math.min(100, (totais.proteinas / (metaProteinas || 1)) * 100)}%` },
                  ]}
                />
              </View>
            </View>
          </View>
        </CardVidro>

        {/* ── Banner de Busca / Leitor Rápido ── */}
        <TouchableOpacity style={estilos.bannerBuscaRapida} onPress={() => setModalBuscaVisivel(true)} activeOpacity={0.8}>
          <View style={estilos.iconBannerWrapper}>
            <SymbolView name="barcode.viewfinder" size={20} tintColor={cores.destaque} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={estilos.txtBannerTitulo}>Busca Rápida de Alimentos</Text>
            <Text style={estilos.txtBannerSub}>Consulte a Tabela TACO e adicione com 1 toque</Text>
          </View>
          <SymbolView name="chevron.right" size={14} tintColor={cores.textoSecundario} />
        </TouchableOpacity>

        {/* ── Abas: Diário de Hoje vs Plano Semanal ── */}
        <View style={estilos.abas}>
          {ABAS.map((aba) => (
            <TouchableOpacity
              key={aba.chave}
              onPress={() => setAbaAtiva(aba.chave)}
              style={[estilos.aba, abaAtiva === aba.chave && estilos.abaAtiva]}
            >
              <Text style={[estilos.abaTexto, abaAtiva === aba.chave && estilos.abaTextoAtiva]}>{aba.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Conteúdo da Aba ── */}
        {abaAtiva === 'planejado' ? (
          <CardVidro semBorda estilo={estilos.blocoPlanejado}>
            <View style={estilos.planejadoHeader}>
              <SymbolView name="sparkles" size={18} tintColor={cores.destaque} />
              <Text style={estilos.planejadoTitulo}>Estrutura planejada</Text>
            </View>
            <Text style={estilos.planejadoSub}>
              {estatisticas?.refeicoesConcluidas || 0} de {estatisticas?.totalRefeicoesPrevistas || 0} refeições registradas nesta semana
            </Text>
            <View style={estilos.timeline}>
              {DIAS_SEMANA_PLANO.map((dia) => (
                <View key={dia} style={estilos.diaPlanejadoCard}>
                  <Text style={estilos.diaPlanejadoTitulo}>{dia}</Text>
                  {refeicoesPlanejadas.map((ref, index) => (
                    <View key={`${dia}-${ref.nome}-${index}`} style={estilos.timelineCard}>
                      <View style={estilos.timelineItem}>
                        <View style={estilos.timelineDot} />
                        <View style={{ flex: 1 }}>
                          <Text style={estilos.timelineTitulo}>{ref.nome}</Text>
                          <Text style={estilos.timelineSub}>{ref.horario} • {ref.alimentos.length} itens</Text>
                          {ref.alimentos.map((alimento, alimentoIndex) => (
                            <Text key={`${alimento.nome}-${alimentoIndex}`} style={estilos.alimentoPlanejado}>
                              {alimento.nome} • {alimento.porcao} • {Math.round(alimento.calorias)} kcal
                            </Text>
                          ))}
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </View>
            <BotaoPrimario
              texto={salvandoPlano ? 'Salvando...' : 'Salvar alterações do plano'}
              aoPresionar={salvarPlanoManualmente}
              carregando={salvandoPlano}
              estilo={{ marginTop: 14 }}
            />
          </CardVidro>
        ) : (
          <View style={{ gap: 8 }}>
            <View style={estilos.headerListaRefeicoes}>
              <Text style={estilos.tituloListaRefeicoes}>Refeições</Text>
              <Text style={estilos.subListaRefeicoes}>{refeicoes.filter(r => r.alimentos.length > 0).length} de {refeicoes.length} registradas</Text>
            </View>

            {refeicoes.map((ref) => (
              <CardRefeicao
                key={ref.id}
                nome={ref.nome}
                icone={ref.icone}
                horario={ref.horario}
                alimentos={ref.alimentos}
                expandido={refeicaoExpandidaId === ref.id}
                onAdicionar={() => abrirBuscaNaRefeicao(ref.nome)}
                onAlternarExpandir={() => setRefeicaoExpandidaId(prev => prev === ref.id ? null : ref.id)}
                onCopiarDe={() => lidarComCopiarRefeicao(ref.nome)}
                onEditar={() => abrirBuscaNaRefeicao(ref.nome)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB Flutuante estilo MyFitnessPal */}
      <TouchableOpacity style={estilos.fab} onPress={() => setModalBuscaVisivel(true)} activeOpacity={0.9}>
        <SymbolView name="plus" size={28} tintColor={cores.textoSobreDestaque} weight="bold" />
      </TouchableOpacity>

      <BuscaAlimentosModal
        visivel={modalBuscaVisivel}
        refeicaoAtual={refeicaoAtual}
        refeicoesDisponiveis={refeicoesDisponiveis}
        onFechar={() => setModalBuscaVisivel(false)}
        onSelecionarRefeicao={setRefeicaoAtual}
        onAdicionarAlimento={adicionarAlimento}
        onFavoritarAlimento={favoritarAlimento}
        onSalvarReceita={salvarReceita}
      />
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
    paddingHorizontal: Espacamento.lg,
    paddingTop: Espacamento.sm, // o título grande fica no header nativo
    paddingBottom: 120,
  },

  // Seletor de Datas
  topBarData: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  btnSetaData: {
    width: 36,
    height: 36,
    borderRadius: Raio.full,
    backgroundColor: cores.elevada,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seletorDataCentral: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: cores.superficie,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Raio.full,
    borderWidth: 1,
    borderColor: cores.separador,
  },
  txtDataCentral: {
    fontFamily: FamiliaFonte.bold,
    fontSize: 14,
    color: cores.texto,
  },

  // Card Calorias MFP
  cardCaloriasMFP: {
    padding: 0,
    marginBottom: 0,
  },
  rowHeaderCalorias: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  labelKcalMFP: {
    fontFamily: FamiliaFonte.semibold,
    fontSize: 12,
    color: cores.textoSecundario,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valKcalMFP: {
    fontFamily: FamiliaFonte.bold,
    fontSize: 22,
    color: cores.texto,
    marginTop: 2,
  },
  subValKcal: {
    fontSize: 14,
    color: cores.textoSecundario,
    fontFamily: FamiliaFonte.regular,
  },
  colKcalRestantes: {
    alignItems: 'flex-end',
  },
  valRestantes: {
    fontFamily: FamiliaFonte.bold,
    fontSize: 22,
    color: cores.destaque,
    letterSpacing: -0.5,
  },
  labelRestantes: {
    fontFamily: FamiliaFonte.regular,
    fontSize: 11,
    color: cores.textoSecundario,
  },
  trilhoProgressoKcal: {
    height: 6,
    backgroundColor: cores.destaqueSuave,
    borderRadius: 3,
    overflow: 'hidden',
  },
  preenchimentoKcal: {
    height: '100%',
    backgroundColor: cores.destaque,
    borderRadius: 3,
  },

  // Card Macros MFP
  cardMacrosMFP: {
    padding: 16,
    marginBottom: 14,
  },
  headerMacrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tituloMacrosMFP: {
    fontFamily: FamiliaFonte.bold,
    fontSize: 13,
    color: cores.textoSecundario,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  btnToggleUnidade: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: cores.elevada,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Raio.sm,
  },
  txtToggleUnidade: {
    fontFamily: FamiliaFonte.semibold,
    fontSize: 11,
    color: cores.destaque,
  },
  gridBarrasMacros: {
    gap: 10,
  },
  itemMacroLinha: {
    gap: 4,
  },
  infoMacroLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nomeMacroLinha: {
    fontFamily: FamiliaFonte.regular,
    fontSize: 12,
    color: cores.texto,
  },
  valMacroLinha: {
    fontFamily: FamiliaFonte.bold,
    fontSize: 12,
    color: cores.texto,
  },
  trilhoMacro: {
    height: 4,
    backgroundColor: cores.destaqueSuave,
    borderRadius: 2,
    overflow: 'hidden',
  },
  preenchimentoMacro: {
    height: '100%',
    borderRadius: 2,
  },

  // Banner Busca Rápida
  bannerBuscaRapida: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: cores.destaqueSuave,
    borderWidth: 1,
    borderColor: cores.separador,
    borderRadius: Raio.md,
    padding: 14,
    marginBottom: 16,
  },
  iconBannerWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  txtBannerTitulo: {
    fontFamily: FamiliaFonte.bold,
    fontSize: 13,
    color: cores.texto,
  },
  txtBannerSub: {
    fontFamily: FamiliaFonte.regular,
    fontSize: 11,
    color: cores.textoSecundario,
    marginTop: 1,
  },

  // Abas
  abas: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  aba: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Raio.full,
    backgroundColor: cores.elevada,
  },
  abaAtiva: {
    backgroundColor: cores.destaqueSuave,
    borderWidth: 1,
    borderColor: cores.separador,
  },
  abaTexto: {
    fontFamily: FamiliaFonte.medio,
    color: cores.textoSecundario,
    fontSize: 12,
  },
  abaTextoAtiva: {
    color: cores.destaque,
    fontFamily: FamiliaFonte.bold,
  },

  headerListaRefeicoes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tituloListaRefeicoes: {
    fontFamily: FamiliaFonte.bold,
    fontSize: 16,
    color: cores.texto,
  },
  subListaRefeicoes: {
    fontFamily: FamiliaFonte.regular,
    fontSize: 12,
    color: cores.textoSecundario,
  },

  // Plano Semanal
  blocoPlanejado: {
    padding: 16,
    marginBottom: 12,
  },
  planejadoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planejadoTitulo: {
    fontFamily: FamiliaFonte.bold,
    color: cores.texto,
    fontSize: 16,
  },
  planejadoSub: {
    fontFamily: FamiliaFonte.regular,
    color: cores.textoSecundario,
    fontSize: 12,
    marginTop: 6,
    marginBottom: 16,
  },
  timeline: {
    gap: 10,
  },
  diaPlanejadoCard: {
    backgroundColor: cores.elevada,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  diaPlanejadoTitulo: {
    fontFamily: FamiliaFonte.bold,
    color: cores.destaque,
    fontSize: 14,
    marginBottom: 8,
  },
  timelineCard: {
    gap: 10,
    paddingBottom: 10,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: cores.separador,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: cores.destaque,
  },
  timelineTitulo: {
    fontFamily: FamiliaFonte.bold,
    color: cores.texto,
    fontSize: 13,
  },
  timelineSub: {
    fontFamily: FamiliaFonte.regular,
    color: cores.textoSecundario,
    fontSize: 11,
    marginTop: 2,
  },
  alimentoPlanejado: {
    fontFamily: FamiliaFonte.regular,
    color: cores.texto,
    fontSize: 12,
    marginTop: 5,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: cores.destaque,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
});
