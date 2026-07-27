// ============================================================
// TELA: Dieta / Registro de Refeições (app/(tabs)/dieta.tsx)
// ============================================================
// Acompanhamento diário da dieta com progresso de calorias e macros,
// cards de cada refeição (Café, Almoço, Lanches, Jantar) e registro
// de novos alimentos.
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
} from 'react-native';
import { CardVidro, BotaoPrimario } from '../../componentes/ui';
import { Cores, Espacamento, Fonte, PesoFonte, Raio } from '../../constantes/Cores';
import { formatarCalorias, formatarGramas } from '@fitapp/utilidades';

interface ItemAlimento {
  nome: string;
  porcao: string;
  calorias: number;
}

interface Refeicao {
  id: string;
  nome: string;
  concluida: boolean;
  alimentos: ItemAlimento[];
}

export default function TelaDieta() {
  const [caloriasConsumidas, setCaloriasConsumidas] = useState(1247);
  const caloriasMeta = 2400;

  const [proteinas] = useState(89);
  const proteinasMeta = 160;

  const [carbos] = useState(156);
  const carbosMeta = 280;

  const [gorduras] = useState(38);
  const gordurasMeta = 72;

  // Lista de refeições do dia
  const [refeicoes, setRefeicoes] = useState<Refeicao[]>([
    {
      id: '1',
      nome: 'Café da Manhã ✓',
      concluida: true,
      alimentos: [
        { nome: 'Ovos mexidos', porcao: '3un', calorias: 210 },
        { nome: 'Pão integral', porcao: '2 fatias', calorias: 140 },
        { nome: 'Banana', porcao: '1un', calorias: 89 },
      ],
    },
    {
      id: '2',
      nome: 'Almoço',
      concluida: false,
      alimentos: [
        { nome: 'Arroz branco', porcao: '150g', calorias: 192 },
        { nome: 'Frango grelhado', porcao: '200g', calorias: 330 },
        { nome: 'Feijão carioca', porcao: '100g', calorias: 76 },
        { nome: 'Salada verde', porcao: 'à vontade', calorias: 15 },
      ],
    },
    {
      id: '3',
      nome: 'Lanche da Tarde',
      concluida: false,
      alimentos: [],
    },
    {
      id: '4',
      nome: 'Jantar',
      concluida: false,
      alimentos: [],
    },
  ]);

  // Modal de busca/adição de alimento
  const [modalVisivel, setModalVisivel] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');

  const registrarAlimentoExemplo = () => {
    // Adiciona Whey Protein como exemplo de registro rápido
    const novasRefeicoes = [...refeicoes];
    novasRefeicoes[2].alimentos.push({
      nome: 'Whey Protein Concentrado',
      porcao: '1 scoop (30g)',
      calorias: 120,
    });
    setRefeicoes(novasRefeicoes);
    setCaloriasConsumidas(caloriasConsumidas + 120);
    setModalVisivel(false);
  };

  return (
    <View style={estilos.container}>
      <ScrollView contentContainerStyle={estilos.scrollContent}>
        {/* Topo */}
        <View style={estilos.cabecalho}>
          <Text style={estilos.titulo}>Dieta — Segunda</Text>
          <Text style={estilos.caloriasHeader}>
            {caloriasConsumidas} / <Text style={estilos.textMuted}>{caloriasMeta} kcal</Text>
          </Text>
        </View>

        {/* Barra de Progresso Principal */}
        <CardVidro estilo={estilos.cardProgresso}>
          <View style={estilos.barFundo}>
            <View
              style={[
                estilos.barProgresso,
                { width: `${Math.min((caloriasConsumidas / caloriasMeta) * 100, 100)}%` },
              ]}
            />
          </View>

          {/* Mini Barras de Macros */}
          <View style={estilos.rowMiniMacros}>
            <Text style={estilos.textMacro}>
              P: <Text style={estilos.valMacro}>{proteinas}/{proteinasMeta}g</Text>
            </Text>
            <Text style={estilos.textMacro}>
              C: <Text style={estilos.valMacro}>{carbos}/{carbosMeta}g</Text>
            </Text>
            <Text style={estilos.textMacro}>
              G: <Text style={estilos.valMacro}>{gorduras}/{gordurasMeta}g</Text>
            </Text>
          </View>
        </CardVidro>

        {/* Lista de Refeições */}
        {refeicoes.map((ref) => (
          <CardVidro key={ref.id} estilo={estilos.cardRefeicao}>
            <Text style={estilos.refeicaoNome}>{ref.nome}</Text>

            {ref.alimentos.length > 0 ? (
              <View style={estilos.listaAlimentos}>
                {ref.alimentos.map((ali, i) => (
                  <View key={i} style={estilos.itemAlimento}>
                    <Text style={estilos.aliNome}>
                      {ali.nome} <Text style={estilos.aliPorcao}>({ali.porcao})</Text>
                    </Text>
                    <Text style={estilos.aliCalorias}>{ali.calorias} kcal</Text>
                  </View>
                ))}
              </View>
            ) : (
              <TouchableOpacity
                style={estilos.botaoRegistrar}
                onPress={() => setModalVisivel(true)}
              >
                <Text style={estilos.textoRegistrar}>+ Registrar Alimento</Text>
              </TouchableOpacity>
            )}
          </CardVidro>
        ))}
      </ScrollView>

      {/* Botão Flutuante (FAB) */}
      <TouchableOpacity
        style={estilos.fab}
        onPress={() => setModalVisivel(true)}
      >
        <Text style={estilos.fabTexto}>+</Text>
      </TouchableOpacity>

      {/* Modal de Busca de Alimentos na Tabela TACO */}
      <Modal visible={modalVisivel} animationType="slide" transparent>
        <View style={estilos.modalOverlay}>
          <CardVidro estilo={estilos.modalCard}>
            <Text style={estilos.modalTitulo}>Buscar Alimento (TACO)</Text>
            <TextInput
              style={estilos.inputBusca}
              placeholder="Ex: Frango, Arroz, Ovos..."
              placeholderTextColor={Cores.texto.secundario}
              value={termoBusca}
              onChangeText={setTermoBusca}
            />

            <TouchableOpacity style={estilos.itemResultadoBusca} onPress={registrarAlimentoExemplo}>
              <View>
                <Text style={estilos.resultadoNome}>Whey Protein Concentrado</Text>
                <Text style={estilos.resultadoPorcao}>1 scoop (30g) · TACO/Curado</Text>
              </View>
              <Text style={estilos.resultadoCalorias}>120 kcal</Text>
            </TouchableOpacity>

            <TouchableOpacity style={estilos.botaoFecharModal} onPress={() => setModalVisivel(false)}>
              <Text style={estilos.textoFechar}>Cancelar</Text>
            </TouchableOpacity>
          </CardVidro>
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
    padding: Espacamento.xxl,
    paddingBottom: 100,
  },
  cabecalho: {
    marginTop: Espacamento.md,
    marginBottom: Espacamento.lg,
  },
  titulo: {
    fontSize: Fonte.display,
    fontWeight: PesoFonte.extrabold,
    color: Cores.texto.principal,
  },
  caloriasHeader: {
    fontSize: Fonte.subtitulo,
    fontWeight: PesoFonte.bold,
    color: Cores.secundaria,
    marginTop: 4,
  },
  textMuted: {
    color: Cores.texto.secundario,
  },
  cardProgresso: {
    marginBottom: Espacamento.xl,
  },
  barFundo: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: Espacamento.md,
  },
  barProgresso: {
    height: '100%',
    backgroundColor: Cores.primaria.base,
    borderRadius: 6,
  },
  rowMiniMacros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textMacro: {
    fontSize: Fonte.label,
    color: Cores.texto.secundario,
    fontWeight: PesoFonte.medio,
  },
  valMacro: {
    color: Cores.texto.principal,
    fontWeight: PesoFonte.bold,
  },
  cardRefeicao: {
    marginBottom: Espacamento.lg,
  },
  refeicaoNome: {
    fontSize: Fonte.subtitulo,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
    marginBottom: Espacamento.md,
  },
  listaAlimentos: {
    gap: Espacamento.sm,
  },
  itemAlimento: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  aliNome: {
    color: Cores.texto.principal,
    fontSize: Fonte.corpo,
  },
  aliPorcao: {
    color: Cores.texto.secundario,
    fontSize: Fonte.label,
  },
  aliCalorias: {
    color: Cores.secundaria,
    fontWeight: PesoFonte.bold,
    fontSize: Fonte.corpo,
  },
  botaoRegistrar: {
    padding: Espacamento.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Raio.md,
    borderWidth: 1,
    borderColor: Cores.vidro.borda,
    alignItems: 'center',
  },
  textoRegistrar: {
    color: Cores.secundaria,
    fontWeight: PesoFonte.bold,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Cores.primaria.base,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: Cores.primaria.base,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  fabTexto: {
    fontSize: 32,
    color: Cores.texto.principal,
    marginTop: -2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    padding: Espacamento.xxl,
  },
  modalCard: {
    padding: Espacamento.xl,
  },
  modalTitulo: {
    fontSize: Fonte.titulo,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
    marginBottom: Espacamento.lg,
  },
  inputBusca: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Cores.vidro.borda,
    borderRadius: Raio.md,
    padding: Espacamento.md,
    fontSize: Fonte.corpo,
    color: Cores.texto.principal,
    marginBottom: Espacamento.lg,
  },
  itemResultadoBusca: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Espacamento.md,
    backgroundColor: Cores.primaria.suave,
    borderRadius: Raio.md,
    marginBottom: Espacamento.lg,
  },
  resultadoNome: {
    color: Cores.texto.principal,
    fontWeight: PesoFonte.bold,
    fontSize: Fonte.corpo,
  },
  resultadoPorcao: {
    color: Cores.texto.secundario,
    fontSize: Fonte.micro,
  },
  resultadoCalorias: {
    color: Cores.secundaria,
    fontWeight: PesoFonte.bold,
  },
  botaoFecharModal: {
    alignItems: 'center',
    padding: Espacamento.md,
  },
  textoFechar: {
    color: Cores.texto.secundario,
    fontWeight: PesoFonte.bold,
  },
});
