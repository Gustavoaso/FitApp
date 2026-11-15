// ============================================================
// TELA: Questionário (app/questionario/index.tsx)
// ============================================================
// 10 perguntas, uma por tela (lista PASSOS), mais o resumo. Escolha única
// avança ao tocar; as demais têm "Continuar". O passo e as respostas ficam
// num rascunho no aparelho. Regras em campos-pendentes.ts e respostas.ts.
// ============================================================

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { BotaoPrimario, CartaoOpcao, ChipOpcao, Regua, Roda, Stepper } from '@/compartilhado/ui';
import { Espacamento, FamiliaFonte, Raio, Tipografia } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import { supabase } from '@/compartilhado/supabase';
import { possuiConsentimentoSaude } from '@/compartilhado/servicos/consentimento-servico';
import {
  TOTAL_PASSOS,
  aplicarPadroes,
  camposPendentes,
  type RespostasEmEdicao,
} from './campos-pendentes';
import {
  ATIVIDADES,
  DIAS,
  EXPERIENCIAS,
  LESOES,
  LOCAIS,
  OBJETIVOS,
  RESPOSTAS_VAZIAS,
  RESTRICOES_ALIMENTARES,
  SEXOS,
  alternarOpcao,
  blocosDoResumo,
  erroDoPasso,
  montarPayload,
  nivelDaExperiencia,
  respostasDoPayload,
  type Opcao,
} from './respostas';
import { apagarRascunho, lerRascunho, salvarRascunho } from './rascunho';

const RESUMO = TOTAL_PASSOS + 1;

interface Texto {
  titulo: string;
  apoio?: string;
}
const TEXTOS: Texto[] = [
  {
    titulo: 'Qual é o seu objetivo?',
    apoio: 'Escolha o que mais importa agora. Dá para mudar depois.',
  },
  {
    titulo: 'Sexo biológico e idade',
    apoio: 'Usamos para calcular calorias e carga. Não aparece para ninguém.',
  },
  { titulo: 'Altura e peso', apoio: 'Deslize a régua. Aproximado já ajuda.' },
  { titulo: 'Há quanto tempo você treina sem parar por mais de 1 mês?' },
  {
    titulo: 'Quantos dias por semana você treina?',
    apoio: 'Conte só os dias que dá para cumprir.',
  },
  { titulo: 'Onde você treina?' },
  {
    titulo: 'Sente dor ou tem lesão?',
    apoio: 'Pode marcar mais de uma. Vamos evitar exercícios que agravem.',
  },
  { titulo: 'Alguma restrição alimentar?', apoio: 'Pode marcar mais de uma.' },
  { titulo: 'Como é sua rotina fora do treino?' },
  { titulo: 'Quantas refeições por dia?', apoio: 'Conte café, almoço, jantar e lanches.' },
];

