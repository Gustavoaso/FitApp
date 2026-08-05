// ============================================================
// COMPONENTE: Visualizador JSON Interativo (componentes/ui/VisualizadorJSONModal.tsx)
// ============================================================
// Exibe os dados retornados pelas APIs (TacoAPI e ExerciseDB) diretamente
// na interface do app com suporte a expansão/colapso por item e ScrollView progressivo.
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { SymbolView } from 'expo-symbols';
import { Cores, Espacamento, FamiliaFonte, Fonte, PesoFonte, Raio } from '../../constantes/Cores';

interface ItemTreeProps {
  label: string;
  valor: any;
  nivel?: number;
}

function ItemNode({ label, valor, nivel = 0 }: ItemTreeProps) {
  const [expandido, setExpandido] = useState(nivel === 0);

  const eObjeto = valor !== null && typeof valor === 'object';
  const eArray = Array.isArray(valor);

  if (!eObjeto) {
    let corValor = '#A7F3D0'; // string verde claro
    if (typeof valor === 'number') corValor = '#FDE047'; // numero amarelo
    if (typeof valor === 'boolean') corValor = '#F472B6'; // boolean rosa
    if (valor === null || valor === undefined) corValor = '#9CA3AF'; // null cinza

    return (
      <View style={[estilos.linhaProp, { paddingLeft: nivel * 14 }]}>
        <Text style={estilos.txtChave}>{label}: </Text>
        <Text style={[estilos.txtValor, { color: corValor }]}>
          {valor === null ? 'null' : String(valor)}
        </Text>
      </View>
    );
  }

  const chaves = Object.keys(valor);
  const contagemItens = eArray ? `${valor.length} itens` : `${chaves.length} chaves`;

  return (
    <View style={{ marginVertical: 2, paddingLeft: nivel * 10 }}>
      <TouchableOpacity
        style={estilos.rowHeaderNo}
        onPress={() => setExpandido(!expandido)}
        activeOpacity={0.7}
      >
        <SymbolView
          name={expandido ? 'chevron.down' : 'chevron.right'}
          size={12}
          tintColor={Cores.accent}
          style={{ marginRight: 6 }}
        />
        <Text style={estilos.txtChaveNo}>{label}: </Text>
        <Text style={estilos.txtTipoNo}>
          {eArray ? `[${contagemItens}]` : `{${contagemItens}}`}
        </Text>
      </TouchableOpacity>

      {expandido && (
        <View style={estilos.blocoFilhos}>
          {chaves.map((key) => (
            <ItemNode key={key} label={key} valor={valor[key]} nivel={nivel + 1} />
          ))}
        </View>
      )}
    </View>
  );
}

const ItemTreeJSON = React.memo(ItemNode);

interface VisualizadorJSONModalProps {
  visivel: boolean;
  aoFechar: () => void;
  dadosTaco: any[];
  dadosExerciseDB: any[];
  carregando?: boolean;
}

