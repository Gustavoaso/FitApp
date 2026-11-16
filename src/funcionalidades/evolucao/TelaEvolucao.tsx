// Fotos de evolução (RN29): frequência, lembrete, registro, visibilidade e comparação.
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  BotaoPrimario,
  CardVidro,
  ChipOpcao,
  EstadoErro,
  EstadoVazio,
  Skeleton,
} from '@/compartilhado/ui';
import { FotoStorage } from '@/compartilhado/ui/FotoStorage';
import { Espacamento, FamiliaFonte, Tipografia, type CoresTema } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import {
  ANGULOS,
  anguloComum,
  formatarData,
  lembreteVencido,
  temFoto,
  validarPeso,
  type Angulo,
  type Frequencia,
  type Registro,
} from './evolucao';
import {
  apagarRegistro,
  buscarFrequencia,
  criarRegistro,
  listarMeusGrupos,
  listarRegistros,
  mudarVisibilidade,
  salvarFrequencia,
  type GrupoSimples,
} from './evolucao-servico';

function hojeISO(): string {
  const d = new Date();
  const dois = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
}

export default function TelaEvolucao() {
  const { cores } = useTema();
  const estilos = useMemo(() => criarEstilos(cores), [cores]);
  const [registros, setRegistros] = useState<Registro[] | null>(null);
  const [grupos, setGrupos] = useState<GrupoSimples[]>([]);
  const [frequencia, setFrequencia] = useState<Frequencia>('mensal');
  const [falhou, setFalhou] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [novo, setNovo] = useState(false);
  const [comparar, setComparar] = useState<string[]>([]);

  const carregar = useCallback(async () => {
    const [r, g, f] = await Promise.all([
      listarRegistros(),
      listarMeusGrupos(),
      buscarFrequencia(),
    ]);
    setFalhou(!r.ok);
    if (r.ok) setRegistros(r.valor);
    setGrupos(g);
    setFrequencia(f);
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  async function trocarFrequencia(f: Frequencia) {
    setFrequencia(f);
    const r = await salvarFrequencia(f);
    setAviso(r.ok ? null : r.erro);
  }

  async function alternarGrupo(reg: Registro, grupo: string) {
    const novos = reg.grupos.includes(grupo)
      ? reg.grupos.filter((g) => g !== grupo)
      : [...reg.grupos, grupo];
    const r = await mudarVisibilidade(reg.id, reg.mostrarPeso, novos);
    setAviso(r.ok ? null : r.erro);
    carregar();
  }

  async function alternarPeso(reg: Registro, v: boolean) {
    const r = await mudarVisibilidade(reg.id, v, reg.grupos);
    setAviso(r.ok ? null : r.erro);
    carregar();
  }

  function apagar(reg: Registro) {
    Alert.alert('Apagar registro?', 'As fotos deste dia serão apagadas.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          const r = await apagarRegistro(reg);
          setAviso(r.ok ? null : r.erro);
          setComparar((c) => c.filter((x) => x !== reg.id));
          carregar();
        },
      },
    ]);
  }

  function alternarComparar(id: string) {
    setComparar((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c.slice(-1), id]));
  }

  if (falhou && !registros) return <EstadoErro aoTentarDeNovo={carregar} />;
  if (!registros) {
    return (
      <View style={estilos.conteudo}>
        <Skeleton altura={120} />
        <Skeleton altura={120} />
      </View>
    );
  }

  const par = comparar
    .map((id) => registros.find((r) => r.id === id))
    .filter((r): r is Registro => !!r)
    .sort((a, b) => a.data.localeCompare(b.data));
  const angulo = par.length === 2 ? anguloComum(par[0], par[1]) : null;

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={estilos.conteudo}>
      <Text style={estilos.texto}>
        Suas fotos são privadas. Você escolhe, em cada registro, se algum grupo pode ver.
      </Text>
      <View style={estilos.linha}>
        {(['semanal', 'mensal'] as const).map((f) => (
          <ChipOpcao
            key={f}
            rotulo={f === 'semanal' ? 'Toda semana' : 'Todo mês'}
            selecionado={frequencia === f}
            aoPressionar={() => trocarFrequencia(f)}
          />
        ))}
      </View>
      {lembreteVencido(frequencia, registros[0]?.data ?? null) ? (
        <CardVidro>
          <Text style={estilos.titulo}>Hora de registrar sua evolução</Text>
        </CardVidro>
      ) : null}
      {aviso ? <Text style={estilos.erro}>{aviso}</Text> : null}
      <BotaoPrimario texto="Novo registro" aoPresionar={() => setNovo(true)} />

      {par.length === 2 ? (
        <CardVidro>
          <Text style={estilos.titulo}>Comparação</Text>
          {angulo ? (
            <View style={estilos.linha}>
              {par.map((r) => (
                <View key={r.id} style={estilos.flex}>
                  <FotoStorage
                    bucket="evolucao"
                    caminho={r.fotos[angulo]}
                    rotulo={`Foto de ${formatarData(r.data)}`}
                    estilo={estilos.fotoGrande}
                  />
                  <Text style={estilos.texto}>{formatarData(r.data)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={estilos.texto}>Os dois registros não têm um ângulo em comum.</Text>
          )}
        </CardVidro>
      ) : null}

      {registros.length === 0 ? (
        <EstadoVazio
          simbolo="camera"
          titulo="Sem registros ainda"
          mensagem="Tire fotos de frente, de lado e de costas para ver a mudança ao longo do tempo."
        />
      ) : null}
      {registros.map((r) => (
        <CardVidro key={r.id}>
          <Text style={estilos.titulo}>
            {formatarData(r.data)}
            {r.pesoKg !== null ? ` · ${r.pesoKg} kg` : ''}
          </Text>
          <View style={estilos.linha}>
            {ANGULOS.filter((a) => r.fotos[a]).map((a) => (
              <FotoStorage
                key={a}
                bucket="evolucao"
                caminho={r.fotos[a]}
                rotulo={`Foto de ${a}, ${formatarData(r.data)}`}
                estilo={estilos.miniatura}
              />
            ))}
          </View>
          <Text style={estilos.texto}>
            {r.grupos.length === 0 ? 'Só eu' : `Visível em ${r.grupos.length} grupo(s)`}
          </Text>
          <View style={estilos.linha}>
            {grupos.map((g) => (
              <ChipOpcao
                key={g.id}
                multipla
                rotulo={g.nome}
                selecionado={r.grupos.includes(g.id)}
                aoPressionar={() => alternarGrupo(r, g.id)}
              />
            ))}
          </View>
          {r.pesoKg !== null ? (
            <View style={estilos.linha}>
              <Text style={[estilos.texto, estilos.flex]}>Mostrar o peso aos grupos</Text>
              <Switch
                accessibilityLabel="Mostrar o peso aos grupos"
                value={r.mostrarPeso}
                onValueChange={(v) => alternarPeso(r, v)}
              />
            </View>
          ) : null}
          <View style={estilos.linha}>
            <BotaoPrimario
              texto={comparar.includes(r.id) ? 'Tirar da comparação' : 'Comparar'}
              variante="outline"
              estilo={estilos.flex}
              aoPresionar={() => alternarComparar(r.id)}
            />
            <BotaoPrimario
              texto="Apagar"
              variante="outline"
              estilo={estilos.flex}
              aoPresionar={() => apagar(r)}
            />
          </View>
        </CardVidro>
      ))}

      <SheetNovoRegistro
        visivel={novo}
        grupos={grupos}
        aoFechar={() => setNovo(false)}
        aoSalvar={() => {
          setNovo(false);
          carregar();
        }}
      />
    </ScrollView>
  );
}

function SheetNovoRegistro({
  visivel,
  grupos,
  aoFechar,
  aoSalvar,
}: {
  visivel: boolean;
  grupos: GrupoSimples[];
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const { cores } = useTema();
  const estilos = useMemo(() => criarEstilos(cores), [cores]);
  const [uris, setUris] = useState<Partial<Record<Angulo, string>>>({});
  const [peso, setPeso] = useState('');
  const [mostrarPeso, setMostrarPeso] = useState(false);
  const [escolhidos, setEscolhidos] = useState<string[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function escolher(a: Angulo) {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!r.canceled) setUris((u) => ({ ...u, [a]: r.assets[0].uri }));
  }

  async function salvar() {
    if (!temFoto(uris)) return setErro('Escolha pelo menos uma foto.');
    const p = validarPeso(peso);
    if (p === 'invalido') return setErro('O peso vai de 20 a 400 kg.');
    setOcupado(true);
    const r = await criarRegistro({
      data: hojeISO(),
      pesoKg: p,
      mostrarPeso,
      uris,
      grupos: escolhidos,
    });
    setOcupado(false);
    if (!r.ok) return setErro(r.erro);
    setErro(null);
    setUris({});
    setPeso('');
    setMostrarPeso(false);
    setEscolhidos([]);
    aoSalvar();
  }

  return (
    <Modal
      visible={visivel}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={aoFechar}
    >
      <ScrollView contentContainerStyle={[estilos.conteudo, { backgroundColor: cores.fundo }]}>
        <Text accessibilityRole="header" style={estilos.titulo}>
          Novo registro
        </Text>
        {ANGULOS.map((a) => (
          <BotaoPrimario
            key={a}
            variante="outline"
            texto={`${uris[a] ? 'Trocar' : 'Adicionar'} foto de ${a}`}
            aoPresionar={() => escolher(a)}
          />
        ))}
        <TextInput
          accessibilityLabel="Peso em kg"
          placeholder="Peso em kg (opcional)"
          placeholderTextColor={cores.textoSecundario}
          keyboardType="decimal-pad"
          value={peso}
          onChangeText={setPeso}
          style={estilos.campo}
        />
        {grupos.length > 0 ? (
          <>
            <Text style={estilos.texto}>Quem pode ver? Sem escolher, só você.</Text>
            <View style={estilos.linha}>
              {grupos.map((g) => (
                <ChipOpcao
                  key={g.id}
                  multipla
                  rotulo={g.nome}
                  selecionado={escolhidos.includes(g.id)}
                  aoPressionar={() =>
                    setEscolhidos((e) =>
                      e.includes(g.id) ? e.filter((x) => x !== g.id) : [...e, g.id],
                    )
                  }
                />
              ))}
            </View>
            <View style={estilos.linha}>
              <Text style={[estilos.texto, estilos.flex]}>Mostrar o peso aos grupos</Text>
              <Switch
                accessibilityLabel="Mostrar o peso aos grupos"
                value={mostrarPeso}
                onValueChange={setMostrarPeso}
              />
            </View>
          </>
        ) : null}
        {erro ? <Text style={estilos.erro}>{erro}</Text> : null}
        <BotaoPrimario texto="Salvar registro" aoPresionar={salvar} carregando={ocupado} />
        <BotaoPrimario texto="Cancelar" variante="outline" aoPresionar={aoFechar} />
      </ScrollView>
    </Modal>
  );
}

function criarEstilos(cores: CoresTema) {
  return StyleSheet.create({
    conteudo: { padding: Espacamento.lg, gap: Espacamento.md },
    linha: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Espacamento.sm },
    flex: { flex: 1 },
    titulo: {
      fontFamily: FamiliaFonte.semibold,
      fontSize: Tipografia.destaque,
      color: cores.texto,
    },
    texto: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Tipografia.subtitulo,
      color: cores.textoSecundario,
    },
    erro: { color: cores.erro, fontSize: Tipografia.subtitulo },
    miniatura: { width: 72, height: 96, borderRadius: 12 },
    fotoGrande: { width: '100%', aspectRatio: 3 / 4, borderRadius: 16 },
    campo: {
      minHeight: 48,
      borderRadius: 12,
      paddingHorizontal: Espacamento.md,
      color: cores.texto,
      backgroundColor: cores.superficie,
    },
  });
}