export default function TelaQuestionario() {
  const { cores } = useTema();
  const router = useRouter();
  const { dadosFormulario, origem } = useLocalSearchParams<{
    dadosFormulario?: string;
    origem?: string;
  }>();

  // Respostas vindas de "Ajustar respostas" / Perfil: começam preenchidas (refazer).
  const [pre] = useState(() => {
    if (!dadosFormulario) return null;
    try {
      return respostasDoPayload(JSON.parse(dadosFormulario));
    } catch {
      return null;
    }
  });
  const refazendo = pre !== null;

  const [passo, setPasso] = useState(1);
  const [respostas, setRespostas] = useState<RespostasEmEdicao>(pre ?? RESPOSTAS_VAZIAS);
  // Passos do bloco que o "Editar" do resumo está percorrendo (null = fluxo normal).
  const [editando, setEditando] = useState<number[] | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [nomeUsuario, setNomeUsuario] = useState('Atleta');
  const [consentimentoConfirmado, setConsentimentoConfirmado] = useState(false);
  const [rascunhoLido, setRascunhoLido] = useState(refazendo);

  // Sem o aceite dos dados de saúde o questionário não começa (PROJETO.md, seção 4).
  useEffect(() => {
    possuiConsentimentoSaude().then((aceitou) => {
      if (aceitou) setConsentimentoConfirmado(true);
      else router.replace('/consentimento');
    });
  }, [router]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.user_metadata?.nome) setNomeUsuario(data.user.user_metadata.nome);
    });
  }, []);

  // Retoma o rascunho (refazer tem prioridade: as respostas vêm do plano atual).
  useEffect(() => {
    if (refazendo) return;
    lerRascunho().then((r) => {
      if (r) {
        setRespostas(r.respostas);
        setPasso(r.passo);
        setSalvo(true);
      }
      setRascunhoLido(true);
    });
  }, [refazendo]);

  const ir = (proximo: number, novas: RespostasEmEdicao) => {
    setPasso(proximo);
    salvarRascunho({ passo: proximo, respostas: novas }).then(() => setSalvo(true));
  };

  /** Valida e vai para o próximo passo (ou volta ao resumo, ao editar um bloco). */
  const concluirPasso = (base: RespostasEmEdicao) => {
    const completas = aplicarPadroes(passo, base);
    if (erroDoPasso(passo, completas) || camposPendentes(passo, completas).length > 0) return;
    setRespostas(completas);
    if (editando) {
      const i = editando.indexOf(passo);
      if (i < editando.length - 1) return ir(editando[i + 1], completas);
      setEditando(null);
      return ir(RESUMO, completas);
    }
    ir(passo + 1, completas);
  };

  const escolher = (campo: keyof RespostasEmEdicao, valor: string) =>
    concluirPasso({ ...respostas, [campo]: valor });

  const mudar = (campo: keyof RespostasEmEdicao, valor: string) =>
    setRespostas((r) => ({ ...r, [campo]: valor }));

  const voltar = () => {
    if (editando) {
      const i = editando.indexOf(passo);
      if (i > 0) return ir(editando[i - 1], respostas);
      setEditando(null);
      return ir(RESUMO, respostas);
    }
    ir(passo - 1, respostas);
  };

  const sair = () => {
    if (origem === 'perfil') router.dismissTo('/(tabs)/perfil');
    else if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  // A geração acontece no Resultado (funcionalidade plano): aqui só vão as respostas.
  const gerarPlano = async () => {
    await apagarRascunho();
    router.replace({
      pathname: '/questionario/resultado',
      params: { respostas: JSON.stringify(montarPayload(respostas, nomeUsuario)) },
    });
  };

  if (!consentimentoConfirmado || !rascunhoLido) {
    return <View style={[estilos.container, { backgroundColor: cores.fundo }]} />;
  }

  const emResumo = passo === RESUMO;
  const completas = aplicarPadroes(passo, respostas);
  const erro = emResumo ? null : erroDoPasso(passo, completas);
  const pendentes = emResumo ? [] : camposPendentes(passo, completas);
  const num = (campo: keyof RespostasEmEdicao) => Number(completas[campo]);

  const listaOpcoes = (opcoes: Opcao[], campo: 'restricaoFisica' | 'restricaoAlimentar') => (
    <View style={estilos.chips}>
      {opcoes.map((o) => (
        <ChipOpcao
          key={o.valor}
          multipla
          rotulo={o.rotulo}
          selecionado={respostas[campo].includes(o.valor)}
          aoPressionar={() =>
            setRespostas((r) => ({ ...r, [campo]: alternarOpcao(r[campo], o.valor) }))
          }
        />
      ))}
    </View>
  );

  const cartoes = (opcoes: Opcao[], campo: keyof RespostasEmEdicao) => (
    <View style={estilos.coluna}>
      {opcoes.map((o, i) => (
        <CartaoOpcao
          key={o.valor}
          titulo={o.rotulo}
          descricao={o.descricao}
          icone={o.icone}
          numero={campo === 'experiencia' ? i + 1 : undefined}
          selecionado={respostas[campo] === o.valor}
          aoPressionar={() => escolher(campo, o.valor)}
        />
      ))}
    </View>
  );

  const corpo = () => {
    switch (passo) {
      case 1:
        return cartoes(OBJETIVOS, 'objetivo');
      case 2:
        return (
          <View style={estilos.coluna}>
            <View style={estilos.linha}>
              {SEXOS.map((o) => (
                <View key={o.valor} style={estilos.metade}>
                  <ChipOpcao
                    alto
                    rotulo={o.rotulo}
                    selecionado={respostas.sexo === o.valor}
                    aoPressionar={() => mudar('sexo', o.valor)}
                  />
                </View>
              ))}
            </View>
            <Text style={[estilos.rotuloCampo, { color: cores.textoSecundario }]}>
              IDADE (ANOS)
            </Text>
            <Roda
              rotulo="Idade em anos"
              valor={num('idade')}
              min={14}
              max={100}
              aoMudar={(v) => mudar('idade', String(v))}
            />
          </View>
        );
      case 3:
        // Réguas um pouco mais largas que os limites: o aviso de erro fica alcançável.
        return (
          <View style={estilos.coluna}>
            <Regua
              rotulo="Altura"
              unidade="cm"
              valor={num('altura')}
              min={80}
              max={270}
              aoMudar={(v) => mudar('altura', String(v))}
            />
            <Regua
              rotulo="Peso"
              unidade="kg"
              valor={num('peso')}
              min={10}
              max={320}
              aoMudar={(v) => mudar('peso', String(v))}
            />
          </View>
        );
      case 4:
        return cartoes(EXPERIENCIAS, 'experiencia');
      case 5:
        return (
          <View style={estilos.chips}>
            {DIAS.map((d) => (
              <ChipOpcao
                key={d}
                alto
                rotulo={String(d)}
                legenda={respostas.dias === String(d) ? 'selecionado' : 'dias'}
                selecionado={respostas.dias === String(d)}
                aoPressionar={() => mudar('dias', String(d))}
              />
            ))}
          </View>
        );
      case 6:
        return cartoes(LOCAIS, 'local');
      case 7:
        return listaOpcoes(LESOES, 'restricaoFisica');
      case 8:
        return listaOpcoes(RESTRICOES_ALIMENTARES, 'restricaoAlimentar');
      case 9:
        return cartoes(ATIVIDADES, 'atividade');
      case 10:
        return (
          <Stepper
            rotulo="Refeições por dia"
            valor={num('refeicoes')}
            min={3}
            max={6}
            aoMudar={(v) => mudar('refeicoes', String(v))}
          />
        );
    }
  };

  // Passos de escolha única avançam ao tocar; ao refazer, a resposta anterior já vale.
  const escolhaUnica = [1, 4, 6, 9].includes(passo);
  const botao = escolhaUnica
    ? refazendo && !pendentes.length
      ? 'Manter e continuar'
      : null
    : passo === TOTAL_PASSOS
      ? 'Revisar respostas'
      : 'Continuar';

  return (
    <View style={[estilos.container, { backgroundColor: cores.fundo }]}>
      <View style={estilos.topo}>
        {passo > 1 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={voltar}
            hitSlop={8}
            style={estilos.btnTopo}
          >
            <SymbolView name="chevron.left" size={18} weight="regular" tintColor={cores.texto} />
          </Pressable>
        ) : (
          <View style={estilos.btnTopo} />
        )}
        {!emResumo && (
          <Text style={[estilos.contador, { color: cores.textoSecundario }]}>
            {passo} de {TOTAL_PASSOS}
          </Text>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sair"
          onPress={sair}
          style={[
            estilos.btnSair,
            { backgroundColor: cores.elevada, borderColor: cores.separador },
          ]}
        >
          <SymbolView name="xmark" size={14} tintColor={cores.texto} weight="regular" />
          <Text style={[estilos.txtSair, { color: cores.texto }]}>Sair</Text>
        </Pressable>
      </View>

      <View style={[estilos.trilho, { backgroundColor: cores.destaqueSuave }]}>
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={`Etapa ${Math.min(passo, TOTAL_PASSOS)} de ${TOTAL_PASSOS}`}
          style={[
            estilos.preenchido,
            {
              width: `${(Math.min(passo, TOTAL_PASSOS) / TOTAL_PASSOS) * 100}%`,
              backgroundColor: cores.destaque,
            },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
        {refazendo && (
          <Text
            style={[
              estilos.aviso,
              { backgroundColor: cores.elevada, color: cores.textoSecundario },
            ]}
          >
            Preenchido com as suas respostas anteriores. Revise e ajuste só o que mudou.
          </Text>
        )}

        {emResumo ? (
          <Resumo
            respostas={respostas}
            aoEditar={(passos) => {
              setEditando(passos);
              ir(passos[0], respostas);
            }}
          />
        ) : (
          <>
            <Text accessibilityRole="header" style={[estilos.titulo, { color: cores.texto }]}>
              {TEXTOS[passo - 1].titulo}
            </Text>
            {TEXTOS[passo - 1].apoio ? (
              <Text style={[estilos.apoio, { color: cores.textoSecundario }]}>
                {TEXTOS[passo - 1].apoio}
              </Text>
            ) : null}
            <View style={estilos.corpo}>{corpo()}</View>
            {erro ? (
              <View accessibilityRole="alert" style={[estilos.erro, { borderColor: cores.erro }]}>
                <SymbolView name="exclamationmark.triangle.fill" size={18} tintColor={cores.erro} />
                <Text style={[estilos.erroTexto, { color: cores.erro }]}>{erro}</Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      <View style={estilos.rodape}>
        {emResumo ? (
          <>
            <Text style={[estilos.nivel, { color: cores.textoSecundario }]}>
              Nível calculado: {nivelDaExperiencia(respostas.experiencia).toLowerCase()}
            </Text>
            <BotaoPrimario texto="Gerar meu plano" aoPresionar={gerarPlano} />
          </>
        ) : (
          <>
            {botao ? (
              <BotaoPrimario
                texto={botao}
                aoPresionar={() => concluirPasso(respostas)}
                desabilitado={!!erro || pendentes.length > 0}
              />
            ) : (
              <Text style={[estilos.nivel, { color: cores.textoSecundario }]}>
                Toque numa opção para avançar
              </Text>
            )}
            {botao && pendentes.length > 0 && !erro ? (
              <Text style={[estilos.nivel, { color: cores.textoSecundario }]}>
                Falta escolher: {pendentes.join(', ')}.
              </Text>
            ) : null}
          </>
        )}
        {salvo ? (
          <View style={estilos.salvo}>
            <SymbolView name="checkmark.circle" size={14} tintColor={cores.textoSecundario} />
            <Text style={[estilos.salvoTexto, { color: cores.textoSecundario }]}>
              Rascunho salvo
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function Resumo({
  respostas,
  aoEditar,
}: {
  respostas: RespostasEmEdicao;
  aoEditar: (passos: number[]) => void;
}) {
  const { cores } = useTema();
  return (
    <View style={estilos.coluna}>
      <Text accessibilityRole="header" style={[estilos.titulo, { color: cores.texto }]}>
        Confira suas respostas
      </Text>
      <Text style={[estilos.apoio, { color: cores.textoSecundario }]}>
        Toque em Editar para ajustar qualquer bloco.
      </Text>
      {blocosDoResumo(respostas).map((b) => (
        <View key={b.titulo} style={[estilos.bloco, { backgroundColor: cores.superficie }]}>
          <View style={estilos.blocoTextos}>
            <Text style={[estilos.blocoTitulo, { color: cores.textoSecundario }]}>{b.titulo}</Text>
            <Text style={[estilos.blocoTexto, { color: cores.texto }]}>{b.texto}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Editar ${b.titulo}`}
            onPress={() => aoEditar(b.passos)}
            style={estilos.editar}
          >
            <Text style={[estilos.editarTexto, { color: cores.destaqueTexto }]}>Editar</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1 },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Espacamento.lg,
    paddingTop: 60,
    paddingBottom: Espacamento.sm,
  },
  btnTopo: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  contador: { fontFamily: FamiliaFonte.semibold, fontSize: Tipografia.rodape },
  btnSair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: Raio.full,
    borderWidth: 1,
  },
  txtSair: { fontFamily: FamiliaFonte.bold, fontSize: Tipografia.rodape },
  trilho: { height: 4, width: '100%' },
  preenchido: { height: '100%' },
  conteudo: { padding: Espacamento.xl, paddingBottom: Espacamento.xxxl, gap: Espacamento.md },
  aviso: {
    fontFamily: FamiliaFonte.regular,
    fontSize: Tipografia.subtitulo,
    padding: Espacamento.md,
    borderRadius: Raio.md,
    overflow: 'hidden',
  },
  titulo: { fontFamily: FamiliaFonte.bold, fontSize: Tipografia.titulo1 },
  apoio: { fontFamily: FamiliaFonte.regular, fontSize: Tipografia.chamada },
  corpo: { marginTop: Espacamento.md },
  coluna: { gap: Espacamento.md },
  linha: { flexDirection: 'row', gap: Espacamento.md },
  metade: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacamento.md },
  rotuloCampo: { fontFamily: FamiliaFonte.semibold, fontSize: Tipografia.rodape, letterSpacing: 1 },
  erro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.sm,
    padding: Espacamento.md,
    borderRadius: Raio.md,
    borderWidth: 1,
  },
  erroTexto: { flex: 1, fontFamily: FamiliaFonte.medio, fontSize: Tipografia.subtitulo },
  rodape: { padding: Espacamento.xl, paddingBottom: Espacamento.xxxl, gap: Espacamento.sm },
  nivel: { textAlign: 'center', fontFamily: FamiliaFonte.regular, fontSize: Tipografia.rodape },
  salvo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  salvoTexto: { fontFamily: FamiliaFonte.regular, fontSize: Tipografia.rodape },
  bloco: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.md,
    padding: Espacamento.lg,
    borderRadius: Raio.xl,
  },
  blocoTextos: { flex: 1, gap: 2 },
  blocoTitulo: { fontFamily: FamiliaFonte.medio, fontSize: Tipografia.rodape },
  blocoTexto: { fontFamily: FamiliaFonte.semibold, fontSize: Tipografia.chamada },
  editar: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  editarTexto: { fontFamily: FamiliaFonte.semibold, fontSize: Tipografia.chamada },
});
