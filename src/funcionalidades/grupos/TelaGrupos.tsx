// Aba Grupos (RN23, RN24): lista, criar, entrar por código e apelido.
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import {
  BotaoPrimario,
  CardVidro,
  ChipOpcao,
  EstadoErro,
  EstadoVazio,
  Skeleton,
} from '@/compartilhado/ui';
import {
  Espacamento,
  FamiliaFonte,
  PesoFonte,
  Tipografia,
  type CoresTema,
} from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import { Entrada } from '@/compartilhado/movimento';
import {
  normalizarCodigo,
  validarApelido,
  validarNomeGrupo,
  type Grupo,
} from './grupos';
import {
  buscarApelido,
  criarGrupo,
  entrarNoGrupo,
  listarGrupos,
  salvarApelido,
} from './grupos-servico';

type Painel = 'criar' | 'entrar' | null;

export default function TelaGrupos() {
  const { cores } = useTema();
  const estilos = useMemo(() => criarEstilos(cores), [cores]);
  const router = useRouter();
  const [grupos, setGrupos] = useState<Grupo[] | null>(null);
  const [apelido, setApelido] = useState<string | null>(null);
  const [falhou, setFalhou] = useState(false);
  const [painel, setPainel] = useState<Painel>(null);
  const [textoApelido, setTextoApelido] = useState('');
  const [nome, setNome] = useState('');
  const [semanas, setSemanas] = useState('');
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    const [lista, meuApelido] = await Promise.all([listarGrupos(), buscarApelido()]);
    setApelido(meuApelido);
    setFalhou(!lista.ok);
    if (lista.ok) setGrupos(lista.valor);
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  async function confirmarApelido() {
    const v = validarApelido(textoApelido);
    if ('erro' in v) return setErro(v.erro);
    setOcupado(true);
    const r = await salvarApelido(v.apelido);
    setOcupado(false);
    if (!r.ok) return setErro(r.erro);
    setErro(null);
    setApelido(v.apelido);
  }

  async function confirmarCriar() {
    const v = validarNomeGrupo(nome);
    if ('erro' in v) return setErro(v.erro);
    const n = semanas.trim() === '' ? null : Number(semanas);
    if (n !== null && (!Number.isInteger(n) || n < 1 || n > 52)) {
      return setErro('A duração vai de 1 a 52 semanas (ou deixe em branco).');
    }
    setOcupado(true);
    const r = await criarGrupo(v.nome, n);
    setOcupado(false);
    if (!r.ok || !r.valor) return setErro(r.ok ? 'Não deu certo. Tente de novo.' : r.erro);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPainel(null);
    setNome('');
    setSemanas('');
    setErro(null);
    router.push(`/grupos/${r.valor.id}`);
  }

  async function confirmarEntrar() {
    const c = normalizarCodigo(codigo);
    if (!c) return setErro('O código tem 6 letras ou números.');
    setOcupado(true);
    const r = await entrarNoGrupo(c);
    setOcupado(false);
    if (!r.ok || !r.valor) return setErro(r.ok ? 'Não deu certo. Tente de novo.' : r.erro);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPainel(null);
    setCodigo('');
    setErro(null);
    router.push(`/grupos/${r.valor}`);
  }

  function abrir(p: Painel) {
    setErro(null);
    setPainel(painel === p ? null : p);
  }

  if (falhou && !grupos) return <EstadoErro aoTentarDeNovo={carregar} />;
  if (!grupos) {
    return (
      <View style={estilos.conteudo}>
        <Skeleton altura={80} />
        <Skeleton altura={80} />
      </View>
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={estilos.conteudo}
      keyboardShouldPersistTaps="handled"
    >
      {!apelido ? (
        <CardVidro>
          <Text style={estilos.titulo}>Escolha seu apelido</Text>
          <Text style={estilos.texto}>
            É o único dado seu que os outros membros veem. Nada de e-mail ou nome completo.
          </Text>
          <TextInput
            accessibilityLabel="Apelido"
            style={estilos.campo}
            value={textoApelido}
            onChangeText={setTextoApelido}
            placeholder="Apelido (3 a 20 caracteres)"
            placeholderTextColor={cores.textoSecundario}
            maxLength={20}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {erro ? <Text style={estilos.erro}>{erro}</Text> : null}
          <BotaoPrimario
            texto="Salvar apelido"
            aoPresionar={confirmarApelido}
            carregando={ocupado}
          />
        </CardVidro>
      ) : (
        <>
          <View style={estilos.acoes}>
            <BotaoPrimario
              texto="Criar grupo"
              aoPresionar={() => abrir('criar')}
              estilo={estilos.acao}
            />
            <BotaoPrimario
              texto="Entrar com código"
              aoPresionar={() => abrir('entrar')}
              variante="outline"
              estilo={estilos.acao}
            />
          </View>

          {painel === 'criar' ? (
            <CardVidro>
              <TextInput
                accessibilityLabel="Nome do grupo"
                style={estilos.campo}
                value={nome}
                onChangeText={setNome}
                placeholder="Nome do grupo"
                placeholderTextColor={cores.textoSecundario}
                maxLength={40}
              />
              <Text style={estilos.texto}>Pontuação: 1 ponto por dia com check-in.</Text>
              <TextInput
                accessibilityLabel="Duração em semanas"
                style={estilos.campo}
                value={semanas}
                onChangeText={setSemanas}
                placeholder="Duração em semanas (opcional)"
                placeholderTextColor={cores.textoSecundario}
                keyboardType="number-pad"
                maxLength={2}
              />
              {erro ? <Text style={estilos.erro}>{erro}</Text> : null}
              <BotaoPrimario texto="Criar" aoPresionar={confirmarCriar} carregando={ocupado} />
            </CardVidro>
          ) : null}

          {painel === 'entrar' ? (
            <CardVidro>
              <TextInput
                accessibilityLabel="Código do grupo"
                style={estilos.campo}
                value={codigo}
                onChangeText={setCodigo}
                placeholder="Código de 6 caracteres"
                placeholderTextColor={cores.textoSecundario}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
              />
              {erro ? <Text style={estilos.erro}>{erro}</Text> : null}
              <BotaoPrimario texto="Entrar" aoPresionar={confirmarEntrar} carregando={ocupado} />
            </CardVidro>
          ) : null}

          {grupos.length === 0 && !painel ? (
            <EstadoVazio
              simbolo="person.3"
              titulo="Treine junto"
              mensagem="Crie um grupo ou entre com o código de um amigo. Cada treino concluído vira um check-in."
            />
          ) : null}

          {grupos.map((g, i) => (
            <Entrada key={g.id} indice={i}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${g.nome}, ${g.membros} ${g.membros === 1 ? 'membro' : 'membros'}${g.encerrado ? ', encerrado' : ''}`}
                onPress={() => router.push(`/grupos/${g.id}`)}
              >
                <CardVidro>
                  <View style={estilos.linha}>
                    <View style={estilos.flex}>
                      <Text style={estilos.titulo}>{g.nome}</Text>
                      <Text style={estilos.texto}>
                        {g.membros} {g.membros === 1 ? 'membro' : 'membros'}
                        {g.encerrado ? ' · Encerrado' : ''}
                      </Text>
                    </View>
                    <SymbolView name="chevron.right" size={16} tintColor={cores.textoSecundario} />
                  </View>
                </CardVidro>
              </Pressable>
            </Entrada>
          ))}
        </>
      )}
    </ScrollView>
  );
}

function criarEstilos(cores: CoresTema) {
  return StyleSheet.create({
    conteudo: { padding: Espacamento.lg, gap: Espacamento.md },
    acoes: { flexDirection: 'row', gap: Espacamento.sm },
    acao: { flex: 1 },
    chips: { flexDirection: 'row', gap: Espacamento.sm, marginVertical: Espacamento.sm },
    linha: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.md },
    flex: { flex: 1 },
    titulo: {
      fontFamily: FamiliaFonte.semibold,
      fontWeight: PesoFonte.semibold,
      fontSize: Tipografia.destaque,
      color: cores.texto,
    },
    texto: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Tipografia.subtitulo,
      color: cores.textoSecundario,
      marginVertical: Espacamento.xs,
    },
    erro: { fontSize: Tipografia.subtitulo, color: cores.erro, marginBottom: Espacamento.sm },
    campo: {
      minHeight: 44,
      fontSize: Tipografia.corpo,
      color: cores.texto,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: cores.separador,
      marginVertical: Espacamento.sm,
    },
  });
}
