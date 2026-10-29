// ============================================================
// TELA: Resultado do plano (app/questionario/resultado.tsx)
// ============================================================
// Mockup aprovado: docs/mockups/resultado-unido-2026-10-26.html, variação A.
// Orbe sólido com a meta de kcal e o anel dividido pelos macros, 4 nós
// (P, C, G, água), linha do tempo do plano, "Por que estes números" com
// fontes da base de conhecimento (abrem um formSheet) e aviso profissional.
// Vidro só na barra fixa do CTA. Sem plano nos parâmetros, gera aqui (etapa 9).
// ============================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { BlurView } from 'expo-blur';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BotaoPrimario, EstadoErro, MomentoConquista, Skeleton } from '@/compartilhado/ui';
import {
  CoresMacros,
  CoresTema,
  Espacamento,
  FamiliaFonte,
  PesoFonte,
  RAIO_CARTAO,
  Tipografia,
} from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import { formatarAgua } from '@/compartilhado/utilidades';
import { repositorioPlano } from '@/compartilhado/servicos/repositorio';
import type { DadosQuestionario, PlanoIAGerado } from '@/compartilhado/tipos';
import { gerarPlano } from './gerar-plano-servico';
import { descreverBalanco, segmentosAnel } from './resumo-resultado';
import { perfilDoQuestionario } from './mapear-plano';

// PREMISSA (textos): aviso e rótulos da tela.
export const AVISO_PROFISSIONAL = 'Estimativa geral, não substitui nutricionista ou médico.';

const ORBE = 200;
const ESPESSURA_ANEL = 10;
const RAIO_ANEL = (ORBE - ESPESSURA_ANEL) / 2 - 3;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO_ANEL;
// Espaço entre os traços; as pontas redondas comem metade da espessura de cada lado.
const ESPACO_ANEL = ESPESSURA_ANEL + 6;

const COR_MACRO = {
  proteina: CoresMacros.proteina,
  carboidrato: CoresMacros.carboidrato,
  gordura: CoresMacros.gordura,
} as const;

function lerJson<T>(texto: string | undefined): T | null {
  if (!texto) return null;
  try {
    return JSON.parse(texto) as T;
  } catch {
    return null;
  }
}

/** Reduzir Transparência ligado → barra sólida no lugar do vidro. */
function useReduzirTransparencia() {
  const [reduzir, setReduzir] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceTransparencyEnabled()
      .then(setReduzir)
      .catch(() => {});
    const assinatura = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduzir);
    return () => assinatura.remove();
  }, []);
  return reduzir;
}

// PREMISSA (textos): fases mostradas enquanto o Ollama trabalha. O serviço não
// avisa o progresso real; o texto avança pelo tempo, até a última fase.
export const FASES_GERACAO = [
  'Montando seu treino…',
  'Escolhendo alimentos…',
  'Conferindo as contas…',
];
const INTERVALO_FASE_MS = 20_000;

function useFaseGeracao(ativo: boolean) {
  const [fase, setFase] = useState(0);
  // Volta à primeira fase quando a geração recomeça (ajuste no render, sem setState em efeito).
  const [ativoAnterior, setAtivoAnterior] = useState(ativo);
  if (ativo !== ativoAnterior) {
    setAtivoAnterior(ativo);
    if (ativo) setFase(0);
  }
  useEffect(() => {
    if (!ativo) return;
    const relogio = setInterval(
      () => setFase((f) => Math.min(f + 1, FASES_GERACAO.length - 1)),
      INTERVALO_FASE_MS,
    );
    return () => clearInterval(relogio);
  }, [ativo]);
  return fase;
}

