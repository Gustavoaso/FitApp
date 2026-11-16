// Detalhe do grupo (RN23): ranking com pódio, feed de check-ins, convite e gestão.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { BotaoPrimario, CardVidro, ChipOpcao, EstadoErro, Skeleton } from '@/compartilhado/ui';
import { BannerGrupo } from './BannerGrupo';
import { CardCheckin } from './CardCheckin';
import { SheetCheckinManual } from './SheetCheckinManual';
import {
  Espacamento,
  FamiliaFonte,
  PesoFonte,
  Tipografia,
  type CoresTema,
} from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import { Entrada, useQuique } from '@/compartilhado/movimento';
import {
  mensagemConvite,
  textoPontos,
  type Checkin,
  type Grupo,
  type LinhaRanking,
} from './grupos';
import {
  buscarFeed,
  buscarRanking,
  definirCheckinAutomatico,
  encerrarGrupo,
  listarGrupos,
  removerMembro,
  sairDoGrupo,
} from './grupos-servico';

/** Posição no ranking; o pódio (1º ao 3º) dá um quique leve ao entrar (celebração). */
function PosicaoRanking({
  posicao,
  estilo,
  cor,
}: {
  posicao: number;
  estilo: StyleProp<TextStyle>;
  cor: string;
}) {
  const { estilo: animado, quicar } = useQuique(1.25);
  useEffect(() => {
    if (posicao <= 3) quicar();
    // quicar só na entrada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Animated.Text style={[estilo, posicao <= 3 && { color: cor }, animado]}>
      {posicao}º
    </Animated.Text>
  );
}

export default function TelaGrupo() {
  const { cores } = useTema();
  const estilos = useMemo(() => criarEstilos(cores), [cores]);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [ranking, setRanking] = useState<LinhaRanking[]>([]);
  const [feed, setFeed] = useState<Checkin[]>([]);
  const [falhou, setFalhou] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [aba, setAba] = useState<'ranking' | 'feed' | 'membros'>('ranking');
  const [manual, setManual] = useState(false);

  const carregar = useCallback(async () => {
    const [lista, r, f] = await Promise.all([listarGrupos(), buscarRanking(id), buscarFeed(id)]);
    const achado = lista.ok ? lista.valor.find((g) => g.id === id) : undefined;
    if (!lista.ok || !r.ok || !f.ok || !achado) return setFalhou(true);
    setFalhou(false);
    setGrupo(achado);
    setRanking(r.valor);
    setFeed(f.valor);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  async function executar(acao: Promise<{ ok: boolean; erro?: string }>, voltar = false) {
    const r = await acao;
    if (!r.ok) return setAviso(r.erro ?? 'Não deu certo. Tente de novo.');
    setAviso(null);
    if (voltar) router.back();
    else carregar();
  }

  function confirmar(titulo: string, texto: string, botao: string, acao: () => void) {
    Alert.alert(titulo, texto, [
      { text: 'Cancelar', style: 'cancel' },
      { text: botao, style: 'destructive', onPress: acao },
    ]);
  }

  if (falhou) return <EstadoErro aoTentarDeNovo={carregar} />;
  if (!grupo) {
    return (
      <View style={estilos.conteudo}>
        <Skeleton altura={120} />
        <Skeleton altura={120} />
      </View>
    );
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={estilos.conteudo}>
      <Stack.Screen options={{ title: grupo.nome }} />
      <BannerGrupo banner={grupo.banner} altura={140}>
        <Text style={estilos.tituloBanner}>{grupo.nome}</Text>
        <Text style={estilos.subBanner}>
          {grupo.membros} {grupo.membros === 1 ? 'membro' : 'membros'}
          {grupo.encerrado ? ' · Encerrado' : ''}
        </Text>
      </BannerGrupo>
      {grupo.descricao ? <Text style={estilos.rotulo}>{grupo.descricao}</Text> : null}
      <View style={estilos.abas}>
        {(['ranking', 'feed', 'membros'] as const).map((a) => (
          <ChipOpcao
            key={a}
            rotulo={a === 'ranking' ? 'Ranking' : a === 'feed' ? 'Feed' : 'Membros'}
            selecionado={aba === a}
            aoPressionar={() => setAba(a)}
          />
        ))}
      </View>
      {aviso ? <Text style={estilos.erro}>{aviso}</Text> : null}

      {grupo.codigo ? (
        <CardVidro>
          <Text style={estilos.rotulo}>Código de convite</Text>
          <Text
            style={estilos.codigo}
            accessibilityLabel={`Código ${grupo.codigo.split('').join(' ')}`}
          >
            {grupo.codigo}
          </Text>
          <BotaoPrimario
            texto="Compartilhar código"
            aoPresionar={() =>
              Share.share({ message: mensagemConvite(grupo.nome, grupo.codigo ?? '') })
            }
          />
        </CardVidro>
      ) : null}

      {aba === 'ranking' ? (
        <>
          <View style={estilos.podio}>
            {ranking.slice(0, 3).map((l) => (
              <CardVidro
                key={l.membroId}
                padding="md"
                rotuloAcessibilidade={`${l.posicao}º ${l.apelido}, ${textoPontos(l.pontos)}`}
              >
                <PosicaoRanking
                  posicao={l.posicao}
                  estilo={estilos.posicao}
                  cor={cores.destaqueTexto}
                />
                <Text style={[estilos.apelido, l.ehVoce && { color: cores.destaqueTexto }]}>
                  {l.apelido}
                </Text>
                <Text style={estilos.valor}>{textoPontos(l.pontos)}</Text>
              </CardVidro>
            ))}
          </View>
          {ranking.slice(3).map((l) => (
            <Entrada key={l.membroId} indice={l.posicao - 1} estilo={estilos.linha}>
              <Text style={estilos.posicao}>{l.posicao}º</Text>
              <Text style={[estilos.apelido, l.ehVoce && { color: cores.destaqueTexto }]}>
                {l.apelido}
                {l.ehVoce ? ' (você)' : ''}
              </Text>
              <Text style={estilos.valor}>{textoPontos(l.pontos)}</Text>
            </Entrada>
          ))}
        </>
      ) : null}

      {aba === 'membros' ? (
        <CardVidro padding="md">
          {ranking.map((l) => (
            <Entrada key={l.membroId} indice={l.posicao - 1} estilo={estilos.linha}>
              <Text style={[estilos.apelido, l.ehVoce && { color: cores.destaqueTexto }]}>
                {l.apelido}
                {l.ehVoce ? ' (você)' : ''}
              </Text>
              <Text style={estilos.valor}>{textoPontos(l.pontos)}</Text>
              {grupo.ehCriador && !l.ehVoce && !grupo.encerrado ? (
                <Text
                  accessibilityRole="button"
                  accessibilityLabel={`Remover ${l.apelido}`}
                  style={estilos.remover}
                  onPress={() =>
                    confirmar(
                      `Remover ${l.apelido}?`,
                      'Os check-ins dessa pessoa no grupo serão apagados.',
                      'Remover',
                      () => executar(removerMembro(grupo.id, l.membroId)),
                    )
                  }
                >
                  Remover
                </Text>
              ) : null}
            </Entrada>
          ))}
        </CardVidro>
      ) : null}

      {aba === 'feed' ? (
        <>
          {!grupo.encerrado ? (
            <BotaoPrimario
              texto="Check-in manual"
              variante="outline"
              aoPresionar={() => setManual(true)}
            />
          ) : null}
          {feed.length === 0 ? (
            <Text style={estilos.rotulo}>
              Ainda sem check-ins. Conclua um treino para abrir o placar.
            </Text>
          ) : (
            feed.map((c) => <CardCheckin key={c.id} checkin={c} aoMudar={carregar} />)
          )}
        </>
      ) : null}

      {!grupo.encerrado ? (
        <CardVidro>
          <View style={estilos.linha}>
            <Text style={[estilos.apelido, estilos.flex]}>Check-in automático</Text>
            <Switch
              accessibilityLabel="Check-in automático neste grupo"
              value={grupo.checkinAutomatico}
              onValueChange={(v) => executar(definirCheckinAutomatico(grupo.id, v))}
            />
          </View>
          {grupo.ehCriador ? (
            <BotaoPrimario
              texto="Encerrar grupo"
              variante="outline"
              aoPresionar={() =>
                confirmar(
                  'Encerrar o grupo?',
                  'O ranking fica guardado, mas ninguém mais entra nem pontua.',
                  'Encerrar',
                  () => executar(encerrarGrupo(grupo.id)),
                )
              }
            />
          ) : (
            <BotaoPrimario
              texto="Sair do grupo"
              variante="outline"
              aoPresionar={() =>
                confirmar(
                  'Sair do grupo?',
                  'Seus check-ins neste grupo serão apagados.',
                  'Sair',
                  () => executar(sairDoGrupo(grupo.id), true),
                )
              }
            />
          )}
        </CardVidro>
      ) : null}
      <SheetCheckinManual
        grupoId={grupo.id}
        visivel={manual}
        aoFechar={() => setManual(false)}
        aoSalvar={() => {
          setManual(false);
          carregar();
        }}
      />
    </ScrollView>
  );
}

function criarEstilos(cores: CoresTema) {
  return StyleSheet.create({
    conteudo: { padding: Espacamento.lg, gap: Espacamento.md },
    linha: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.md, minHeight: 44 },
    flex: { flex: 1 },
    abas: { flexDirection: 'row', gap: Espacamento.sm },
    podio: { gap: Espacamento.sm },
    tituloBanner: {
      fontFamily: FamiliaFonte.semibold,
      fontSize: Tipografia.titulo2,
      color: '#FFFFFF',
    },
    subBanner: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Tipografia.subtitulo,
      color: '#FFFFFF',
    },
    secao: {
      fontFamily: FamiliaFonte.semibold,
      fontWeight: PesoFonte.semibold,
      fontSize: Tipografia.titulo3,
      color: cores.texto,
      marginTop: Espacamento.sm,
    },
    rotulo: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Tipografia.subtitulo,
      color: cores.textoSecundario,
    },
    codigo: {
      fontFamily: FamiliaFonte.semibold,
      fontSize: Tipografia.titulo1,
      letterSpacing: 6,
      color: cores.destaqueTexto,
      marginVertical: Espacamento.sm,
      fontVariant: ['tabular-nums'],
    },
    posicao: {
      width: 32,
      fontFamily: FamiliaFonte.semibold,
      fontSize: Tipografia.destaque,
      color: cores.textoSecundario,
    },
    apelido: {
      flexShrink: 1,
      flexGrow: 1,
      fontFamily: FamiliaFonte.semibold,
      fontSize: Tipografia.corpo,
      color: cores.texto,
    },
    valor: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Tipografia.subtitulo,
      color: cores.textoSecundario,
      fontVariant: ['tabular-nums'],
    },
    remover: { color: cores.erro, fontSize: Tipografia.rodape, paddingVertical: Espacamento.sm },
    erro: { color: cores.erro, fontSize: Tipografia.subtitulo },
  });
}
