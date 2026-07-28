// ============================================================
// TELA: Dieta / Nutrição (app/(tabs)/dieta.tsx)
// ============================================================
// Clean Dark UI — Ajuste 1: Botão flutuante abre menu com 3 opções:
// 1. Criar nova refeição (do zero)
// 2. Criar refeição personalizada (molde para reutilizar)
// 3. Minhas refeições (lista de refeições salvas para adicionar ao dia)
// Botão '+' nos cards continua adicionando alimentos avulsos.
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
import { BlurView } from 'expo-blur';
import { SymbolView } from 'expo-symbols';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CardVidro } from '../../componentes/ui';
import { AnelProgresso } from '../../componentes/ui/AnelProgresso';
import { Cores, Espacamento, FamiliaFonte, Fonte, PesoFonte, Raio } from '../../constantes/Cores';
import {
  obterHistoricoDieta,
  salvarHistoricoDieta,
  RegistroRefeicaoDiaria,
} from '../../servicos/historicoServico';

interface Alimento {
  id: string;
  nome: string;
  porcao: string;
  calorias: number;
  proteinas: number;
  carbos: number;
  gorduras: number;
}

interface Refeicao {
  id: string;
  nome: string;
  horario: string;
  concluida: boolean;
  alimentos: Alimento[];
}

interface RefeicaoPersonalizadaTemplate {
  id: string;
  nome: string;
  alimentos: Alimento[];
}

const DIAS_SEMANA = [
  { abrev: 'dom', diaNum: '26', data: '2026-07-26' },
  { abrev: 'seg', diaNum: '27', data: '2026-07-27' },
  { abrev: 'ter', diaNum: '28', data: '2026-07-28' },
  { abrev: 'qua', diaNum: '29', data: '2026-07-29' },
  { abrev: 'qui', diaNum: '30', data: '2026-07-30' },
  { abrev: 'sex', diaNum: '31', data: '2026-07-31' },
  { abrev: 'sáb', diaNum: '01', data: '2026-08-01' },
];

const REFEICOES_INICIAIS_PADRAO: Refeicao[] = [
  {
    id: 'ref-1',
    nome: 'Refeição 1',
    horario: 'Café da Manhã',
    concluida: true,
    alimentos: [
      { id: 'a1', nome: 'Ovos Mexidos', porcao: '3 un · 150g', calorias: 215, proteinas: 18, carbos: 2, gorduras: 15 },
      { id: 'a2', nome: 'Pão Integral', porcao: '2 fatias · 50g', calorias: 130, proteinas: 6, carbos: 24, gorduras: 2 },
    ],
  },
  {
    id: 'ref-2',
    nome: 'Refeição 2',
    horario: 'Almoço',
    concluida: true,
    alimentos: [
      { id: 'a4', nome: 'Peito de Frango Grelhado', porcao: '180g', calorias: 297, proteinas: 56, carbos: 0, gorduras: 6 },
      { id: 'a5', nome: 'Feijão Carioca', porcao: '100g', calorias: 76, proteinas: 5, carbos: 14, gorduras: 1 },
    ],
  },
];

const TEMPLATES_PADRAO: RefeicaoPersonalizadaTemplate[] = [
  {
    id: 'tpl-1',
    nome: 'Shake Pós-Treino Proteico',
    alimentos: [
      { id: 'ta1', nome: 'Whey Protein Concentrado', porcao: '30g', calorias: 120, proteinas: 24, carbos: 3, gorduras: 2 },
      { id: 'ta2', nome: 'Banana Prata', porcao: '1 un · 100g', calorias: 89, proteinas: 1, carbos: 23, gorduras: 0 },
      { id: 'ta3', nome: 'Leite Desnatado', porcao: '200ml', calorias: 70, proteinas: 6, carbos: 10, gorduras: 0 },
    ],
  },
  {
    id: 'tpl-2',
    nome: 'Omelete de Claras com Aveia',
    alimentos: [
      { id: 'ta4', nome: 'Clara de Ovo', porcao: '4 un · 120g', calorias: 60, proteinas: 13, carbos: 1, gorduras: 0 },
      { id: 'ta5', nome: 'Farinha de Aveia', porcao: '30g', calorias: 118, proteinas: 4, carbos: 20, gorduras: 2 },
    ],
  },
];

const CHAVE_TEMPLATES = '@fitapp_refeicoes_personalizadas_v1';

