// ============================================================
// COMPONENTE: BuscaAlimentosModal
// ============================================================
// Busca global da base de alimentos, favoritos e receitas do usuário.
// ============================================================

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  FlatList,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { CardVidro } from '@/compartilhado/ui/CardVidro';
import { CoresTema, Espacamento, FamiliaFonte, Fonte, PesoFonte, Raio } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import { formatarCalorias } from '@/compartilhado/utilidades';
import { repositorioDieta, type ReceitaUsuario } from '@/compartilhado/servicos/repositorio';
import { CadastroAlimentoModal } from './CadastroAlimentoModal';

export interface AlimentoBusca {
  id: string;
  nome: string;
  categoria: string;
  calorias_100g: number;
  proteinas_100g: number;
  carboidratos_100g: number;
  gorduras_100g: number;
  porcao_descricao?: string | null;
  porcao_gramas?: number | null;
  id_externo?: string | null;
  favorito?: boolean;
  verificado?: boolean;
}

interface PropsBuscaAlimentosModal {
  visivel: boolean;
  refeicaoAtual: string;
  refeicoesDisponiveis: string[];
  onFechar: () => void;
  onSelecionarRefeicao: (nome: string) => void;
  onAdicionarAlimento: (alimento: AlimentoBusca) => void;
  onFavoritarAlimento: (alimento: AlimentoBusca, favorito: boolean) => void;
  onSalvarReceita: (receita: Omit<ReceitaUsuario, 'id'>) => Promise<void>;
}

const ABAS = [
  { chave: 'recentes', label: 'Recentes' },
  { chave: 'receitas', label: 'Minhas Receitas' },
  { chave: 'favoritos', label: 'Meus Alimentos' },
] as const;

