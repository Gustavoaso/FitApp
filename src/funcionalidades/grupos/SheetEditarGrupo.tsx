// Edição do grupo (só o criador; o banco confere): nome, descrição, banner e data de fim.
import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { BotaoPrimario } from '@/compartilhado/ui';
import { Espacamento, FamiliaFonte, Tipografia, type CoresTema } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import { SeletorBanner } from './SeletorBanner';
import {
  dataBrParaISO,
  dataISOParaBr,
  validarDescricao,
  validarNomeGrupo,
  type Grupo,
} from './grupos';
import { editarGrupo } from './grupos-servico';

export function SheetEditarGrupo({
  grupo,
  visivel,
  aoFechar,
  aoSalvar,
}: {
  grupo: Grupo;
  visivel: boolean;
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const { cores } = useTema();
  const estilos = useMemo(() => criarEstilos(cores), [cores]);
  const [nome, setNome] = useState(grupo.nome);
  const [descricao, setDescricao] = useState(grupo.descricao ?? '');
  const [banner, setBanner] = useState<string | null>(grupo.banner);
  const [fim, setFim] = useState(dataISOParaBr(grupo.fim));
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function salvar() {
    const n = validarNomeGrupo(nome);
    if ('erro' in n) return setErro(n.erro);
    const d = validarDescricao(descricao);
    if ('erro' in d) return setErro(d.erro);
    const f = dataBrParaISO(fim);
    if (f === 'invalida') return setErro('Use a data de fim como DD/MM/AAAA, ou deixe em branco.');
    setOcupado(true);
    const r = await editarGrupo(grupo.id, {
      nome: n.nome,
      descricao: d.descricao,
      banner,
      fim: f,
    });
    setOcupado(false);
    if (!r.ok) return setErro(r.erro);
    setErro(null);
    aoSalvar();
  }

  return (
    <Modal
      visible={visivel}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={aoFechar}
    >
      <ScrollView contentContainerStyle={estilos.conteudo}>
        <Text accessibilityRole="header" style={estilos.titulo}>
          Editar grupo
        </Text>
        <TextInput
          accessibilityLabel="Nome do grupo"
          style={estilos.campo}
          value={nome}
          onChangeText={setNome}
          maxLength={40}
        />
        <TextInput
          accessibilityLabel="Descrição"
          style={estilos.campo}
          value={descricao}
          onChangeText={setDescricao}
          placeholder="Descrição (opcional)"
          placeholderTextColor={cores.textoSecundario}
          maxLength={280}
          multiline
        />
        <TextInput
          accessibilityLabel="Data de fim"
          style={estilos.campo}
          value={fim}
          onChangeText={setFim}
          placeholder="Fim: DD/MM/AAAA (vazio = contínuo)"
          placeholderTextColor={cores.textoSecundario}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />
        <SeletorBanner valor={banner} aoMudar={setBanner} />
        {erro ? <Text style={{ color: cores.erro }}>{erro}</Text> : null}
        <BotaoPrimario texto="Salvar grupo" aoPresionar={salvar} carregando={ocupado} />
        <BotaoPrimario texto="Cancelar" variante="outline" aoPresionar={aoFechar} />
      </ScrollView>
    </Modal>
  );
}

function criarEstilos(cores: CoresTema) {
  return StyleSheet.create({
    conteudo: { padding: Espacamento.lg, gap: Espacamento.md, backgroundColor: cores.fundo },
    titulo: { fontFamily: FamiliaFonte.semibold, fontSize: Tipografia.titulo3, color: cores.texto },
    campo: {
      minHeight: 48,
      borderRadius: 12,
      paddingHorizontal: Espacamento.md,
      color: cores.texto,
      backgroundColor: cores.superficie,
    },
  });
}