export default function TelaDieta() {
  const [diaSelecionado, setDiaSelecionado] = useState('2026-07-27');

  const metaCalorias = 2200;
  const metaProteinas = 160;
  const metaCarbos = 260;
  const metaGorduras = 65;

  const [refeicoes, setRefeicoes] = useState<Refeicao[]>(REFEICOES_INICIAIS_PADRAO);
  const [templates, setTemplates] = useState<RefeicaoPersonalizadaTemplate[]>(TEMPLATES_PADRAO);

  // Modais do Ajuste 1
  const [menuOpcoesVisivel, setMenuOpcoesVisivel] = useState(false);
  const [modalCriarTemplateVisivel, setModalCriarTemplateVisivel] = useState(false);
  const [modalMinhasRefeicoesVisivel, setModalMinhasRefeicoesVisivel] = useState(false);

  // Modal para adicionar alimento avulso (botão '+' do card)
  const [modalAlimentoVisivel, setModalAlimentoVisivel] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const [refeicaoAlvo, setRefeicaoAlvo] = useState<string | null>(null);

  // Form do novo template personalizado
  const [nomeNovoTemplate, setNomeNovoTemplate] = useState('');

  useEffect(() => {
    carregarHistoricoDoDia(diaSelecionado);
    carregarTemplates();
  }, [diaSelecionado]);

  const carregarTemplates = async () => {
    try {
      const json = await AsyncStorage.getItem(CHAVE_TEMPLATES);
      if (json) {
        setTemplates(JSON.parse(json));
      } else {
        await AsyncStorage.setItem(CHAVE_TEMPLATES, JSON.stringify(TEMPLATES_PADRAO));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const carregarHistoricoDoDia = async (dataStr: string) => {
    const salvo = await obterHistoricoDieta(dataStr);
    if (salvo && salvo.length > 0) {
      const convertidas: Refeicao[] = salvo.map((r, i) => ({
        id: r.idRefeicao || `ref-${i + 1}`,
        nome: r.idRefeicao?.startsWith('ref-') ? `Refeição ${i + 1}` : r.idRefeicao || `Refeição ${i + 1}`,
        horario: i === 0 ? 'Café da Manhã' : i === 1 ? 'Almoço' : 'Lanche',
        concluida: r.concluida,
        alimentos: r.alimentos,
      }));
      setRefeicoes(convertidas);
    } else {
      setRefeicoes(REFEICOES_INICIAIS_PADRAO);
    }
  };

  const persistirRefeicoes = async (novasRefeicoes: Refeicao[]) => {
    setRefeicoes(novasRefeicoes);
    const paraSalvar: RegistroRefeicaoDiaria[] = novasRefeicoes.map(r => ({
      idRefeicao: r.nome,
      data: diaSelecionado,
      concluida: r.concluida,
      alimentos: r.alimentos,
    }));
    await salvarHistoricoDieta(diaSelecionado, paraSalvar);
  };

  // 1. Criar nova refeição do zero
  const lidarComCriarNovaRefeicao = async () => {
    setMenuOpcoesVisivel(false);
    const numeroNovaRef = refeicoes.length + 1;
    const nova: Refeicao = {
      id: `ref-${Date.now()}`,
      nome: `Refeição ${numeroNovaRef}`,
      horario: 'Personalizado',
      concluida: false,
      alimentos: [],
    };
    const atualizadas = [...refeicoes, nova];
    await persistirRefeicoes(atualizadas);
  };

  // 2. Criar molde de refeição personalizada
  const lidarComSalvarTemplatePersonalizado = async () => {
    if (!nomeNovoTemplate.trim()) return;
    const novoTemplate: RefeicaoPersonalizadaTemplate = {
      id: `tpl-${Date.now()}`,
      nome: nomeNovoTemplate,
      alimentos: [
        { id: `a-${Date.now()}`, nome: 'Item Base', porcao: '100g', calorias: 150, proteinas: 15, carbos: 15, gorduras: 3 },
      ],
    };
    const atualizados = [...templates, novoTemplate];
    setTemplates(atualizados);
    await AsyncStorage.setItem(CHAVE_TEMPLATES, JSON.stringify(atualizados));
    setNomeNovoTemplate('');
    setModalCriarTemplateVisivel(false);
  };

  // 3. Adicionar refeição da lista "Minhas Refeições" ao dia
  const lidarComAdicionarTemplateAoDia = async (tpl: RefeicaoPersonalizadaTemplate) => {
    setModalMinhasRefeicoesVisivel(false);
    const nova: Refeicao = {
      id: `ref-${Date.now()}`,
      nome: tpl.nome,
      horario: 'Refeição Salva',
      concluida: false,
      alimentos: tpl.alimentos.map(a => ({ ...a, id: `a-${Date.now()}-${Math.random()}` })),
    };
    const atualizadas = [...refeicoes, nova];
    await persistirRefeicoes(atualizadas);
  };

  // Adicionar alimento avulso (botão '+' do card)
  const adicionarAlimentoAvulso = async () => {
    const novo: Alimento = {
      id: `a-${Date.now()}`,
      nome: termoBusca || 'Iogurte Grego Natural',
      porcao: '100g',
      calorias: 90,
      proteinas: 10,
      carbos: 4,
      gorduras: 4,
    };

    const atualizadas = refeicoes.map(r =>
      r.id === (refeicaoAlvo || 'ref-1') ? { ...r, alimentos: [...r.alimentos, novo] } : r
    );

    await persistirRefeicoes(atualizadas);
    setTermoBusca('');
    setModalAlimentoVisivel(false);
  };

  const alternarConclusaoRefeicao = async (id: string) => {
    const atualizadas = refeicoes.map(r => (r.id === id ? { ...r, concluida: !r.concluida } : r));
    await persistirRefeicoes(atualizadas);
  };

  const removerAlimento = async (idRefeicao: string, idAlimento: string) => {
    const atualizadas = refeicoes.map(r => {
      if (r.id === idRefeicao) {
        return { ...r, alimentos: r.alimentos.filter(a => a.id !== idAlimento) };
      }
      return r;
    });
    await persistirRefeicoes(atualizadas);
  };

  const totais = refeicoes.reduce(
    (acc, ref) => {
      if (!ref.concluida) return acc;
      return {
        calorias: acc.calorias + ref.alimentos.reduce((s, a) => s + a.calorias, 0),
        proteinas: acc.proteinas + ref.alimentos.reduce((s, a) => s + a.proteinas, 0),
        carbos: acc.carbos + ref.alimentos.reduce((s, a) => s + a.carbos, 0),
        gorduras: acc.gorduras + ref.alimentos.reduce((s, a) => s + a.gorduras, 0),
      };
    },
    { calorias: 0, proteinas: 0, carbos: 0, gorduras: 0 }
  );

  return (
    <View style={estilos.container}>
      <ScrollView contentContainerStyle={estilos.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Top Bar / Cabeçalho em PT-BR ─────────────────────── */}
        <View style={estilos.topBar}>
          <TouchableOpacity style={estilos.topBarIcone}>
            <SymbolView name="magnifyingglass" size={20} tintColor="#FFFFFF" weight="semibold" />
          </TouchableOpacity>

          <Text style={estilos.topBarTitulo}>Refeições</Text>

          <View style={estilos.topBarDireita}>
            <View style={estilos.streakBadge}>
              <SymbolView name="bolt.fill" size={14} tintColor="#EAB308" weight="bold" />
              <Text style={estilos.streakTexto}>1</Text>
            </View>
            <TouchableOpacity style={estilos.topBarIcone}>
              <SymbolView name="gearshape" size={20} tintColor="#FFFFFF" weight="semibold" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Carrossel Semanal de Dias ─────────────────────── */}
        <View style={estilos.carrosselContainer}>
          {DIAS_SEMANA.map((dia) => {
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

        {/* ── Metas Diárias (Aneis + Linha Interconectada o-o-o-o) ── */}
        <View style={estilos.secaoMetas}>
          <View style={estilos.gridAneisComLinhas}>
            <AnelProgresso
              titulo="Calorias"
              atual={totais.calorias}
              meta={metaCalorias}
              tamanho={60}
              espessura={4}
              mostrarRestante={true}
            />
            <View style={estilos.segmentoLinha} />
            <AnelProgresso
              titulo="Proteína"
              atual={totais.proteinas}
              meta={metaProteinas}
              unidade="g"
              tamanho={60}
              espessura={4}
              mostrarRestante={true}
            />
            <View style={estilos.segmentoLinha} />
            <AnelProgresso
              titulo="Carbos"
              atual={totais.carbos}
              meta={metaCarbos}
              unidade="g"
              tamanho={60}
              espessura={4}
              mostrarRestante={true}
            />
            <View style={estilos.segmentoLinha} />
            <AnelProgresso
              titulo="Gordura"
              atual={totais.gorduras}
              meta={metaGorduras}
              unidade="g"
              tamanho={60}
              espessura={4}
              mostrarRestante={true}
            />
          </View>
        </View>

        {/* ── Refeições do Dia ──────────────────────────────── */}
        {refeicoes.map((ref) => {
          const calRef = ref.alimentos.reduce((s, a) => s + a.calorias, 0);

          return (
            <CardVidro key={ref.id} semBorda estilo={estilos.cardRefeicaoSemBorda}>
              {/* Header da refeição */}
              <View style={estilos.headerRefeicao}>
                <TouchableOpacity
                  onPress={() => alternarConclusaoRefeicao(ref.id)}
                  activeOpacity={0.7}
                  style={estilos.iconeSquare}
                >
                  <SymbolView
                    name={ref.concluida ? 'checkmark.circle.fill' : 'circle'}
                    size={20}
                    tintColor={ref.concluida ? '#10B981' : Cores.texto.secundario}
                  />
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                  <Text style={estilos.nomeRefeicao}>{ref.nome}</Text>
                  <Text style={estilos.horarioRefeicao}>{calRef > 0 ? `${calRef} kcal` : ref.horario}</Text>
                </View>

                {/* Botão '+' do card: Adiciona alimento avulso a ESTA refeição específica */}
                <TouchableOpacity
                  style={estilos.btnOpcoes}
                  onPress={() => {
                    setRefeicaoAlvo(ref.id);
                    setModalAlimentoVisivel(true);
                  }}
                >
                  <SymbolView name="plus" size={16} tintColor={Cores.accent} weight="bold" />
                </TouchableOpacity>
              </View>

              {/* Alimentos dentro da refeição */}
              {ref.alimentos.map((ali) => (
                <View key={ali.id} style={estilos.linhaAlimento}>
                  <View style={{ flex: 1 }}>
                    <Text style={estilos.alimentoNome}>{ali.nome}</Text>
                    <Text style={estilos.alimentoPorcao}>{ali.porcao}</Text>
                  </View>

                  <Text style={estilos.alimentoMacros}>
                    {ali.proteinas}P {ali.carbos}C {ali.gorduras}G
                  </Text>

                  <TouchableOpacity
                    onPress={() => removerAlimento(ref.id, ali.id)}
                    style={estilos.btnRemoverAlimento}
                  >
                    <SymbolView name="trash" size={14} tintColor={Cores.texto.desabilitado} />
                  </TouchableOpacity>
                </View>
              ))}
            </CardVidro>
          );
        })}
      </ScrollView>

      {/* ── FAB Primário Amarelo: Abre Menu Flutuante (Ajuste 1) ── */}
      <TouchableOpacity
        style={estilos.fabAmarelo}
        onPress={() => setMenuOpcoesVisivel(true)}
        activeOpacity={0.85}
      >
        <View style={estilos.fabInnerAmarelo}>
          <SymbolView name="plus" size={26} tintColor="#FFFFFF" weight="bold" />
        </View>
      </TouchableOpacity>

      {/* ── Menu Flutuante (3 Opções do Ajuste 1) ─────────────── */}
      <Modal visible={menuOpcoesVisivel} animationType="fade" transparent statusBarTranslucent>
        <TouchableOpacity
          style={estilos.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuOpcoesVisivel(false)}
        />
        <BlurView intensity={90} tint="dark" style={estilos.menuSheetContainer}>
          <View style={estilos.modalHandle} />
          <Text style={estilos.modalTitulo}>Adicionar Refeição</Text>

          {/* Opção 1: Criar nova refeição */}
          <TouchableOpacity
            style={estilos.itemMenuOpcao}
            onPress={lidarComCriarNovaRefeicao}
            activeOpacity={0.7}
          >
            <View style={estilos.iconeMenuOpcao}>
              <SymbolView name="plus.circle.fill" size={22} tintColor={Cores.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={estilos.tituloMenuOpcao}>Criar nova refeição</Text>
              <Text style={estilos.subtituloMenuOpcao}>Adicionar refeição em branco do zero</Text>
            </View>
          </TouchableOpacity>

          {/* Opção 2: Criar refeição personalizada */}
          <TouchableOpacity
            style={estilos.itemMenuOpcao}
            onPress={() => {
              setMenuOpcoesVisivel(false);
              setModalCriarTemplateVisivel(true);
            }}
            activeOpacity={0.7}
          >
            <View style={estilos.iconeMenuOpcao}>
              <SymbolView name="square.and.pencil" size={22} tintColor="#EAB308" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={estilos.tituloMenuOpcao}>Criar refeição personalizada</Text>
              <Text style={estilos.subtituloMenuOpcao}>Salvar um molde com itens para reutilizar</Text>
            </View>
          </TouchableOpacity>

          {/* Opção 3: Minhas refeições */}
          <TouchableOpacity
            style={estilos.itemMenuOpcao}
            onPress={() => {
              setMenuOpcoesVisivel(false);
              setModalMinhasRefeicoesVisivel(true);
            }}
            activeOpacity={0.7}
          >
            <View style={estilos.iconeMenuOpcao}>
              <SymbolView name="folder.fill" size={22} tintColor="#3B82F6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={estilos.tituloMenuOpcao}>Minhas refeições</Text>
              <Text style={estilos.subtituloMenuOpcao}>Escolher refeições salvas do seu catálogo</Text>
            </View>
          </TouchableOpacity>
        </BlurView>
      </Modal>

      {/* ── Modal Criar Refeição Personalizada (Template) ────── */}
      <Modal visible={modalCriarTemplateVisivel} animationType="slide" transparent statusBarTranslucent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={estilos.modalOverlay} activeOpacity={1} onPress={() => setModalCriarTemplateVisivel(false)} />
          <BlurView intensity={80} tint="dark" style={estilos.modalCard}>
            <View style={estilos.modalHandle} />
            <Text style={estilos.modalTitulo}>Criar Refeição Personalizada</Text>
            <Text style={estilos.subtituloModal}>Defina o nome do molde para salvar no catálogo:</Text>

            <TextInput
              style={estilos.inputBusca}
              placeholder="Ex: Almoço Low Carb, Shake Proteico..."
              placeholderTextColor={Cores.texto.desabilitado}
              value={nomeNovoTemplate}
              onChangeText={setNomeNovoTemplate}
              autoFocus
            />

            <View style={estilos.modalAcoes}>
              <TouchableOpacity onPress={() => setModalCriarTemplateVisivel(false)} style={estilos.btnCancelar}>
                <Text style={estilos.txtCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={lidarComSalvarTemplatePersonalizado} style={estilos.btnSalvar}>
                <Text style={estilos.txtSalvar}>Salvar Molde</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Modal Minhas Refeições (Lista de Templates) ───────── */}
      <Modal visible={modalMinhasRefeicoesVisivel} animationType="slide" transparent statusBarTranslucent>
        <TouchableOpacity style={estilos.modalOverlay} activeOpacity={1} onPress={() => setModalMinhasRefeicoesVisivel(false)} />
        <BlurView intensity={80} tint="dark" style={estilos.modalCard}>
          <View style={estilos.modalHandle} />
          <Text style={estilos.modalTitulo}>Minhas Refeições</Text>
          <Text style={estilos.subtituloModal}>Selecione uma refeição salva para adicionar ao dia:</Text>

          {templates.map(tpl => {
            const cal = tpl.alimentos.reduce((s, a) => s + a.calorias, 0);
            return (
              <TouchableOpacity
                key={tpl.id}
                style={estilos.itemTemplateSalvo}
                onPress={() => lidarComAdicionarTemplateAoDia(tpl)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={estilos.nomeTemplateSalvo}>{tpl.nome}</Text>
                  <Text style={estilos.subTemplateSalvo}>{tpl.alimentos.length} alimentos · {cal} kcal</Text>
                </View>
                <SymbolView name="plus.circle.fill" size={20} tintColor={Cores.accent} />
              </TouchableOpacity>
            );
          })}

          <View style={estilos.modalAcoes}>
            <TouchableOpacity onPress={() => setModalMinhasRefeicoesVisivel(false)} style={estilos.btnCancelar}>
              <Text style={estilos.txtCancelar}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>

      {/* ── Modal Adicionar Alimento Avulso ───────────────────── */}
      <Modal visible={modalAlimentoVisivel} animationType="slide" transparent statusBarTranslucent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={estilos.modalOverlay} activeOpacity={1} onPress={() => setModalAlimentoVisivel(false)} />
          <BlurView intensity={80} tint="dark" style={estilos.modalCard}>
            <View style={estilos.modalHandle} />
            <Text style={estilos.modalTitulo}>Registrar Alimento Avulso</Text>

            <TextInput
              style={estilos.inputBusca}
              placeholder="Nome do alimento (ex: Ovos, Arroz...)"
              placeholderTextColor={Cores.texto.desabilitado}
              value={termoBusca}
              onChangeText={setTermoBusca}
              autoFocus
              returnKeyType="search"
            />

            <TouchableOpacity style={estilos.resultadoItem} onPress={adicionarAlimentoAvulso} activeOpacity={0.7}>
              <View style={{ flex: 1 }}>
                <Text style={estilos.resultadoNome}>{termoBusca || 'Iogurte Grego Natural'}</Text>
                <Text style={estilos.resultadoSub}>100g · Tabela TACO</Text>
              </View>
              <Text style={estilos.resultadoCal}>90 kcal</Text>
            </TouchableOpacity>

            <View style={estilos.modalAcoes}>
              <TouchableOpacity onPress={() => setModalAlimentoVisivel(false)} style={estilos.btnCancelar}>
                <Text style={estilos.txtCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={adicionarAlimentoAvulso} style={estilos.btnSalvar}>
                <Text style={estilos.txtSalvar}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </KeyboardAvoidingView>
      </Modal>
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
  topBarIcone: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 28,
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

  secaoMetas: {
    marginBottom: 28,
  },
  gridAneisComLinhas: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  segmentoLinha: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    marginTop: 56,
    marginHorizontal: 2,
    borderRadius: 1,
  },

  cardRefeicaoSemBorda: {
    marginBottom: 16,
    padding: Espacamento.lg,
    borderWidth: 0,
    marginHorizontal: -20,
  },
  headerRefeicao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  iconeSquare: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Cores.fundo.elevada,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nomeRefeicao: {
    fontFamily: FamiliaFonte.bold,
    fontSize: 16,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
  },
  horarioRefeicao: {
    fontFamily: FamiliaFonte.regular,
    fontSize: 13,
    color: Cores.texto.secundario,
    marginTop: 2,
  },
  btnOpcoes: {
    padding: 6,
  },
  linhaAlimento: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Cores.borda.sutil,
    gap: 8,
  },
  alimentoNome: {
    fontFamily: FamiliaFonte.semibold,
    fontSize: 14,
    color: Cores.texto.principal,
  },
  alimentoPorcao: {
    fontFamily: FamiliaFonte.regular,
    fontSize: 12,
    color: Cores.texto.secundario,
    marginTop: 2,
    marginBottom: 5,
  },
  alimentoMacros: {
    fontFamily: FamiliaFonte.bold,
    fontSize: 13,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
  },
  btnRemoverAlimento: {
    padding: 4,
  },

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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
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
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    backgroundColor: 'rgba(16,19,24,0.97)',
    borderTopWidth: 1,
    borderColor: Cores.borda.sutil,
    overflow: 'hidden',
  },
  modalTitulo: {
    fontFamily: FamiliaFonte.bold,
    fontSize: Fonte.subtitulo,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
    marginBottom: 12,
  },
  subtituloModal: {
    fontFamily: FamiliaFonte.regular,
    fontSize: Fonte.label,
    color: Cores.texto.secundario,
    marginBottom: 16,
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

  itemTemplateSalvo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: Cores.fundo.elevada,
    borderRadius: Raio.md,
    marginBottom: 10,
  },
  nomeTemplateSalvo: {
    fontFamily: FamiliaFonte.bold,
    fontSize: Fonte.corpo,
    color: Cores.texto.principal,
  },
  subTemplateSalvo: {
    fontFamily: FamiliaFonte.regular,
    fontSize: 12,
    color: Cores.texto.secundario,
    marginTop: 2,
  },

  inputBusca: {
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
  resultadoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Cores.accentSuave,
    borderWidth: 1,
    borderColor: Cores.accentBorda,
    borderRadius: Raio.md,
    marginBottom: 20,
  },
  resultadoNome: {
    fontFamily: FamiliaFonte.semibold,
    fontSize: Fonte.corpo,
    color: Cores.texto.principal,
  },
  resultadoSub: {
    fontFamily: FamiliaFonte.regular,
    fontSize: Fonte.micro,
    color: Cores.texto.secundario,
  },
  resultadoCal: {
    fontFamily: FamiliaFonte.bold,
    fontSize: Fonte.corpo,
    color: Cores.texto.principal,
  },
  modalAcoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  btnCancelar: { paddingVertical: 10, paddingHorizontal: 16 },
  txtCancelar: {
    fontFamily: FamiliaFonte.semibold,
    color: Cores.texto.secundario,
    fontSize: Fonte.corpo,
  },
  btnSalvar: {
    backgroundColor: Cores.accent,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: Raio.md,
  },
  txtSalvar: {
    fontFamily: FamiliaFonte.bold,
    color: '#080A0E',
    fontSize: Fonte.corpo,
  },
});
