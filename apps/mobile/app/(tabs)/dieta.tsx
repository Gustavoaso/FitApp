// ============================================================
// TELA: Dieta / Nutrição (app/(tabs)/dieta.tsx)
// ============================================================
// Clean Dark UI — referência Cronometer / Lose It / Oura.
// Carrossel semanal + metas com anéis interligados + cards de refeição.
// Sem emojis, accent branco (#FFFFFF), radius uniforme 16px.
// ============================================================

import React, { useState } from 'react';
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
import { CardVidro } from '../../componentes/ui';
import { AnelProgresso } from '../../componentes/ui/AnelProgresso';
import { Cores, Espacamento, Fonte, PesoFonte, Raio } from '../../constantes/Cores';

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

const DIAS_SEMANA = [
  { abrev: 'D', diaNum: '26', data: '2026-07-26' },
  { abrev: 'S', diaNum: '27', data: '2026-07-27' },
  { abrev: 'T', diaNum: '28', data: '2026-07-28' },
  { abrev: 'Q', diaNum: '29', data: '2026-07-29' },
  { abrev: 'Q', diaNum: '30', data: '2026-07-30' },
  { abrev: 'S', diaNum: '31', data: '2026-07-31' },
  { abrev: 'S', diaNum: '01', data: '2026-08-01' },
];

