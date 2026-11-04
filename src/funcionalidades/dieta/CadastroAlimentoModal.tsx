// Formulário para a pessoa cadastrar um alimento que não achou na busca (RN17).
// O alimento fica só dela (RLS) e não entra no plano.

import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CoresTema, Espacamento, FamiliaFonte, Fonte, Raio } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import { repositorioDieta } from '@/compartilhado/servicos/repositorio';
import { validarAlimento, type CampoAlimento } from './cadastro-alimento';

interface Props {
  visivel: boolean;
  onFechar: () => void;
  /** Recebe a linha criada no banco (id numérico). */
  onCadastrado: (alimento: Record<string, any>) => void;
}

const VAZIO: CampoAlimento = {
  nome: '',
  kcal: '',
  proteina: '',
  carboidrato: '',
  gordura: '',
  porcaoGramas: '',
};

const CAMPOS: { chave: keyof CampoAlimento; rotulo: string; teclado: 'default' | 'decimal-pad' }[] =
  [
    { chave: 'nome', rotulo: 'Nome do alimento', teclado: 'default' },
    { chave: 'proteina', rotulo: 'Proteína (g por 100 g)', teclado: 'decimal-pad' },
    { chave: 'carboidrato', rotulo: 'Carboidrato (g por 100 g)', teclado: 'decimal-pad' },
    { chave: 'gordura', rotulo: 'Gordura (g por 100 g)', teclado: 'decimal-pad' },
    {
      chave: 'kcal',
      rotulo: 'Calorias por 100 g (vazio = calculo pelos macros)',
      teclado: 'decimal-pad',
    },
    {
      chave: 'porcaoGramas',
      rotulo: 'Porção usual em gramas (vazio = 100 g)',
      teclado: 'decimal-pad',
    },
  ];

export function CadastroAlimentoModal({ visivel, onFechar, onCadastrado }: Props) {
  const { cores } = useTema();
  const estilos = useMemo(() => criarEstilos(cores), [cores]);
  const [campos, setCampos] = useState<CampoAlimento>(VAZIO);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const fechar = () => {
    setCampos(VAZIO);
    setErro(null);
    onFechar();
  };

  const salvar = async () => {
    const { alimento, erro: invalido } = validarAlimento(campos);
    if (!alimento) {
      setErro(invalido ?? 'Confira os valores.');
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      const criado = await repositorioDieta.cadastrarAlimento(alimento);
      setCampos(VAZIO);
      onCadastrado(criado);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não consegui salvar o alimento.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal visible={visivel} animationType="slide" transparent onRequestClose={fechar}>
      <KeyboardAvoidingView
        style={estilos.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={estilos.sheet}>
          <Text style={estilos.titulo}>Cadastrar alimento</Text>
          <Text style={estilos.ajuda}>Só você vê este alimento. Use os valores do rótulo.</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            {CAMPOS.map((c) => (
              <View key={c.chave} style={estilos.campo}>
                <Text style={estilos.rotulo}>{c.rotulo}</Text>
                <TextInput
                  style={estilos.input}
                  value={campos[c.chave]}
                  onChangeText={(t) => setCampos((a) => ({ ...a, [c.chave]: t }))}
                  keyboardType={c.teclado}
                  placeholderTextColor={cores.textoSecundario}
                  maxLength={c.chave === 'nome' ? 80 : 7}
                  accessibilityLabel={c.rotulo}
                />
              </View>
            ))}
            {erro ? <Text style={estilos.erro}>{erro}</Text> : null}
          </ScrollView>
          <View style={estilos.acoes}>
            <TouchableOpacity style={estilos.btnSecundario} onPress={fechar} disabled={salvando}>
              <Text style={estilos.btnSecundarioTexto}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={estilos.btnPrimario} onPress={salvar} disabled={salvando}>
              {salvando ? (
                <ActivityIndicator color={cores.textoSobreDestaque} />
              ) : (
                <Text style={estilos.btnPrimarioTexto}>Salvar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const criarEstilos = (cores: CoresTema) =>
  StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
    sheet: {
      maxHeight: '90%',
      backgroundColor: cores.elevada,
      borderTopLeftRadius: Raio.xl,
      borderTopRightRadius: Raio.xl,
      padding: Espacamento.lg,
    },
    titulo: { fontFamily: FamiliaFonte.bold, fontSize: Fonte.subtitulo, color: cores.texto },
    ajuda: { color: cores.textoSecundario, marginTop: 4, marginBottom: Espacamento.md },
    campo: { marginBottom: Espacamento.md },
    rotulo: { color: cores.textoSecundario, fontSize: 13, marginBottom: 4 },
    input: {
      backgroundColor: cores.separador,
      borderRadius: Raio.md,
      color: cores.texto,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
    },
    erro: { color: cores.destaque, marginBottom: Espacamento.md },
    acoes: { flexDirection: 'row', gap: 12, marginTop: Espacamento.md },
    btnSecundario: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 14,
      borderRadius: Raio.full,
      backgroundColor: cores.separador,
    },
    btnSecundarioTexto: { color: cores.texto, fontFamily: FamiliaFonte.bold },
    btnPrimario: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 14,
      borderRadius: Raio.full,
      backgroundColor: cores.destaque,
    },
    btnPrimarioTexto: { color: cores.textoSobreDestaque, fontFamily: FamiliaFonte.bold },
  });
