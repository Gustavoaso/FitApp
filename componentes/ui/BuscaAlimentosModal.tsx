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
import { CardVidro } from './CardVidro';
import { Cores, Espacamento, FamiliaFonte, Fonte, PesoFonte, Raio } from '../../constantes/Cores';
import { formatarCalorias } from '@fitapp/utilidades';
import { repositorioDieta, type ReceitaUsuario } from '../../servicos/repositorio';

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
  const [termo, setTermo] = useState('');
  const [abaAtiva, setAbaAtiva] = useState<typeof ABAS[number]['chave']>('recentes');
  const [baseAlimentos, setBaseAlimentos] = useState<AlimentoBusca[]>([]);
  const [favoritos, setFavoritos] = useState<AlimentoBusca[]>([]);
  const [receitas, setReceitas] = useState<ReceitaUsuario[]>([]);
  const [itensSelecionadosReceita, setItensSelecionadosReceita] = useState<AlimentoBusca[]>([]);
  const [nomeReceita, setNomeReceita] = useState('');
  const [editandoReceita, setEditandoReceita] = useState(false);

  useEffect(() => {
    if (!visivel) return;
    setTermo('');
    setAbaAtiva('recentes');
    setItensSelecionadosReceita([]);
    setNomeReceita('');
    setEditandoReceita(false);
    carregarDados();
  }, [visivel]);

  const carregarDados = async () => {
    const [alimentos, favs, receitasUsuario] = await Promise.all([
      repositorioDieta.buscarAlimentosRecentes(),
      repositorioDieta.buscarFavoritosUsuario(),
      repositorioDieta.buscarReceitasUsuario(),
    ]);
    const favsIds = new Set((favs || []).map((f: any) => String(f.id)));
    setBaseAlimentos((alimentos || []).map((item: any, idx: number) => ({
      ...item,
      id: String(item.id || `base-${idx}`),
      favorito: favsIds.has(String(item.id)),
      verificado: Boolean(item.id_externo),
    })));
    setFavoritos((favs || []).map((item: any, idx: number) => ({
      ...item,
      id: String(item.id || `fav-${idx}`),
      favorito: true,
      verificado: Boolean(item.id_externo),
    })));
    setReceitas(receitasUsuario || []);
  };

  useEffect(() => {
    const carregarPesquisa = async () => {
      if (!termo.trim()) return;
      const alimentos = await repositorioDieta.buscarBaseAlimentos(termo.trim(), 120);
      const favsIds = new Set(favoritos.map((f) => String(f.id)));
      setBaseAlimentos((alimentos || []).map((item: any, idx: number) => ({
        ...item,
        id: String(item.id || `busca-${idx}`),
        favorito: favsIds.has(String(item.id)),
        verificado: Boolean(item.id_externo),
      })));
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
        : [...prev, item]
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
    <Modal visible={visivel} animationType="slide" transparent statusBarTranslucent onRequestClose={onFechar}>
      <View style={estilos.overlay}>
        <View style={estilos.sheet}>
          <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
            <View style={estilos.header}>
              <TouchableOpacity onPress={onFechar} style={estilos.fechar} activeOpacity={0.7} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <SymbolView name="xmark" size={18} tintColor={Cores.texto.principal} weight="bold" />
              </TouchableOpacity>
              <View style={estilos.headerCentro}>
                <Text style={estilos.headerTitulo}>{refeicaoAtual}</Text>
                <Text style={estilos.headerSubtitulo}>Buscar, favoritar e montar receitas</Text>
              </View>
              <View style={{ width: 40 }} />
            </View>

            <View style={estilos.seletorContainer}>
              <Text style={estilos.label}>Refeição</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.chipsContainer}>
                {refeicoesDisponiveis.map((item) => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => onSelecionarRefeicao(item)}
                    style={[estilos.chip, item === refeicaoAtual && estilos.chipAtivo]}
                  >
                    <Text style={[estilos.chipTexto, item === refeicaoAtual && estilos.chipTextoAtivo]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={estilos.buscaBox}>
              <SymbolView name="magnifyingglass" size={18} tintColor={Cores.texto.secundario} />
              <TextInput
                style={estilos.buscaInput}
                placeholder="Buscar alimento, marca..."
                placeholderTextColor={Cores.texto.secundario}
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
                { icon: 'plus.circle.fill', label: 'Rápido', disabled: false },
              ].map((acao) => (
                <TouchableOpacity key={acao.label} style={[estilos.quickItem, acao.disabled && estilos.quickItemDisabled]} disabled={acao.disabled}>
                  <SymbolView name={acao.icon as any} size={18} tintColor={Cores.accent} />
                  <Text style={estilos.quickTexto}>{acao.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={estilos.abas}>
              {ABAS.map((aba) => (
                <TouchableOpacity key={aba.chave} onPress={() => setAbaAtiva(aba.chave)} style={[estilos.aba, abaAtiva === aba.chave && estilos.abaAtiva]}>
                  <Text style={[estilos.abaTexto, abaAtiva === aba.chave && estilos.abaTextoAtiva]}>{aba.label}</Text>
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
                    placeholderTextColor={Cores.texto.secundario}
                    value={nomeReceita}
                    onChangeText={setNomeReceita}
                  />
                  <View style={estilos.rowAcoes}>
                    <TouchableOpacity style={estilos.btnSecundario} onPress={() => setEditandoReceita((v) => !v)}>
                      <Text style={estilos.btnSecundarioTexto}>{editandoReceita ? 'Concluir seleção' : 'Selecionar itens'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={estilos.btnPrimario} onPress={salvarNovaReceita}>
                      <Text style={estilos.btnPrimarioTexto}>Salvar</Text>
                    </TouchableOpacity>
                  </View>
                  {itensSelecionadosReceita.length > 0 ? (
                    <Text style={estilos.composerMeta}>{itensSelecionadosReceita.length} item(ns) selecionado(s)</Text>
                  ) : (
                    <Text style={estilos.composerMeta}>Toque em “Selecionar itens” e depois no + dos alimentos.</Text>
                  )}
                </CardVidro>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={estilos.lista}>
                  {receitas.length === 0 ? (
                    <CardVidro semBorda estilo={estilos.vazio}>
                      <Text style={estilos.vazioTitulo}>Nenhuma receita criada</Text>
                      <Text style={estilos.vazioSubtitulo}>Monte sua primeira receita com os alimentos da base.</Text>
                    </CardVidro>
                  ) : receitas.map((receita) => (
                    <CardVidro key={receita.id} semBorda estilo={estilos.item}>
                      <Text style={estilos.itemNome}>{receita.nome}</Text>
                      <Text style={estilos.itemSub}>{receita.alimentos.length} itens • {formatarCalorias(Number(receita.total_calorias || 0))}</Text>
                    </CardVidro>
                  ))}
                </ScrollView>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={estilos.lista}>
                {(abaAtiva === 'favoritos' ? listaFavoritos : listaBase).slice(0, 45).map((item) => {
                  const favorito = Boolean(item.favorito);
                  return (
                    <CardVidro key={item.id} semBorda estilo={estilos.item}>
                      <View style={estilos.itemLinha}>
                        <View style={{ flex: 1 }}>
                          <View style={estilos.itemTituloLinha}>
                            <Text style={estilos.itemNome}>{item.nome}</Text>
                            {item.verificado ? <SymbolView name="checkmark.seal.fill" size={14} tintColor="#22C55E" /> : null}
                            {favorito ? <SymbolView name="heart.fill" size={14} tintColor="#EF4444" /> : null}
                          </View>
                          <Text style={estilos.itemSub}>{formatarCalorias(Number(item.calorias_100g || 0))} • {item.porcao_descricao || '100g'}</Text>
                          <Text style={estilos.itemMeta}>{(item as any).marca || item.categoria || 'Sem marca'} • {Number(item.proteinas_100g || 0)}P {Number(item.carboidratos_100g || 0)}C {Number(item.gorduras_100g || 0)}G</Text>
                        </View>
                        <View style={estilos.ladoBotoes}>
                          <TouchableOpacity
                            style={estilos.botaoIcone}
                            onPress={() => {
                              const novoEstado = !favorito;
                              setBaseAlimentos((itens) => itens.map((alimento) =>
                                alimento.id === item.id ? { ...alimento, favorito: novoEstado } : alimento
                              ));
                              setFavoritos((itens) => novoEstado
                                ? [...itens.filter((alimento) => alimento.id !== item.id), { ...item, favorito: true }]
                                : itens.filter((alimento) => alimento.id !== item.id)
                              );
                              void onFavoritarAlimento(item, novoEstado);
                            }}
                          >
                            <SymbolView name={favorito ? 'heart.fill' : 'heart'} size={14} tintColor={favorito ? '#EF4444' : Cores.accent} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={estilos.botaoAdicionar}
                            onPress={() => editandoReceita ? alternarSelecionadoReceita(item) : onAdicionarAlimento(item)}
                          >
                            <SymbolView name="plus" size={16} tintColor="#080A0E" weight="bold" />
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
    </Modal>
  );
}

const estilos = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)' },
  sheet: { flex: 1, backgroundColor: 'rgba(10, 12, 16, 0.98)', paddingHorizontal: Espacamento.lg },
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
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
    fontSize: 12,
    color: Cores.accent,
  },
  headerCentro: { alignItems: 'center' },
  headerTitulo: { fontFamily: FamiliaFonte.bold, fontSize: Fonte.subtitulo, color: Cores.accent, fontWeight: PesoFonte.bold },
  headerSubtitulo: { fontFamily: FamiliaFonte.regular, fontSize: Fonte.micro, color: Cores.texto.secundario, marginTop: 2 },
  seletorContainer: { marginBottom: 14 },
  label: { fontFamily: FamiliaFonte.medio, fontSize: 12, color: Cores.texto.secundario, marginBottom: 8 },
  chipsContainer: { gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: Raio.full, backgroundColor: Cores.fundo.elevada },
  chipAtivo: { backgroundColor: Cores.accentSuave, borderWidth: 1, borderColor: Cores.accentBorda },
  chipTexto: { fontFamily: FamiliaFonte.medio, fontSize: 12, color: Cores.texto.secundario },
  chipTextoAtivo: { color: Cores.accent },
  buscaBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Cores.fundo.superficie, borderRadius: Raio.full, paddingHorizontal: 16, height: 54, borderWidth: 1, borderColor: Cores.borda.sutil, marginBottom: 14 },
  buscaInput: { flex: 1, color: Cores.texto.principal, fontFamily: FamiliaFonte.regular, fontSize: Fonte.corpo },
  quickGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  quickItem: { flex: 1, minHeight: 72, borderRadius: 18, backgroundColor: Cores.fundo.elevada, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10 },
  quickItemDisabled: { opacity: 0.45 },
  quickTexto: { fontFamily: FamiliaFonte.medio, fontSize: 11, color: Cores.accent, textAlign: 'center' },
  abas: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  aba: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: Raio.full, backgroundColor: Cores.fundo.elevada },
  abaAtiva: { backgroundColor: Cores.accentSuave, borderWidth: 1, borderColor: Cores.accentBorda },
  abaTexto: { fontFamily: FamiliaFonte.medio, fontSize: 12, color: Cores.texto.secundario },
  abaTextoAtiva: { color: Cores.accent },
  composer: { padding: 16, marginBottom: 10 },
  secaoTexto: { fontFamily: FamiliaFonte.bold, color: Cores.texto.principal, fontSize: 16 },
  inputReceita: { backgroundColor: Cores.fundo.elevada, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, color: Cores.texto.principal, marginTop: 10 },
  rowAcoes: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btnSecundario: { flex: 1, borderRadius: 14, backgroundColor: Cores.fundo.elevada, paddingVertical: 12, alignItems: 'center' },
  btnSecundarioTexto: { fontFamily: FamiliaFonte.bold, color: Cores.accent, fontSize: 12 },
  btnPrimario: { flex: 1, borderRadius: 14, backgroundColor: Cores.accent, paddingVertical: 12, alignItems: 'center' },
  btnPrimarioTexto: { fontFamily: FamiliaFonte.bold, color: '#080A0E', fontSize: 12 },
  composerMeta: { fontFamily: FamiliaFonte.regular, color: Cores.texto.secundario, fontSize: 12, marginTop: 10 },
  lista: { paddingBottom: 28 },
  item: { marginBottom: 10, padding: 14 },
  itemLinha: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemTituloLinha: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemNome: { fontFamily: FamiliaFonte.bold, fontSize: 14, color: Cores.texto.principal, fontWeight: PesoFonte.bold },
  itemSub: { fontFamily: FamiliaFonte.regular, fontSize: 12, color: Cores.texto.secundario, marginTop: 4 },
  itemMeta: { fontFamily: FamiliaFonte.regular, fontSize: 11, color: Cores.texto.desabilitado, marginTop: 4 },
  ladoBotoes: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  botaoIcone: { width: 38, height: 38, borderRadius: Raio.full, backgroundColor: Cores.fundo.elevada, alignItems: 'center', justifyContent: 'center' },
  botaoAdicionar: { width: 40, height: 40, borderRadius: Raio.full, backgroundColor: Cores.accent, alignItems: 'center', justifyContent: 'center' },
  vazio: { padding: 18, alignItems: 'center' },
  vazioTitulo: { fontFamily: FamiliaFonte.bold, color: Cores.texto.principal, fontSize: 14 },
  vazioSubtitulo: { fontFamily: FamiliaFonte.regular, color: Cores.texto.secundario, fontSize: 12, marginTop: 4, textAlign: 'center' },
});