export function VisualizadorJSONModal({
  visivel,
  aoFechar,
  dadosTaco,
  dadosExerciseDB,
  carregando = false,
}: VisualizadorJSONModalProps) {
  const [abaAtiva, setAbaAtiva] = useState<'taco' | 'exercisedb'>('taco');
  const [limiteExibicao, setLimiteExibicao] = useState(30);

  const dadosLista = abaAtiva === 'taco' ? dadosTaco : dadosExerciseDB;

  const dadosFatiados = useMemo(() => {
    if (!Array.isArray(dadosLista)) return [];
    return dadosLista.slice(0, limiteExibicao);
  }, [dadosLista, limiteExibicao]);

  const carregarMaisItens = () => {
    if (limiteExibicao < dadosLista.length) {
      setLimiteExibicao((prev) => prev + 30);
    }
  };

  return (
    <Modal visible={visivel} animationType="slide" transparent statusBarTranslucent onRequestClose={aoFechar}>
      <View style={estilos.overlay}>
        <BlurView intensity={95} tint="dark" style={estilos.modalContent}>
          <SafeAreaView style={{ flex: 1 }}>
            {/* Header com Fechar */}
            <View style={estilos.topHeader}>
              <View style={{ flex: 1 }}>
                <Text style={estilos.tituloModal}>Inspetor de JSON das APIs</Text>
                <Text style={estilos.subtituloModal}>
                  Inspecione os objetos brutos diretamente na tela
                </Text>
              </View>

              <TouchableOpacity onPress={aoFechar} style={estilos.btnFechar}>
                <SymbolView name="xmark.circle.fill" size={24} tintColor={Cores.texto.secundario} />
              </TouchableOpacity>
            </View>

            {/* Segmented Control (Abas TacoAPI x ExerciseDB) */}
            <View style={estilos.segmentContainer}>
              <TouchableOpacity
                style={[estilos.segmentBtn, abaAtiva === 'taco' && estilos.segmentBtnAtivo]}
                onPress={() => {
                  setAbaAtiva('taco');
                  setLimiteExibicao(30);
                }}
              >
                <View style={estilos.segmentLabel}>
                  <SymbolView name="leaf.fill" size={14} tintColor={abaAtiva === 'taco' ? Cores.accent : Cores.texto.secundario} />
                  <Text style={[estilos.segmentTxt, abaAtiva === 'taco' && estilos.segmentTxtAtivo]}>TacoAPI ({dadosTaco.length})</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[estilos.segmentBtn, abaAtiva === 'exercisedb' && estilos.segmentBtnAtivo]}
                onPress={() => {
                  setAbaAtiva('exercisedb');
                  setLimiteExibicao(30);
                }}
              >
                <View style={estilos.segmentLabel}>
                  <SymbolView name="dumbbell.fill" size={14} tintColor={abaAtiva === 'exercisedb' ? Cores.accent : Cores.texto.secundario} />
                  <Text style={[estilos.segmentTxt, abaAtiva === 'exercisedb' && estilos.segmentTxtAtivo]}>ExerciseDB ({dadosExerciseDB.length})</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Conteúdo Otimizado: ScrollView com Paginação Progressiva */}
            {carregando ? (
              <View style={estilos.boxCarregando}>
                <ActivityIndicator size="large" color={Cores.accent} />
                <Text style={estilos.txtCarregando}>Buscando dados das APIs...</Text>
                <Text style={estilos.txtSubCarregando}>
                  Carregamento instantâneo via cache local e banco Supabase
                </Text>
              </View>
            ) : dadosLista.length === 0 ? (
              <View style={estilos.boxVazio}>
                <Text style={estilos.txtVazio}>Nenhum objeto carregado para esta API.</Text>
              </View>
            ) : (
              <ScrollView
                style={estilos.scrollArea}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={400}
                onScroll={({ nativeEvent }) => {
                  const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                  const estaNoFim = layoutMeasurement.height + contentOffset.y >= contentSize.height - 300;
                  if (estaNoFim) {
                    carregarMaisItens();
                  }
                }}
              >
                {dadosFatiados.map((item, index) => {
                  const tituloItem = item.nome || item.name || item.description || `Item #${index + 1}`;
                  return (
                    <View key={index} style={estilos.cardItemJSON}>
                      <ItemTreeJSON label={`Item [${index}] — ${tituloItem}`} valor={item} />
                    </View>
                  );
                })}

                {limiteExibicao < dadosLista.length && (
                  <TouchableOpacity style={estilos.btnMais} onPress={carregarMaisItens}>
                    <Text style={estilos.txtBtnMais}>
                      Carregar mais (+30 de {dadosLista.length - limiteExibicao} restantes)
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </SafeAreaView>
        </BlurView>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: Espacamento.lg,
    paddingTop: 20,
    backgroundColor: 'rgba(10, 12, 16, 0.96)',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tituloModal: {
    fontFamily: FamiliaFonte.bold,
    fontSize: Fonte.subtitulo,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
  },
  subtituloModal: {
    fontFamily: FamiliaFonte.regular,
    fontSize: Fonte.micro,
    color: Cores.texto.secundario,
    marginTop: 2,
  },
  btnFechar: {
    padding: 4,
  },

  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: Cores.fundo.elevada,
    borderRadius: Raio.md,
    padding: 4,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Raio.sm,
  },
  segmentBtnAtivo: {
    backgroundColor: Cores.accent,
  },
  segmentLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  segmentTxt: {
    fontFamily: FamiliaFonte.bold,
    fontSize: Fonte.label,
    color: Cores.texto.secundario,
  },
  segmentTxtAtivo: {
    color: '#080A0E',
  },

  scrollArea: {
    flex: 1,
  },
  cardItemJSON: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: Raio.md,
    borderWidth: 1,
    borderColor: Cores.borda.sutil,
    padding: 12,
    marginBottom: 12,
  },

  rowHeaderNo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  txtChaveNo: {
    fontFamily: FamiliaFonte.bold,
    fontSize: 13,
    color: Cores.accent,
  },
  txtTipoNo: {
    fontFamily: FamiliaFonte.regular,
    fontSize: 12,
    color: Cores.texto.secundario,
  },
  blocoFilhos: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(234, 179, 8, 0.2)',
    marginLeft: 6,
    paddingLeft: 6,
    marginTop: 4,
  },

  linhaProp: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingVertical: 2,
  },
  txtChave: {
    fontFamily: FamiliaFonte.semibold,
    fontSize: 12,
    color: Cores.texto.principal,
  },
  txtValor: {
    fontFamily: FamiliaFonte.regular,
    fontSize: 12,
  },

  boxVazio: {
    alignItems: 'center',
    padding: 40,
  },
  txtVazio: {
    fontFamily: FamiliaFonte.regular,
    color: Cores.texto.secundario,
  },

  boxCarregando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  txtCarregando: {
    fontFamily: FamiliaFonte.bold,
    fontSize: Fonte.corpo,
    color: Cores.texto.principal,
    marginTop: 16,
  },
  txtSubCarregando: {
    fontFamily: FamiliaFonte.regular,
    fontSize: Fonte.micro,
    color: Cores.texto.secundario,
    marginTop: 6,
    textAlign: 'center',
  },

  btnMais: {
    backgroundColor: Cores.fundo.elevada,
    paddingVertical: 12,
    borderRadius: Raio.md,
    alignItems: 'center',
    marginVertical: 12,
    borderWidth: 1,
    borderColor: Cores.borda.sutil,
  },
  txtBtnMais: {
    fontFamily: FamiliaFonte.bold,
    fontSize: Fonte.label,
    color: Cores.accent,
  },
});