export function BuscaAlimentosModal({
  visivel,
  refeicaoAtual,
  refeicoesDisponiveis,
  onFechar,
  onSelecionarRefeicao,
  onAdicionarAlimento,
  onFavoritarAlimento,
  onSalvarReceita,
}: PropsBuscaAlimentosModal) {
  const { cores } = useTema();
  const estilos = useMemo(() => criarEstilos(cores), [cores]);
  const [termo, setTermo] = useState('');
  const [abaAtiva, setAbaAtiva] = useState<(typeof ABAS)[number]['chave']>('recentes');
  const [baseAlimentos, setBaseAlimentos] = useState<AlimentoBusca[]>([]);
  const [favoritos, setFavoritos] = useState<AlimentoBusca[]>([]);
  const [receitas, setReceitas] = useState<ReceitaUsuario[]>([]);
  const [itensSelecionadosReceita, setItensSelecionadosReceita] = useState<AlimentoBusca[]>([]);
  const [nomeReceita, setNomeReceita] = useState('');
  const [editandoReceita, setEditandoReceita] = useState(false);
  const [cadastrando, setCadastrando] = useState(false);

  // Ao abrir, volta ao estado inicial (ajuste no render, sem setState síncrono em efeito).
  const [visivelAnterior, setVisivelAnterior] = useState(visivel);
  if (visivel !== visivelAnterior) {
    setVisivelAnterior(visivel);
    if (visivel) {
      setTermo('');
      setAbaAtiva('recentes');
      setItensSelecionadosReceita([]);
      setNomeReceita('');
      setEditandoReceita(false);
    }
  }

  // setState só nos callbacks da promessa: o lint do React Compiler aceita no efeito.
  const carregarDados = () =>
    Promise.all([
      repositorioDieta.buscarAlimentosRecentes(),
      repositorioDieta.buscarFavoritosUsuario(),
      repositorioDieta.buscarReceitasUsuario(),
    ]).then(([alimentos, favs, receitasUsuario]) => {
      const favsIds = new Set((favs || []).map((f: any) => String(f.id)));
      setBaseAlimentos(
        (alimentos || []).map((item: any, idx: number) => ({
          ...item,
          id: String(item.id || `base-${idx}`),
          favorito: favsIds.has(String(item.id)),
          verificado: Boolean(item.id_externo),
        })),
      );
      setFavoritos(
        (favs || []).map((item: any, idx: number) => ({
          ...item,
          id: String(item.id || `fav-${idx}`),
          favorito: true,
          verificado: Boolean(item.id_externo),
        })),
      );
      setReceitas(receitasUsuario || []);
    });

  useEffect(() => {
    if (visivel) carregarDados();
  }, [visivel]);

  useEffect(() => {
    const carregarPesquisa = async () => {
      if (!termo.trim()) return;
      const alimentos = await repositorioDieta.buscarBaseAlimentos(termo.trim(), 120);
      const favsIds = new Set(favoritos.map((f) => String(f.id)));
      setBaseAlimentos(
        (alimentos || []).map((item: any, idx: number) => ({
          ...item,
          id: String(item.id || `busca-${idx}`),
          favorito: favsIds.has(String(item.id)),
          verificado: Boolean(item.id_externo),
        })),
      );
    };
    carregarPesquisa();
  }, [termo]);

  const listaBase = useMemo(() => {
    if (!termo.trim()) return baseAlimentos;
    return baseAlimentos;
  }, [baseAlimentos, termo]);

  const alternarSelecionadoReceita = (item: AlimentoBusca) => {
    setItensSelecionadosReceita((prev) =>
      prev.find((it) => it.id === item.id)
        ? prev.filter((it) => it.id !== item.id)
        : [...prev, item],
    );
  };

  const salvarNovaReceita = async () => {
    if (!nomeReceita.trim() || itensSelecionadosReceita.length === 0) return;
    await onSalvarReceita({
      nome: nomeReceita.trim(),
      descricao: null,
      alimentos: itensSelecionadosReceita.map((item) => ({
        id: item.id,
        nome: item.nome,
        porcao: item.porcao_descricao || '100g',
        calorias: Number(item.calorias_100g || 0),
        proteinas: Number(item.proteinas_100g || 0),
        carboidratos: Number(item.carboidratos_100g || 0),
        gorduras: Number(item.gorduras_100g || 0),
      })),
    });
    setNomeReceita('');
    setItensSelecionadosReceita([]);
    setEditandoReceita(false);
    const receitasAtualizadas = await repositorioDieta.buscarReceitasUsuario();
    setReceitas(receitasAtualizadas);
    setAbaAtiva('receitas');
  };

  const listaFavoritos = useMemo(() => {
    return favoritos.length > 0 ? favoritos : listaBase.filter((item) => item.favorito);
  }, [favoritos, listaBase]);

  return (
    <Modal
      visible={visivel}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onFechar}
    >
      <View style={estilos.overlay}>
        <View style={estilos.sheet}>
          <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
            <View style={estilos.header}>
              <TouchableOpacity
                onPress={onFechar}
                style={estilos.fechar}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <SymbolView name="xmark" size={18} tintColor={cores.texto} weight="bold" />
              </TouchableOpacity>
              <View style={estilos.headerCentro}>
                <Text style={estilos.headerTitulo}>{refeicaoAtual}</Text>
                <Text style={estilos.headerSubtitulo}>Buscar, favoritar e montar receitas</Text>
              </View>
              <View style={{ width: 40 }} />
            </View>

            <View style={estilos.seletorContainer}>
              <Text style={estilos.label}>Refeição</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={estilos.chipsContainer}
              >
                {refeicoesDisponiveis.map((item) => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => onSelecionarRefeicao(item)}
                    style={[estilos.chip, item === refeicaoAtual && estilos.chipAtivo]}
                  >
                    <Text
                      style={[estilos.chipTexto, item === refeicaoAtual && estilos.chipTextoAtivo]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={estilos.buscaBox}>
              <SymbolView name="magnifyingglass" size={18} tintColor={cores.textoSecundario} />
              <TextInput
                style={estilos.buscaInput}
                placeholder="Buscar alimento, marca..."
                placeholderTextColor={cores.textoSecundario}
                value={termo}
                onChangeText={setTermo}
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>

            <View style={estilos.quickGrid}>
              {[
                { icon: 'barcode.viewfinder', label: 'Scanner', disabled: true },
                { icon: 'mic.fill', label: 'Voz', disabled: true },
                { icon: 'camera.viewfinder', label: 'Foto/Scan', disabled: true },
                { icon: 'plus.circle.fill', label: 'Cadastrar', disabled: false },
              ].map((acao) => (
                <TouchableOpacity
                  key={acao.label}
                  style={[estilos.quickItem, acao.disabled && estilos.quickItemDisabled]}
                  disabled={acao.disabled}
                  onPress={acao.label === 'Cadastrar' ? () => setCadastrando(true) : undefined}
                >
                  <SymbolView name={acao.icon as any} size={18} tintColor={cores.destaque} />
                  <Text style={estilos.quickTexto}>{acao.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={estilos.abas}>
              {ABAS.map((aba) => (
                <TouchableOpacity
                  key={aba.chave}
                  onPress={() => setAbaAtiva(aba.chave)}
                  style={[estilos.aba, abaAtiva === aba.chave && estilos.abaAtiva]}
                >
                  <Text style={[estilos.abaTexto, abaAtiva === aba.chave && estilos.abaTextoAtiva]}>
                    {aba.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {abaAtiva === 'receitas' ? (
              <View style={{ flex: 1 }}>
                <CardVidro semBorda estilo={estilos.composer}>
                  <Text style={estilos.secaoTexto}>Criar receita</Text>
                  <TextInput
                    style={estilos.inputReceita}
                    placeholder="Nome da receita"
                    placeholderTextColor={cores.textoSecundario}
                    value={nomeReceita}
                    onChangeText={setNomeReceita}
                  />
                  <View style={estilos.rowAcoes}>
                    <TouchableOpacity
                      style={estilos.btnSecundario}
                      onPress={() => setEditandoReceita((v) => !v)}
                    >
                      <Text style={estilos.btnSecundarioTexto}>
                        {editandoReceita ? 'Concluir seleção' : 'Selecionar itens'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={estilos.btnPrimario} onPress={salvarNovaReceita}>
                      <Text style={estilos.btnPrimarioTexto}>Salvar</Text>
                    </TouchableOpacity>
                  </View>
                  {itensSelecionadosReceita.length > 0 ? (
                    <Text style={estilos.composerMeta}>
                      {itensSelecionadosReceita.length} item(ns) selecionado(s)
                    </Text>
                  ) : (
                    <Text style={estilos.composerMeta}>
                      Toque em “Selecionar itens” e depois no + dos alimentos.
                    </Text>
                  )}
                </CardVidro>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={estilos.lista}
                >
                  {receitas.length === 0 ? (
                    <CardVidro semBorda estilo={estilos.vazio}>
                      <Text style={estilos.vazioTitulo}>Nenhuma receita criada</Text>
                      <Text style={estilos.vazioSubtitulo}>
                        Monte sua primeira receita com os alimentos da base.
                      </Text>
                    </CardVidro>
                  ) : (
                    receitas.map((receita) => (
                      <CardVidro key={receita.id} semBorda estilo={estilos.item}>
                        <Text style={estilos.itemNome}>{receita.nome}</Text>
                        <Text style={estilos.itemSub}>
                          {receita.alimentos.length} itens •{' '}
                          {formatarCalorias(Number(receita.total_calorias || 0))}
                        </Text>
                      </CardVidro>
                    ))
                  )}
                </ScrollView>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={estilos.lista}
              >
                {(abaAtiva === 'favoritos' ? listaFavoritos : listaBase)
                  .slice(0, 45)
                  .map((item) => {
                    const favorito = Boolean(item.favorito);
                    return (
                      <CardVidro key={item.id} semBorda estilo={estilos.item}>
                        <View style={estilos.itemLinha}>
                          <View style={{ flex: 1 }}>
                            <View style={estilos.itemTituloLinha}>
                              <Text style={estilos.itemNome}>{item.nome}</Text>
                              {item.verificado ? (
                                <SymbolView
                                  name="checkmark.seal.fill"
                                  size={14}
                                  tintColor={cores.sucesso}
                                />
                              ) : null}
                              {favorito ? (
                                <SymbolView name="heart.fill" size={14} tintColor={cores.erro} />
                              ) : null}
                            </View>
                            <Text style={estilos.itemSub}>
                              {formatarCalorias(Number(item.calorias_100g || 0))} •{' '}
                              {item.porcao_descricao || '100g'}
                            </Text>
                            <Text style={estilos.itemMeta}>
                              {(item as any).marca || item.categoria || 'Sem marca'} •{' '}
                              {Number(item.proteinas_100g || 0)}P{' '}
                              {Number(item.carboidratos_100g || 0)}C{' '}
                              {Number(item.gorduras_100g || 0)}G
                            </Text>
                          </View>
                          <View style={estilos.ladoBotoes}>
                            <TouchableOpacity
                              style={estilos.botaoIcone}
                              onPress={() => {
                                const novoEstado = !favorito;
                                setBaseAlimentos((itens) =>
                                  itens.map((alimento) =>
                                    alimento.id === item.id
                                      ? { ...alimento, favorito: novoEstado }
                                      : alimento,
                                  ),
                                );
                                setFavoritos((itens) =>
                                  novoEstado
                                    ? [
                                        ...itens.filter((alimento) => alimento.id !== item.id),
                                        { ...item, favorito: true },
                                      ]
                                    : itens.filter((alimento) => alimento.id !== item.id),
                                );
                                void onFavoritarAlimento(item, novoEstado);
                              }}
                            >
                              <SymbolView
                                name={favorito ? 'heart.fill' : 'heart'}
                                size={14}
                                tintColor={favorito ? cores.erro : cores.destaque}
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={estilos.botaoAdicionar}
                              onPress={() =>
                                editandoReceita
                                  ? alternarSelecionadoReceita(item)
                                  : onAdicionarAlimento(item)
                              }
                            >
                              <SymbolView
                                name="plus"
                                size={16}
                                tintColor={cores.textoSobreDestaque}
                                weight="bold"
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </CardVidro>
                    );
                  })}
              </ScrollView>
            )}
          </SafeAreaView>
        </View>
      </View>
      <CadastroAlimentoModal
        visivel={cadastrando}
        onFechar={() => setCadastrando(false)}
        onCadastrado={async (criado) => {
          setCadastrando(false);
          // Já aparece em "Meus Alimentos" e pode ser adicionado à refeição.
          onFavoritarAlimento({ ...(criado as AlimentoBusca), id: String(criado.id) }, true);
          setAbaAtiva('favoritos');
          await carregarDados();
        }}
      />
    </Modal>
  );
}

const criarEstilos = (cores: CoresTema) =>
  StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)' },
    sheet: { flex: 1, backgroundColor: cores.elevada, paddingHorizontal: Espacamento.lg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: Platform.OS === 'ios' ? 54 : 20,
      marginBottom: 16,
    },
    fechar: {
      width: 40,
      height: 40,
      borderRadius: Raio.full,
      backgroundColor: cores.separador,
      borderWidth: 1,
      borderColor: cores.separador,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnFecharTexto: {
      backgroundColor: 'rgba(234, 179, 8, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(234, 179, 8, 0.3)',
      borderRadius: Raio.full,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    txtFecharTexto: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.micro,
      color: cores.destaque,
    },
    headerCentro: { alignItems: 'center' },
    headerTitulo: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.subtitulo,
      color: cores.destaque,
      fontWeight: PesoFonte.bold,
    },
    headerSubtitulo: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Fonte.micro,
      color: cores.textoSecundario,
      marginTop: 2,
    },
    seletorContainer: { marginBottom: 14 },
    label: {
      fontFamily: FamiliaFonte.medio,
      fontSize: Fonte.micro,
      color: cores.textoSecundario,
      marginBottom: 8,
    },
    chipsContainer: { gap: 8 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: Raio.full,
      backgroundColor: cores.elevada,
    },
    chipAtivo: {
      backgroundColor: cores.destaqueSuave,
      borderWidth: 1,
      borderColor: cores.separador,
    },
    chipTexto: {
      fontFamily: FamiliaFonte.medio,
      fontSize: Fonte.micro,
      color: cores.textoSecundario,
    },
    chipTextoAtivo: { color: cores.destaque },
    buscaBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: cores.superficie,
      borderRadius: Raio.full,
      paddingHorizontal: 16,
      height: 54,
      borderWidth: 1,
      borderColor: cores.separador,
      marginBottom: 14,
    },
    buscaInput: {
      flex: 1,
      color: cores.texto,
      fontFamily: FamiliaFonte.regular,
      fontSize: Fonte.corpo,
    },
    quickGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    quickItem: {
      flex: 1,
      minHeight: 72,
      borderRadius: Raio.lg,
      backgroundColor: cores.elevada,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 10,
    },
    quickItemDisabled: { opacity: 0.45 },
    quickTexto: {
      fontFamily: FamiliaFonte.medio,
      fontSize: Fonte.micro,
      color: cores.destaque,
      textAlign: 'center',
    },
    abas: { flexDirection: 'row', gap: 8, marginBottom: 14 },
    aba: {
      paddingHorizontal: 14,
      paddingVertical: 10,
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
      fontSize: Fonte.micro,
      color: cores.textoSecundario,
    },
    abaTextoAtiva: { color: cores.destaque },
    composer: { padding: 16, marginBottom: 10 },
    secaoTexto: { fontFamily: FamiliaFonte.bold, color: cores.texto, fontSize: Fonte.corpo },
    inputReceita: {
      backgroundColor: cores.elevada,
      borderRadius: Raio.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: cores.texto,
      marginTop: 10,
    },
    rowAcoes: { flexDirection: 'row', gap: 10, marginTop: 12 },
    btnSecundario: {
      flex: 1,
      borderRadius: Raio.md,
      backgroundColor: cores.elevada,
      paddingVertical: 12,
      alignItems: 'center',
    },
    btnSecundarioTexto: {
      fontFamily: FamiliaFonte.bold,
      color: cores.destaque,
      fontSize: Fonte.micro,
    },
    btnPrimario: {
      flex: 1,
      borderRadius: Raio.md,
      backgroundColor: cores.destaque,
      paddingVertical: 12,
      alignItems: 'center',
    },
    btnPrimarioTexto: {
      fontFamily: FamiliaFonte.bold,
      color: cores.textoSobreDestaque,
      fontSize: Fonte.micro,
    },
    composerMeta: {
      fontFamily: FamiliaFonte.regular,
      color: cores.textoSecundario,
      fontSize: Fonte.micro,
      marginTop: 10,
    },
    lista: { paddingBottom: 28 },
    item: { marginBottom: 10, padding: 14 },
    itemLinha: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    itemTituloLinha: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    itemNome: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.label,
      color: cores.texto,
      fontWeight: PesoFonte.bold,
    },
    itemSub: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Fonte.micro,
      color: cores.textoSecundario,
      marginTop: 4,
    },
    itemMeta: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Fonte.micro,
      color: cores.textoSecundario,
      marginTop: 4,
    },
    ladoBotoes: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    botaoIcone: {
      width: 38,
      height: 38,
      borderRadius: Raio.full,
      backgroundColor: cores.elevada,
      alignItems: 'center',
      justifyContent: 'center',
    },
    botaoAdicionar: {
      width: 40,
      height: 40,
      borderRadius: Raio.full,
      backgroundColor: cores.destaque,
      alignItems: 'center',
      justifyContent: 'center',
    },
    vazio: { padding: 18, alignItems: 'center' },
    vazioTitulo: { fontFamily: FamiliaFonte.bold, color: cores.texto, fontSize: Fonte.label },
    vazioSubtitulo: {
      fontFamily: FamiliaFonte.regular,
      color: cores.textoSecundario,
      fontSize: Fonte.micro,
      marginTop: 4,
      textAlign: 'center',
    },
  });