export default function TelaResultadoQuestionario() {
  const { cores, escuro } = useTema();
  const estilos = useMemo(() => criarEstilos(cores), [cores]);
  const router = useRouter();
  const margens = useSafeAreaInsets();
  const reduzirTransparencia = useReduzirTransparencia();
  const { plano, respostas } = useLocalSearchParams<{ plano?: string; respostas?: string }>();
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [conquista, setConquista] = useState(false);

  const dadosRespostas = useMemo(() => lerJson<DadosQuestionario>(respostas), [respostas]);
  // Sem plano pronto nos parâmetros, a tela gera a partir das respostas.
  const [dadosPlano, setDadosPlano] = useState<PlanoIAGerado | null>(() =>
    lerJson<PlanoIAGerado>(plano),
  );
  const [gerarAoAbrir] = useState(!dadosPlano && !!dadosRespostas);
  const [gerando, setGerando] = useState(gerarAoAbrir);
  const [erroGeracao, setErroGeracao] = useState<string | null>(null);
  const fase = useFaseGeracao(gerando);

  // setState só nos callbacks da promessa, para poder rodar no efeito de abertura.
  const executarGeracao = useCallback(() => {
    if (!dadosRespostas) return;
    gerarPlano(dadosRespostas)
      .then((resultado) => setDadosPlano(resultado.plano))
      .catch((erro) =>
        setErroGeracao(erro instanceof Error ? erro.message : 'Não consegui gerar o plano.'),
      )
      .finally(() => setGerando(false));
  }, [dadosRespostas]);

  // "Tentar de novo": limpa o erro e mostra o carregando antes de gerar.
  const gerar = () => {
    if (!dadosRespostas) return;
    setErroGeracao(null);
    setGerando(true);
    executarGeracao();
  };

  // Gera uma vez ao abrir; o estado inicial já está em "gerando".
  useEffect(() => {
    if (gerarAoAbrir) executarGeracao();
  }, [gerarAoAbrir, executarGeracao]);

  const ajustarRespostas = () => {
    router.push({
      pathname: '/questionario',
      params: {
        dadosFormulario: respostas || JSON.stringify(dadosRespostas || {}),
      },
    });
  };

  if (gerando) {
    return (
      <View style={[estilos.container, estilos.centralizado]}>
        <Skeleton largura={ORBE} altura={ORBE} raio={ORBE / 2} />
        <View style={estilos.linhaNos}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} largura={64} altura={64} raio={32} />
          ))}
        </View>
        <Text style={estilos.titulo3} accessibilityLiveRegion="polite">
          {FASES_GERACAO[fase]}
        </Text>
        <Text style={estilos.legenda}>Isso pode levar até 3 minutos.</Text>
      </View>
    );
  }

  if (erroGeracao) {
    return (
      <View style={[estilos.container, estilos.centralizado]}>
        <EstadoErro mensagem={erroGeracao} aoTentarDeNovo={gerar} />
        <Pressable accessibilityRole="button" onPress={ajustarRespostas} hitSlop={12}>
          <Text style={estilos.legenda}>Revisar respostas</Text>
        </Pressable>
      </View>
    );
  }

  const resumo = dadosPlano?.resumo;
  if (!dadosPlano || !resumo) {
    return (
      <View style={[estilos.container, estilos.centralizado]}>
        <Text style={estilos.titulo3}>Planejamento indisponível</Text>
        <Text style={estilos.legenda}>Gere o planejamento novamente para continuar.</Text>
      </View>
    );
  }

  const aceitarEIniciar = async () => {
    setErroSalvar(null);
    setSalvando(true);
    try {
      await repositorioPlano.salvarPlanoComoAtivo(
        dadosPlano,
        dadosRespostas,
        dadosRespostas ? perfilDoQuestionario(dadosRespostas) : undefined,
      );
      setConquista(true);
    } catch (erro) {
      setErroSalvar(
        erro instanceof Error ? erro.message : 'Erro desconhecido ao salvar o planejamento.',
      );
    } finally {
      setSalvando(false);
    }
  };

  const { macros } = resumo;
  const refeicoes = dadosPlano.dieta?.refeicoes ?? [];
  const diasTreino = dadosPlano.treino?.dias ?? [];
  const fundamentos = dadosPlano.fundamentos ?? [];
  const comentarios = fundamentos.length === 0 ? (dadosPlano.comentarios ?? []) : [];
  const nome = dadosRespostas?.perfil?.nome?.trim().split(' ')[0];
  const balanco = descreverBalanco(resumo.caloriasAlvo, resumo.tdee);
  const agua = formatarAgua(resumo.metaAguaMl || 0);

  const nos = [
    {
      rotulo: 'Proteína',
      valor: String(macros.proteinas),
      unidade: 'g',
      cor: CoresMacros.proteina,
    },
    {
      rotulo: 'Carboidrato',
      valor: String(macros.carboidratos),
      unidade: 'g',
      cor: CoresMacros.carboidrato,
    },
    { rotulo: 'Gordura', valor: String(macros.gorduras), unidade: 'g', cor: CoresMacros.gordura },
    {
      rotulo: 'Água',
      valor: agua.replace(/(ml|L)$/, ''),
      unidade: agua.endsWith('ml') ? 'ml' : 'L',
      cor: CoresMacros.agua,
    },
  ];

  const proteinaPorRefeicao =
    refeicoes.length > 0 ? Math.round(macros.proteinas / refeicoes.length) : 0;
  const passos: { simbolo: SFSymbol; cor: string; rotulo: string; texto: string }[] = [
    {
      simbolo: 'fork.knife',
      cor: CoresMacros.proteina,
      rotulo: 'Refeições',
      texto: `${refeicoes.length} refeições · ~${proteinaPorRefeicao} g de proteína cada`,
    },
    ...diasTreino.map((dia) => ({
      simbolo: 'dumbbell.fill' as SFSymbol,
      cor: cores.texto,
      rotulo: dia.nome,
      texto: `${dia.exercicios.length} exercícios`,
    })),
    {
      simbolo: 'drop.fill',
      cor: CoresMacros.agua,
      rotulo: 'Hidratação',
      texto: `${agua} ao longo do dia`,
    },
  ];

  const objetivo = dadosRespostas?.objetivo?.objetivo_principal;
  const contexto = [
    objetivo ? `Plano de ${objetivo.toLowerCase()}` : 'Seu plano',
    dadosRespostas?.perfil?.peso_atual ? `${dadosRespostas.perfil.peso_atual} kg` : null,
    dadosRespostas?.treino?.dias_disponiveis_semana
      ? `${dadosRespostas.treino.dias_disponiveis_semana} treinos/semana`
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const conteudoBarra = (
    <>
      {erroSalvar ? (
        <Text accessibilityRole="alert" style={estilos.textoErro}>
          {erroSalvar}
        </Text>
      ) : null}
      <BotaoPrimario
        texto={salvando ? 'Ativando seu plano...' : 'Começar meu plano'}
        aoPresionar={aceitarEIniciar}
        carregando={salvando}
      />
      <Pressable
        accessibilityRole="button"
        onPress={ajustarRespostas}
        disabled={salvando}
        style={estilos.botaoSecundario}
      >
        <Text style={estilos.legenda}>Ajustar respostas</Text>
      </Pressable>
    </>
  );
  const estiloBarra = [estilos.barra, { paddingBottom: Math.max(margens.bottom, Espacamento.lg) }];

  return (
    // Área segura no container: o texto não rola por baixo do relógio (sem header nesta tela).
    <View style={[estilos.container, { paddingTop: margens.top }]}>
      <ScrollView
        contentContainerStyle={[estilos.rolagem, { paddingTop: Espacamento.lg }]}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >
        <Text style={estilos.contexto}>{contexto}</Text>
        <Text style={estilos.titulo} accessibilityRole="header">
          {nome ? `${nome}, seu plano está pronto` : 'Seu plano está pronto'}
        </Text>

        {/* Orbe: meta de kcal com o anel dividido pelas kcal de cada macro */}
        <View
          style={estilos.orbe}
          accessible
          accessibilityLabel={`Meta diária: ${resumo.caloriasAlvo} quilocalorias${balanco ? `, ${balanco}` : ''}`}
        >
          <Svg width={ORBE} height={ORBE} style={StyleSheet.absoluteFill}>
            <Circle
              cx={ORBE / 2}
              cy={ORBE / 2}
              r={RAIO_ANEL}
              stroke={cores.separador}
              strokeWidth={ESPESSURA_ANEL}
              fill="none"
            />
            {segmentosAnel(macros, CIRCUNFERENCIA, ESPACO_ANEL).map((s) => (
              <Circle
                key={s.macro}
                cx={ORBE / 2}
                cy={ORBE / 2}
                r={RAIO_ANEL}
                stroke={COR_MACRO[s.macro]}
                strokeWidth={ESPESSURA_ANEL}
                strokeLinecap="round"
                strokeDasharray={`${s.comprimento} ${CIRCUNFERENCIA}`}
                strokeDashoffset={-s.inicio}
                fill="none"
                transform={`rotate(-90 ${ORBE / 2} ${ORBE / 2})`}
              />
            ))}
          </Svg>
          <Text style={estilos.legenda}>Meta diária</Text>
          <Text style={estilos.kcal}>{resumo.caloriasAlvo.toLocaleString('pt-BR')}</Text>
          <Text style={estilos.legenda}>{balanco ? `kcal · ${balanco}` : 'kcal'}</Text>
        </View>

        <View style={estilos.linhaNos}>
          {nos.map((no) => (
            <View
              key={no.rotulo}
              style={estilos.no}
              accessible
              accessibilityLabel={`${no.rotulo}: ${no.valor} ${no.unidade}`}
            >
              <View style={[estilos.noCirculo, { borderColor: no.cor }]}>
                <Text style={estilos.noValor}>
                  {no.valor}
                  <Text style={estilos.noUnidade}>{no.unidade}</Text>
                </Text>
              </View>
              <Text style={estilos.legenda}>{no.rotulo}</Text>
            </View>
          ))}
        </View>

        {/* Linha do tempo do plano */}
        <View style={estilos.card}>
          {passos.map((passo, i) => (
            <View key={`${passo.rotulo}-${i}`} style={estilos.passo}>
              {i < passos.length - 1 ? <View style={estilos.conector} /> : null}
              <View style={estilos.passoIcone}>
                <SymbolView name={passo.simbolo} size={16} tintColor={passo.cor} />
              </View>
              <View style={estilos.passoTextos}>
                <Text style={estilos.pilula}>{passo.rotulo}</Text>
                <Text style={estilos.passoTexto}>{passo.texto}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Justificativas da base de conhecimento */}
        {fundamentos.length > 0 || comentarios.length > 0 ? (
          <View style={estilos.card}>
            <Text style={estilos.tituloCard} accessibilityRole="header">
              Por que estes números
            </Text>
            {fundamentos.map((f, i) => (
              <View key={f.titulo} style={[estilos.porque, i > 0 && estilos.porqueSeparado]}>
                <Text style={estilos.passoTexto}>{f.titulo}</Text>
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={`Fonte: ${f.fonte}`}
                  accessibilityHint="Abre o trecho que embasa este número"
                  hitSlop={8}
                  style={estilos.fonte}
                  onPress={() => router.push({ pathname: '/questionario/fonte', params: { ...f } })}
                >
                  <Text style={estilos.fonteTexto}>{f.fonte} ›</Text>
                </Pressable>
              </View>
            ))}
            {comentarios.map((c, i) => (
              <View key={c} style={[estilos.porque, i > 0 && estilos.porqueSeparado]}>
                <Text style={estilos.passoTexto}>{c}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {(dadosPlano.avisos ?? []).map((aviso) => (
          <View key={aviso} style={estilos.aviso} accessible>
            <SymbolView
              name="exclamationmark.triangle"
              size={18}
              tintColor={cores.textoSecundario}
            />
            <Text style={[estilos.legenda, estilos.avisoTexto]}>{aviso}</Text>
          </View>
        ))}

        <View style={estilos.aviso} accessible>
          <SymbolView name="info.circle" size={18} tintColor={cores.textoSecundario} />
          <Text style={[estilos.legenda, estilos.avisoTexto]}>{AVISO_PROFISSIONAL}</Text>
        </View>
      </ScrollView>

      {/* Ação fixa: o único vidro da tela */}
      {reduzirTransparencia ? (
        <View style={[estiloBarra, { backgroundColor: cores.superficie }]}>{conteudoBarra}</View>
      ) : (
        <BlurView intensity={80} tint={escuro ? 'dark' : 'light'} style={estiloBarra}>
          {conteudoBarra}
        </BlurView>
      )}

      {conquista ? (
        <MomentoConquista
          titulo="Plano ativado"
          subtitulo="Seu primeiro dia começa agora."
          aoTerminar={() => router.replace('/(tabs)/inicio')}
        />
      ) : null}
    </View>
  );
}

const criarEstilos = (cores: CoresTema) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: cores.fundo },
    centralizado: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: Espacamento.xl,
      gap: Espacamento.md,
    },
    rolagem: { paddingHorizontal: Espacamento.lg, paddingBottom: 180 },
    contexto: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Tipografia.rodape,
      color: cores.textoSecundario,
    },
    titulo: {
      fontFamily: FamiliaFonte.bold,
      fontWeight: PesoFonte.bold,
      fontSize: Tipografia.titulo1,
      color: cores.texto,
      marginTop: Espacamento.xs,
    },
    titulo3: {
      fontFamily: FamiliaFonte.bold,
      fontWeight: PesoFonte.bold,
      fontSize: Tipografia.titulo3,
      color: cores.texto,
      textAlign: 'center',
    },
    legenda: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Tipografia.legenda,
      color: cores.textoSecundario,
    },

    orbe: {
      width: ORBE,
      height: ORBE,
      borderRadius: ORBE / 2,
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: cores.elevada,
      marginTop: Espacamento.lg,
    },
    kcal: {
      fontFamily: FamiliaFonte.bold,
      fontWeight: PesoFonte.bold,
      fontSize: 46,
      color: cores.texto,
      fontVariant: ['tabular-nums'],
      letterSpacing: -1,
    },

    linhaNos: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignSelf: 'stretch',
      marginTop: Espacamento.lg,
    },
    no: { width: 80, alignItems: 'center', gap: 6 },
    noCirculo: {
      width: 64,
      height: 64,
      borderRadius: 32,
      borderWidth: 2.5,
      backgroundColor: cores.superficie,
      alignItems: 'center',
      justifyContent: 'center',
    },
    noValor: {
      fontFamily: FamiliaFonte.bold,
      fontWeight: PesoFonte.bold,
      fontSize: Tipografia.destaque,
      color: cores.texto,
      fontVariant: ['tabular-nums'],
    },
    noUnidade: {
      fontFamily: FamiliaFonte.semibold,
      fontSize: Tipografia.legenda,
      color: cores.textoSecundario,
    },

    card: {
      backgroundColor: cores.superficie,
      borderRadius: RAIO_CARTAO,
      padding: Espacamento.lg,
      marginTop: Espacamento.md,
    },
    tituloCard: {
      fontFamily: FamiliaFonte.semibold,
      fontWeight: PesoFonte.semibold,
      fontSize: Tipografia.destaque,
      color: cores.texto,
      marginBottom: Espacamento.xs,
    },

    passo: { flexDirection: 'row', gap: Espacamento.md, paddingVertical: 10 },
    conector: {
      position: 'absolute',
      left: 15,
      top: 42,
      bottom: -10,
      width: 2,
      backgroundColor: cores.separador,
    },
    passoIcone: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: cores.destaqueSuave,
      alignItems: 'center',
      justifyContent: 'center',
    },
    passoTextos: { flex: 1, alignItems: 'flex-start' },
    pilula: {
      fontFamily: FamiliaFonte.semibold,
      fontWeight: PesoFonte.semibold,
      fontSize: Tipografia.rodape,
      color: cores.texto,
      backgroundColor: cores.destaqueSuave,
      borderRadius: 12,
      overflow: 'hidden',
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    passoTexto: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Tipografia.subtitulo,
      color: cores.texto,
      marginTop: Espacamento.xs,
    },

    porque: { paddingVertical: Espacamento.sm },
    porqueSeparado: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: cores.separador },
    fonte: { minHeight: 28, justifyContent: 'center', alignSelf: 'flex-start' },
    fonteTexto: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Tipografia.rodape,
      color: cores.textoSecundario,
      textDecorationLine: 'underline',
    },

    aviso: {
      flexDirection: 'row',
      gap: 10,
      paddingVertical: Espacamento.lg,
      paddingHorizontal: Espacamento.xs,
    },
    avisoTexto: { flex: 1, lineHeight: 18 },

    barra: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: Espacamento.lg,
      paddingTop: Espacamento.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: cores.separador,
      overflow: 'hidden',
    },
    botaoSecundario: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
    textoErro: {
      color: cores.erro,
      fontSize: Tipografia.rodape,
      textAlign: 'center',
      marginBottom: Espacamento.sm,
    },
  });
