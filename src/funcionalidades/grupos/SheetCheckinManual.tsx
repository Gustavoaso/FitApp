// Sheet do check-in manual (RN23): só hoje ou ontem; 1 ponto por dia.
import React, { useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { BotaoPrimario, ChipOpcao } from '@/compartilhado/ui';
import { enviarFoto } from '@/compartilhado/servicos/foto-servico';
import { Espacamento, FamiliaFonte, Tipografia, type CoresTema } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import { ATIVIDADES, dataManual, validarMinutos } from './grupos';
import { registrarCheckinManual } from './grupos-servico';

export function SheetCheckinManual({
  grupoId,
  visivel,
  aoFechar,
  aoSalvar,
}: {
  grupoId: string;
  visivel: boolean;
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const { cores } = useTema();
  const estilos = useMemo(() => criarEstilos(cores), [cores]);
  const [atividade, setAtividade] = useState<string>(ATIVIDADES[0]);
  const [quando, setQuando] = useState<'hoje' | 'ontem'>('hoje');
  const [minutos, setMinutos] = useState('');
  const [descricao, setDescricao] = useState('');
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function escolherFoto() {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!r.canceled) setFotoUri(r.assets[0].uri);
  }

  async function salvar() {
    const min = validarMinutos(minutos);
    if (min === null) return setErro('Informe a duração em minutos (1 a 600).');
    setOcupado(true);
    try {
      const foto = fotoUri ? await enviarFoto('checkins', fotoUri) : undefined;
      const r = await registrarCheckinManual(grupoId, {
        atividade,
        minutos: min,
        data: dataManual(quando),
        descricao: descricao.trim() || undefined,
        foto,
      });
      if (!r.ok) return setErro(r.erro);
      setErro(null);
      setMinutos('');
      setDescricao('');
      setFotoUri(null);
      aoSalvar();
    } catch {
      setErro('Não deu certo. Tente de novo.');
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Modal
      visible={visivel}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={aoFechar}
    >
      <View style={estilos.conteudo}>
        <Text accessibilityRole="header" style={estilos.titulo}>
          Check-in manual
        </Text>
        <View style={estilos.chips}>
          {ATIVIDADES.map((a) => (
            <ChipOpcao
              key={a}
              rotulo={a}
              selecionado={a === atividade}
              aoPressionar={() => setAtividade(a)}
            />
          ))}
        </View>
        <View style={estilos.chips}>
          {(['hoje', 'ontem'] as const).map((q) => (
            <ChipOpcao
              key={q}
              rotulo={q}
              selecionado={q === quando}
              aoPressionar={() => setQuando(q)}
            />
          ))}
        </View>
        <TextInput
          accessibilityLabel="Duração em minutos"
          placeholder="Duração (min)"
          placeholderTextColor={cores.textoSecundario}
          keyboardType="number-pad"
          value={minutos}
          onChangeText={setMinutos}
          style={estilos.entrada}
        />
        <TextInput
          accessibilityLabel="Descrição"
          placeholder="Descrição (opcional)"
          placeholderTextColor={cores.textoSecundario}
          value={descricao}
          onChangeText={setDescricao}
          maxLength={280}
          style={estilos.entrada}
        />
        <BotaoPrimario
          texto={fotoUri ? 'Trocar foto' : 'Adicionar foto'}
          variante="outline"
          aoPresionar={escolherFoto}
        />
        {erro ? <Text style={{ color: cores.erro }}>{erro}</Text> : null}
        <BotaoPrimario texto="Salvar check-in" aoPresionar={salvar} carregando={ocupado} />
        <BotaoPrimario texto="Cancelar" variante="outline" aoPresionar={aoFechar} />
      </View>
    </Modal>
  );
}

function criarEstilos(cores: CoresTema) {
  return StyleSheet.create({
    conteudo: {
      flex: 1,
      padding: Espacamento.lg,
      gap: Espacamento.md,
      backgroundColor: cores.fundo,
    },
    titulo: { fontFamily: FamiliaFonte.semibold, fontSize: Tipografia.titulo3, color: cores.texto },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacamento.sm },
    entrada: {
      minHeight: 48,
      borderRadius: 12,
      paddingHorizontal: Espacamento.md,
      color: cores.texto,
      backgroundColor: cores.superficie ?? cores.fundo,
    },
  });
}