export default function TelaDieta() {
  const [diaSelecionado, setDiaSelecionado] = useState('2026-07-27');

  const metaCalorias = 2200;
  const metaProteinas = 160;
  const metaCarbos = 260;
  const metaGorduras = 65;

  const [refeicoes, setRefeicoes] = useState<Refeicao[]>([
    {
      id: 'ref-1',
      nome: 'Café da Manhã',
      horario: '07:30',
      concluida: true,
      alimentos: [
        { id: 'a1', nome: 'Ovos Mexidos', porcao: '3 un · 150g', calorias: 215, proteinas: 18, carbos: 2, gorduras: 15 },
        { id: 'a2', nome: 'Pão Integral', porcao: '2 fatias · 50g', calorias: 130, proteinas: 6, carbos: 24, gorduras: 2 },
        { id: 'a3', nome: 'Café preto', porcao: '200ml', calorias: 5, proteinas: 0, carbos: 1, gorduras: 0 },
      ],
    },
    {
      id: 'ref-2',
      nome: 'Almoço',
      horario: '12:30',
      concluida: true,
      alimentos: [
        { id: 'a4', nome: 'Peito de Frango Grelhado', porcao: '180g', calorias: 297, proteinas: 56, carbos: 0, gorduras: 6 },
        { id: 'a5', nome: 'Arroz Integral', porcao: '150g', calorias: 186, proteinas: 4, carbos: 38, gorduras: 2 },
        { id: 'a6', nome: 'Feijão Carioca', porcao: '100g', calorias: 76, proteinas: 5, carbos: 14, gorduras: 1 },
        { id: 'a7', nome: 'Salada + Azeite', porcao: '80g', calorias: 65, proteinas: 1, carbos: 3, gorduras: 6 },
      ],
    },
    {
      id: 'ref-3',
      nome: 'Lanche da Tarde',
      horario: '16:30',
      concluida: false,
      alimentos: [
        { id: 'a8', nome: 'Whey Protein', porcao: '1 scoop · 30g', calorias: 120, proteinas: 25, carbos: 2, gorduras: 1 },
        { id: 'a9', nome: 'Banana Prata', porcao: '1 un · 90g', calorias: 89, proteinas: 1, carbos: 23, gorduras: 0 },
      ],
    },
    {
      id: 'ref-4',
      nome: 'Jantar',
      horario: '20:00',
      concluida: false,
      alimentos: [
        { id: 'a10', nome: 'Salmão Grelhado', porcao: '150g', calorias: 310, proteinas: 34, carbos: 0, gorduras: 18 },
        { id: 'a11', nome: 'Batata Doce Assada', porcao: '150g', calorias: 129, proteinas: 2, carbos: 30, gorduras: 0 },
      ],
    },
  ]);

  const [modalVisivel, setModalVisivel] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const [refeicaoAlvo, setRefeicaoAlvo] = useState<string | null>(null);

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

  const alternarRefeicao = (id: string) => {
    setRefeicoes(prev => prev.map(r => (r.id === id ? { ...r, concluida: !r.concluida } : r)));
  };

  const adicionarAlimento = () => {
    const novo: Alimento = {
      id: `a-${Date.now()}`,
      nome: termoBusca || 'Iogurte Grego Natural',
      porcao: '100g',
      calorias: 90,
      proteinas: 10,
      carbos: 4,
      gorduras: 4,
    };
    setRefeicoes(prev =>
      prev.map(r => (r.id === (refeicaoAlvo || 'ref-3') ? { ...r, alimentos: [...r.alimentos, novo] } : r))
    );
    setTermoBusca('');
    setModalVisivel(false);
  };

  return (
    <View style={estilos.container}>
      <ScrollView contentContainerStyle={estilos.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Cabeçalho ─────────────────────────────────────── */}
        <View style={estilos.cabecalho}>
          <Text style={estilos.titulo}>Nutrição</Text>
          <Text style={estilos.subtitulo}>Plano alimentar diário</Text>
        </View>

        {/* ── Carrossel semanal ─────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={estilos.scrollDias}
          style={estilos.scrollDiasWrapper}
        >
          {DIAS_SEMANA.map((dia) => {
            const sel = dia.data === diaSelecionado;
            return (
              <TouchableOpacity
                key={dia.data}
                onPress={() => setDiaSelecionado(dia.data)}
                activeOpacity={0.7}
                style={[estilos.cardDia, sel && estilos.cardDiaSelecionado]}
              >
                <Text style={[estilos.diaAbrev, sel && estilos.diaTextoAtivo]}>{dia.abrev}</Text>
                <Text style={[estilos.diaNum, sel && estilos.diaTextoAtivo]}>{dia.diaNum}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Metas Diárias (anéis interligados, sem card) ─── */}
        <View style={estilos.secaoMetas}>
          <View style={estilos.metasTopo}>
            <Text style={estilos.secaoTitulo}>Metas Diárias</Text>
            <Text style={estilos.metasPorcentagem}>
              {Math.round((totais.calorias / metaCalorias) * 100)}%
            </Text>
          </View>

          <View style={estilos.containerAneis}>
            {/* Linha que interliga os anéis */}
            <View style={estilos.linhaInterconexao} />

            <View style={estilos.gridAneis}>
              <AnelProgresso
                titulo="Cal"
                atual={totais.calorias}
                meta={metaCalorias}
                tamanho={56}
                espessura={4}
              />
              <AnelProgresso
                titulo="Prot"
                atual={totais.proteinas}
                meta={metaProteinas}
                unidade="g"
                tamanho={56}
                espessura={4}
              />
              <AnelProgresso
                titulo="Carb"
                atual={totais.carbos}
                meta={metaCarbos}
                unidade="g"
                tamanho={56}
                espessura={4}
              />
              <AnelProgresso
                titulo="Gord"
                atual={totais.gorduras}
                meta={metaGorduras}
                unidade="g"
                tamanho={56}
                espessura={4}
              />
            </View>
          </View>
        </View>

        {/* ── Refeições ─────────────────────────────────────── */}
        <Text style={[estilos.secaoTitulo, { marginTop: 4 }]}>Refeições</Text>

        {refeicoes.map((ref) => {
          const calRef = ref.alimentos.reduce((s, a) => s + a.calorias, 0);
          const protRef = ref.alimentos.reduce((s, a) => s + a.proteinas, 0);
          const carbRef = ref.alimentos.reduce((s, a) => s + a.carbos, 0);
          const gordRef = ref.alimentos.reduce((s, a) => s + a.gorduras, 0);

          return (
            <CardVidro key={ref.id} estilo={estilos.cardRefeicao}>
              {/* Header da refeição */}
              <View style={estilos.headerRefeicao}>
                <TouchableOpacity
                  onPress={() => alternarRefeicao(ref.id)}
                  activeOpacity={0.7}
                  style={[estilos.checkbox, ref.concluida && estilos.checkboxAtivo]}
                >
                  {ref.concluida && (
                    <SymbolView
                      name="checkmark"
                      size={11}
                      tintColor="#080A0E"
                      weight="bold"
                    />
                  )}
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                  <Text style={estilos.nomeRefeicao}>{ref.nome}</Text>
                  <Text style={estilos.horarioRefeicao}>{ref.horario}</Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={estilos.calRefeicao}>{calRef} kcal</Text>
                  <Text style={estilos.macrosRefeicao}>P{protRef} · C{carbRef} · G{gordRef}</Text>
                </View>
              </View>

              {/* Divisor */}
              <View style={estilos.divisor} />

              {/* Alimentos */}
              {ref.alimentos.map((ali) => (
                <View key={ali.id} style={estilos.linhaAlimento}>
                  <View style={estilos.pontoAlimento} />
                  <View style={{ flex: 1 }}>
                    <Text style={estilos.alimentoNome}>{ali.nome}</Text>
                    <Text style={estilos.alimentoPorcao}>{ali.porcao}</Text>
                  </View>
                  <Text style={estilos.alimentoCal}>{ali.calorias}</Text>
                </View>
              ))}

              {/* Botão adicionar */}
              <TouchableOpacity
                style={estilos.botaoAdicionar}
                onPress={() => { setRefeicaoAlvo(ref.id); setModalVisivel(true); }}
                activeOpacity={0.7}
              >
                <SymbolView name="plus" size={12} tintColor={Cores.accent} weight="semibold" />
                <Text style={estilos.textoBotaoAdicionar}>Adicionar</Text>
              </TouchableOpacity>
            </CardVidro>
          );
        })}
      </ScrollView>

      {/* ── FAB ───────────────────────────────────────────── */}
      <TouchableOpacity
        style={estilos.fab}
        onPress={() => { setRefeicaoAlvo('ref-3'); setModalVisivel(true); }}
        activeOpacity={0.8}
      >
        <View style={estilos.fabInner}>
          <SymbolView name="fork.knife" size={20} tintColor="#080A0E" weight="semibold" />
        </View>
      </TouchableOpacity>

      {/* ── Modal de busca de alimento ────────────────────── */}
      <Modal visible={modalVisivel} animationType="slide" transparent statusBarTranslucent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={estilos.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisivel(false)}
          />
          <BlurView intensity={80} tint="dark" style={estilos.modalCard}>
            <View style={estilos.modalHandle} />
            <Text style={estilos.modalTitulo}>Registrar Alimento</Text>

            <TextInput
              style={estilos.inputBusca}
              placeholder="Nome do alimento..."
              placeholderTextColor={Cores.texto.desabilitado}
              value={termoBusca}
              onChangeText={setTermoBusca}
              autoFocus
              returnKeyType="search"
            />

            <TouchableOpacity
              style={estilos.resultadoItem}
              onPress={adicionarAlimento}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text style={estilos.resultadoNome}>{termoBusca || 'Iogurte Grego Natural'}</Text>
                <Text style={estilos.resultadoSub}>100g · Tabela TACO</Text>
              </View>
              <Text style={estilos.resultadoCal}>90 kcal</Text>
            </TouchableOpacity>

            <View style={estilos.modalAcoes}>
              <TouchableOpacity onPress={() => setModalVisivel(false)} style={estilos.btnCancelar}>
                <Text style={estilos.txtCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={adicionarAlimento} style={estilos.btnSalvar}>
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

  cabecalho: { marginBottom: 20 },
  titulo: { fontSize: Fonte.titulo, fontWeight: PesoFonte.semibold, color: Cores.texto.principal },
  subtitulo: { fontSize: Fonte.label, color: Cores.texto.secundario, marginTop: 3 },

  scrollDiasWrapper: { marginBottom: 24 },
  scrollDias: { gap: 8 },
  cardDia: {
    width: 44,
    height: 60,
    borderRadius: Raio.md,
    backgroundColor: Cores.fundo.superficie,
    borderWidth: 1,
    borderColor: Cores.borda.sutil,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDiaSelecionado: {
    backgroundColor: Cores.accent,
    borderColor: Cores.accent,
  },
  diaAbrev: { fontSize: 10, fontWeight: PesoFonte.semibold, color: Cores.texto.desabilitado },
  diaNum: { fontSize: 16, fontWeight: PesoFonte.bold, color: Cores.texto.principal, marginTop: 3 },
  diaTextoAtivo: { color: '#FFFFFF' },

  secaoMetas: { marginBottom: 28 },
  metasTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  metasPorcentagem: { fontSize: Fonte.label, color: Cores.accent, fontWeight: PesoFonte.semibold },
  containerAneis: { position: 'relative' },
  linhaInterconexao: {
    position: 'absolute',
    left: 28,
    right: 28,
    top: 38,
    height: 1,
    backgroundColor: Cores.borda.sutil,
    zIndex: 1,
  },
  gridAneis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },

  secaoTitulo: {
    fontSize: Fonte.label,
    fontWeight: PesoFonte.semibold,
    color: Cores.texto.secundario,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Espacamento.md,
  },

  cardRefeicao: { marginBottom: Espacamento.sm, padding: Espacamento.md },
  headerRefeicao: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Cores.borda.media,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxAtivo: {
    backgroundColor: Cores.accent,
    borderColor: Cores.accent,
  },
  nomeRefeicao: { fontSize: Fonte.corpo, fontWeight: PesoFonte.semibold, color: Cores.texto.principal },
  horarioRefeicao: { fontSize: Fonte.micro, color: Cores.texto.desabilitado, marginTop: 1 },
  calRefeicao: { fontSize: Fonte.label, fontWeight: PesoFonte.bold, color: Cores.texto.principal },
  macrosRefeicao: { fontSize: Fonte.micro, color: Cores.texto.desabilitado, marginTop: 1 },

  divisor: { height: 1, backgroundColor: Cores.borda.sutil, marginVertical: 10 },

  linhaAlimento: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 5,
  },
  pontoAlimento: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Cores.borda.forte,
  },
  alimentoNome: { fontSize: Fonte.label, color: Cores.texto.principal, fontWeight: PesoFonte.medio },
  alimentoPorcao: { fontSize: Fonte.micro, color: Cores.texto.desabilitado },
  alimentoCal: { fontSize: Fonte.label, color: Cores.texto.secundario, fontWeight: PesoFonte.semibold },

  botaoAdicionar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  textoBotaoAdicionar: { fontSize: Fonte.micro, color: Cores.accent, fontWeight: PesoFonte.semibold },

  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabInner: {
    width: '100%',
    height: '100%',
    backgroundColor: Cores.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

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
    fontSize: Fonte.subtitulo,
    fontWeight: PesoFonte.semibold,
    color: Cores.texto.principal,
    marginBottom: 16,
  },
  inputBusca: {
    backgroundColor: Cores.fundo.elevada,
    borderWidth: 1,
    borderColor: Cores.borda.media,
    borderRadius: Raio.md,
    padding: 12,
    fontSize: Fonte.corpo,
    color: Cores.texto.principal,
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
  resultadoNome: { fontSize: Fonte.corpo, fontWeight: PesoFonte.semibold, color: Cores.texto.principal },
  resultadoSub: { fontSize: Fonte.micro, color: Cores.texto.secundario },
  resultadoCal: { fontSize: Fonte.corpo, fontWeight: PesoFonte.bold, color: Cores.accent },
  modalAcoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  btnCancelar: { paddingVertical: 10, paddingHorizontal: 16 },
  txtCancelar: { color: Cores.texto.secundario, fontWeight: PesoFonte.semibold, fontSize: Fonte.corpo },
  btnSalvar: {
    backgroundColor: Cores.accent,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: Raio.md,
  },
  txtSalvar: { color: '#080A0E', fontWeight: PesoFonte.semibold, fontSize: Fonte.corpo },
});
