// ============================================================
// TELA: Dieta / Nutrição (app/(tabs)/dieta.tsx)
// ============================================================
// Linguagem visual minimalista, moderna e premium baseada no
// Apple Human Interface Guidelines (HIG) e Liquid Glass (iOS 26).
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
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { BlurView } from 'expo-blur';
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
  iconeEmoji?: string;
}

interface Refeicao {
  id: string;
  nome: string;
  horario: string;
  concluida: boolean;
  alimentos: Alimento[];
}

const DIAS_SEMANA = [
  { diaSemana: 'DOM', diaNumero: '26', dataCompleta: '2026-07-26' },
  { diaSemana: 'SEG', diaNumero: '27', dataCompleta: '2026-07-27' },
  { diaSemana: 'TER', diaNumero: '28', dataCompleta: '2026-07-28' },
  { diaSemana: 'QUA', diaNumero: '29', dataCompleta: '2026-07-29' },
  { diaSemana: 'QUI', diaNumero: '30', dataCompleta: '2026-07-30' },
  { diaSemana: 'SEX', diaNumero: '31', dataCompleta: '2026-07-31' },
  { diaSemana: 'SÁB', diaNumero: '01', dataCompleta: '2026-08-01' },
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
        { id: 'a1', nome: 'Ovos Mexidos', porcao: '3 unidades (150g)', calorias: 215, proteinas: 18, carbos: 2, gorduras: 15, iconeEmoji: '🥚' },
        { id: 'a2', nome: 'Pão Integral 100%', porcao: '2 fatias (50g)', calorias: 130, proteinas: 6, carbos: 24, gorduras: 2, iconeEmoji: '🍞' },
        { id: 'a3', nome: 'Café Preto sem Açúcar', porcao: '200ml', calorias: 5, proteinas: 0, carbos: 1, gorduras: 0, iconeEmoji: '☕' },
      ],
    },
    {
      id: 'ref-2',
      nome: 'Almoço',
      horario: '12:30',
      concluida: true,
      alimentos: [
        { id: 'a4', nome: 'Peito de Frango Grelhado', porcao: '180g', calorias: 297, proteinas: 56, carbos: 0, gorduras: 6, iconeEmoji: '🍗' },
        { id: 'a5', nome: 'Arroz Integral Cozido', porcao: '150g', calorias: 186, proteinas: 4, carbos: 38, gorduras: 2, iconeEmoji: '🍚' },
        { id: 'a6', nome: 'Feijão Carioca', porcao: '100g', calorias: 76, proteinas: 5, carbos: 14, gorduras: 1, iconeEmoji: '🫘' },
        { id: 'a7', nome: 'Salada de Folhas & Azeite', porcao: '1 prato (80g)', calorias: 65, proteinas: 1, carbos: 3, gorduras: 6, iconeEmoji: '🥗' },
      ],
    },
    {
      id: 'ref-3',
      nome: 'Lanche da Tarde',
      horario: '16:30',
      concluida: false,
      alimentos: [
        { id: 'a8', nome: 'Whey Protein Isolar', porcao: '1 scoop (30g)', calorias: 120, proteinas: 25, carbos: 2, gorduras: 1, iconeEmoji: '🥤' },
        { id: 'a9', nome: 'Banana Prata', porcao: '1 unidade (90g)', calorias: 89, proteinas: 1, carbos: 23, gorduras: 0, iconeEmoji: '🍌' },
      ],
    },
    {
      id: 'ref-4',
      nome: 'Jantar',
      horario: '20:00',
      concluida: false,
      alimentos: [
        { id: 'a10', nome: 'Filé de Salmão Grelhado', porcao: '150g', calorias: 310, proteinas: 34, carbos: 0, gorduras: 18, iconeEmoji: '🐟' },
        { id: 'a11', nome: 'Batata Doce Assada', porcao: '150g', calorias: 129, proteinas: 2, carbos: 30, gorduras: 0, iconeEmoji: '🍠' },
      ],
    },
  ]);

  const [modalVisivel, setModalVisivel] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const [refeicaoAlvo, setRefeicaoAlvo] = useState<string | null>(null);

  const totalCalorias = refeicoes.reduce(
    (acc, ref) => acc + (ref.concluida ? ref.alimentos.reduce((a, b) => a + b.calorias, 0) : 0),
    0
  );
  const totalProteinas = refeicoes.reduce(
    (acc, ref) => acc + (ref.concluida ? ref.alimentos.reduce((a, b) => a + b.proteinas, 0) : 0),
    0
  );
  const totalCarbos = refeicoes.reduce(
    (acc, ref) => acc + (ref.concluida ? ref.alimentos.reduce((a, b) => a + b.carbos, 0) : 0),
    0
  );
  const totalGorduras = refeicoes.reduce(
    (acc, ref) => acc + (ref.concluida ? ref.alimentos.reduce((a, b) => a + b.gorduras, 0) : 0),
    0
  );

  const alternarConclusaoRefeicao = (idRefeicao: string) => {
    setRefeicoes((prev) =>
      prev.map((ref) => (ref.id === idRefeicao ? { ...ref, concluida: !ref.concluida } : ref))
    );
  };

  const adicionarAlimentoExemplo = () => {
    const novoAlimento: Alimento = {
      id: `a-${Date.now()}`,
      nome: termoBusca || 'Iogurte Grego Natural',
      porcao: '100g',
      calorias: 90,
      proteinas: 10,
      carbos: 4,
      gorduras: 4,
      iconeEmoji: '🥛',
    };

    setRefeicoes((prev) =>
      prev.map((ref) => {
        if (ref.id === (refeicaoAlvo || 'ref-3')) {
          return { ...ref, alimentos: [...ref.alimentos, novoAlimento] };
        }
        return ref;
      })
    );

    setTermoBusca('');
    setModalVisivel(false);
  };

  return (
    <View style={estilos.container}>
      <ScrollView
        contentContainerStyle={estilos.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho */}
        <View style={estilos.cabecalho}>
          <Text style={estilos.subtituloHeader}>Plano de Nutrição</Text>
          <Text style={estilos.tituloHeader}>Dieta Diária</Text>
        </View>

        {/* Carrossel Semanal de Dias */}
        <View style={estilos.containerCarrossel}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={estilos.scrollDias}
          >
            {DIAS_SEMANA.map((dia) => {
              const selecionado = dia.dataCompleta === diaSelecionado;
              return (
                <TouchableOpacity
                  key={dia.dataCompleta}
                  onPress={() => setDiaSelecionado(dia.dataCompleta)}
                  activeOpacity={0.7}
                  style={[
                    estilos.cardDia,
                    selecionado && estilos.cardDiaSelecionado,
                  ]}
                >
                  <Text
                    style={[
                      estilos.textoDiaSemana,
                      selecionado && estilos.textoDiaSelecionado,
                    ]}
                  >
                    {dia.diaSemana}
                  </Text>
                  <Text
                    style={[
                      estilos.textoDiaNumero,
                      selecionado && estilos.textoDiaSelecionado,
                    ]}
                  >
                    {dia.diaNumero}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Painel Resumo Nutricional Livre (Sem Card/Caixa, Interligado por Linha o-o-o-o) */}
        <View style={estilos.secaoMetasLivre}>
          <View style={estilos.resumoTopoLivre}>
            <Text style={estilos.tituloResumo}>Metas Diárias</Text>
            <Text style={estilos.porcentagemResumo}>
              {Math.round((totalCalorias / metaCalorias) * 100)}% concluído
            </Text>
          </View>

          {/* Grid de 4 Indicadores Circulares com Linha Interconectora */}
          <View style={estilos.containerAneisInterligados}>
            {/* Linha que interliga os 4 círculos (o-o-o-o) */}
            <View style={estilos.linhaInterconexao} />

            <View style={estilos.gridAneisLivre}>
              <AnelProgresso
                titulo="Calorias"
                atual={totalCalorias}
                meta={metaCalorias}
                corGradienteInicio="#00F5D4"
                corGradienteFim="#0BE3B7"
                tamanho={58}
                espessura={5}
              />

              <AnelProgresso
                titulo="Proteínas"
                atual={totalProteinas}
                meta={metaProteinas}
                unidade="g"
                corGradienteInicio="#FF5757"
                corGradienteFim="#FF7B7B"
                tamanho={58}
                espessura={5}
              />

              <AnelProgresso
                titulo="Carbos"
                atual={totalCarbos}
                meta={metaCarbos}
                unidade="g"
                corGradienteInicio="#FFB703"
                corGradienteFim="#FFC300"
                tamanho={58}
                espessura={5}
              />

              <AnelProgresso
                titulo="Gorduras"
                atual={totalGorduras}
                meta={metaGorduras}
                unidade="g"
                corGradienteInicio="#9D4EDD"
                corGradienteFim="#C77DFF"
                tamanho={58}
                espessura={5}
              />
            </View>
          </View>
        </View>

        {/* Lista de Refeições */}
        <View style={estilos.secaoRefeicoes}>
          <Text style={estilos.tituloSecao}>Refeições do Dia</Text>

          {refeicoes.map((ref) => {
            const calRef = ref.alimentos.reduce((a, b) => a + b.calorias, 0);
            const protRef = ref.alimentos.reduce((a, b) => a + b.proteinas, 0);
            const carbRef = ref.alimentos.reduce((a, b) => a + b.carbos, 0);
            const gordRef = ref.alimentos.reduce((a, b) => a + b.gorduras, 0);

            return (
              <CardVidro key={ref.id} estilo={estilos.cardRefeicao}>
                <View style={estilos.headerRefeicao}>
                  <View style={estilos.infoEsquerdaHeader}>
                    <TouchableOpacity
                      onPress={() => alternarConclusaoRefeicao(ref.id)}
                      activeOpacity={0.7}
                      style={[
                        estilos.checkboxStatus,
                        ref.concluida && estilos.checkboxConcluido,
                      ]}
                    >
                      {ref.concluida && (
                        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                          <Path
                            d="M20 6L9 17l-5-5"
                            stroke="#0F172A"
                            strokeWidth={3.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Svg>
                      )}
                    </TouchableOpacity>

                    <View>
                      <Text style={estilos.nomeRefeicao}>{ref.nome}</Text>
                      <Text style={estilos.horarioRefeicao}>{ref.horario}</Text>
                    </View>
                  </View>

                  <View style={estilos.infoDireitaHeader}>
                    <Text style={estilos.caloriasRefeicao}>{calRef} kcal</Text>
                    <Text style={estilos.macrosRefeicao}>
                      P:{protRef}g · C:{carbRef}g · G:{gordRef}g
                    </Text>
                  </View>
                </View>

                <View style={estilos.divisorCard} />

                {ref.alimentos.length > 0 ? (
                  <View style={estilos.listaAlimentosContainer}>
                    {ref.alimentos.map((ali) => (
                      <View key={ali.id} style={estilos.linhaAlimento}>
                        <View style={estilos.alimentoInfoCol}>
                          <Text style={estilos.alimentoNome}>
                            {ali.iconeEmoji ? `${ali.iconeEmoji} ` : ''}
                            {ali.nome}
                          </Text>
                          <Text style={estilos.alimentoPorcao}>{ali.porcao}</Text>
                        </View>

                        <Text style={estilos.alimentoCalorias}>{ali.calorias} kcal</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={estilos.textoRefeicaoVazia}>Nenhum alimento cadastrado</Text>
                )}

                <TouchableOpacity
                  style={estilos.botaoAdicionarItem}
                  onPress={() => {
                    setRefeicaoAlvo(ref.id);
                    setModalVisivel(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={estilos.textoAdicionarItem}>+ Adicionar Alimento</Text>
                </TouchableOpacity>
              </CardVidro>
            );
          })}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={estilos.fabContainer}
        onPress={() => {
          setRefeicaoAlvo('ref-3');
          setModalVisivel(true);
        }}
        activeOpacity={0.8}
      >
        <BlurView intensity={70} tint="dark" style={estilos.fabGlass}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 5v14M5 12h14"
              stroke={Cores.primaria.base}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          </Svg>
        </BlurView>
      </TouchableOpacity>

      <Modal visible={modalVisivel} animationType="fade" transparent>
        <View style={estilos.modalOverlay}>
          <BlurView intensity={90} tint="dark" style={estilos.modalGlassCard}>
            <Text style={estilos.modalTitulo}>Registrar Alimento</Text>

            <TextInput
              style={estilos.inputBusca}
              placeholder="Digite o nome (Ex: Peito de Frango, Arroz...)"
              placeholderTextColor={Cores.texto.desabilitado}
              value={termoBusca}
              onChangeText={setTermoBusca}
            />

            <TouchableOpacity
              style={estilos.itemResultadoTACO}
              onPress={adicionarAlimentoExemplo}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text style={estilos.resultadoNome}>
                  {termoBusca || 'Iogurte Grego Natural'}
                </Text>
                <Text style={estilos.resultadoSub}>100g · TACO / Nutrição Curada</Text>
              </View>
              <Text style={estilos.resultadoCalorias}>90 kcal</Text>
            </TouchableOpacity>

            <View style={estilos.modalAcoes}>
              <TouchableOpacity
                style={estilos.botaoCancelar}
                onPress={() => setModalVisivel(false)}
              >
                <Text style={estilos.textoCancelar}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={estilos.botaoAdicionarModal}
                onPress={adicionarAlimentoExemplo}
              >
                <Text style={estilos.textoAdicionarModal}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Cores.fundo.principal,
  },
  scrollContent: {
    paddingHorizontal: Espacamento.xl,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 120,
  },
  cabecalho: {
    marginBottom: Espacamento.lg,
  },
  subtituloHeader: {
    fontSize: Fonte.micro,
    color: Cores.primaria.base,
    fontWeight: PesoFonte.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  tituloHeader: {
    fontSize: Fonte.display,
    fontWeight: PesoFonte.extrabold,
    color: Cores.texto.principal,
    letterSpacing: -0.5,
  },
  containerCarrossel: {
    marginBottom: Espacamento.xl,
  },
  scrollDias: {
    gap: 10,
  },
  cardDia: {
    width: 52,
    height: 68,
    borderRadius: Raio.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDiaSelecionado: {
    backgroundColor: Cores.primaria.base,
    borderColor: Cores.primaria.base,
    shadowColor: Cores.primaria.base,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  textoDiaSemana: {
    fontSize: 10,
    color: Cores.texto.desabilitado,
    fontWeight: PesoFonte.semibold,
    marginBottom: 4,
  },
  textoDiaNumero: {
    fontSize: Fonte.subtitulo,
    color: Cores.texto.principal,
    fontWeight: PesoFonte.bold,
  },
  textoDiaSelecionado: {
    color: '#0F172A',
  },
  secaoMetasLivre: {
    marginBottom: Espacamento.xxl,
    paddingHorizontal: 4,
  },
  resumoTopoLivre: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Espacamento.md,
  },
  tituloResumo: {
    fontSize: Fonte.corpo,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
  },
  porcentagemResumo: {
    fontSize: Fonte.label,
    color: Cores.primaria.base,
    fontWeight: PesoFonte.semibold,
  },
  containerAneisInterligados: {
    position: 'relative',
    justifyContent: 'center',
    marginTop: 4,
  },
  linhaInterconexao: {
    position: 'absolute',
    left: 28,
    right: 28,
    top: 47,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    zIndex: 1,
  },
  gridAneisLivre: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  secaoRefeicoes: {
    gap: Espacamento.lg,
  },
  tituloSecao: {
    fontSize: Fonte.subtitulo,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
    marginBottom: Espacamento.sm,
  },
  cardRefeicao: {
    padding: Espacamento.lg,
    borderRadius: Raio.xl,
  },
  headerRefeicao: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoEsquerdaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxStatus: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  checkboxConcluido: {
    backgroundColor: Cores.primaria.base,
    borderColor: Cores.primaria.base,
  },
  nomeRefeicao: {
    fontSize: Fonte.corpo,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
  },
  horarioRefeicao: {
    fontSize: Fonte.micro,
    color: Cores.texto.desabilitado,
    fontWeight: PesoFonte.medio,
    marginTop: 1,
  },
  infoDireitaHeader: {
    alignItems: 'flex-end',
  },
  caloriasRefeicao: {
    fontSize: Fonte.corpo,
    fontWeight: PesoFonte.extrabold,
    color: Cores.secundaria,
  },
  macrosRefeicao: {
    fontSize: Fonte.micro,
    color: Cores.texto.secundario,
    marginTop: 2,
  },
  divisorCard: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: Espacamento.md,
  },
  listaAlimentosContainer: {
    gap: 8,
    marginBottom: Espacamento.md,
  },
  linhaAlimento: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alimentoInfoCol: {
    flex: 1,
  },
  alimentoNome: {
    fontSize: Fonte.label,
    color: Cores.texto.principal,
    fontWeight: PesoFonte.semibold,
  },
  alimentoPorcao: {
    fontSize: Fonte.micro,
    color: Cores.texto.desabilitado,
  },
  alimentoCalorias: {
    fontSize: Fonte.label,
    color: Cores.texto.secundario,
    fontWeight: PesoFonte.bold,
  },
  textoRefeicaoVazia: {
    fontSize: Fonte.label,
    color: Cores.texto.desabilitado,
    fontStyle: 'italic',
    marginBottom: Espacamento.md,
  },
  botaoAdicionarItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Raio.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignSelf: 'flex-start',
  },
  textoAdicionarItem: {
    fontSize: Fonte.micro,
    color: Cores.primaria.base,
    fontWeight: PesoFonte.semibold,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: Cores.primaria.base,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGlass: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.35)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: Espacamento.xl,
  },
  modalGlassCard: {
    borderRadius: 24,
    padding: Espacamento.xl,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  modalTitulo: {
    fontSize: Fonte.subtitulo,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
    marginBottom: Espacamento.lg,
  },
  inputBusca: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: Raio.md,
    padding: Espacamento.md,
    fontSize: Fonte.corpo,
    color: Cores.texto.principal,
    marginBottom: Espacamento.lg,
  },
  itemResultadoTACO: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Espacamento.md,
    backgroundColor: 'rgba(0, 245, 212, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.2)',
    borderRadius: Raio.md,
    marginBottom: Espacamento.xl,
  },
  resultadoNome: {
    fontSize: Fonte.corpo,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
  },
  resultadoSub: {
    fontSize: Fonte.micro,
    color: Cores.texto.secundario,
  },
  resultadoCalorias: {
    fontSize: Fonte.corpo,
    fontWeight: PesoFonte.extrabold,
    color: Cores.primaria.base,
  },
  modalAcoes: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  botaoCancelar: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  textoCancelar: {
    color: Cores.texto.secundario,
    fontWeight: PesoFonte.semibold,
  },
  botaoAdicionarModal: {
    backgroundColor: Cores.primaria.base,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: Raio.md,
  },
  textoAdicionarModal: {
    color: '#0F172A',
    fontWeight: PesoFonte.bold,
  },
});
