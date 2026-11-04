// ============================================================
// TELA: Consentimento de dados de saúde (app/consentimento.tsx)
// ============================================================
// Mockup aprovado: docs/mockups/consentimento-login-2026-10-26.html.
// Explica em 3 linhas o uso dos dados, mostra o aviso profissional e só
// libera o "Continuar" com o aceite explícito no Switch (LGPD, PROJETO.md
// seção 4). O aceite é gravado com data em perfis antes do questionário.
// ============================================================

import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BotaoPrimario } from '@/compartilhado/ui';
import {
  CoresTema,
  Espacamento,
  FamiliaFonte,
  PesoFonte,
  RAIO_CARTAO,
  Raio,
  Tipografia,
} from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import { registrarConsentimentoSaude } from '@/compartilhado/servicos/consentimento-servico';

export const AVISO_CONSENTIMENTO =
  'O plano não substitui um profissional de educação física ou nutrição.';
export const TEXTO_ACEITE = 'Li e concordo com o uso dos meus dados de saúde';

const ITENS: { icone: SFSymbol; titulo: string; texto: string }[] = [
  {
    icone: 'figure.stand',
    titulo: 'Corpo',
    texto: 'Peso, altura, idade e sexo, para calcular seu gasto.',
  },
  {
    icone: 'calendar',
    titulo: 'Rotina e objetivo',
    texto: 'Frequência de treino, restrições e lesões.',
  },
  {
    icone: 'lock.fill',
    titulo: 'Você controla',
    texto: 'Apague a conta e tudo some, a qualquer momento, em Perfil.',
  },
];

export default function TelaConsentimento() {
  const { cores } = useTema();
  const estilos = useMemo(() => criarEstilos(cores), [cores]);
  const router = useRouter();
  const margens = useSafeAreaInsets();
  const [aceito, setAceito] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const continuar = async () => {
    setSalvando(true);
    setErro(null);
    try {
      await registrarConsentimentoSaude();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/questionario');
    } catch {
      setErro('Não foi possível salvar seu aceite. Verifique a conexão e tente de novo.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <View style={estilos.container}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[estilos.conteudo, { paddingTop: margens.top + Espacamento.xl }]}
      >
        <Text style={estilos.titulo} accessibilityRole="header">
          Seus dados de saúde
        </Text>
        <Text style={estilos.subtitulo}>
          Para montar o plano, o TreinaAI usa estas informações. Elas ficam na sua conta e não são
          vendidas.
        </Text>

        <View style={estilos.card}>
          {ITENS.map((item, i) => (
            <View
              key={item.titulo}
              style={[estilos.item, i < ITENS.length - 1 && estilos.itemBorda]}
              accessible
              accessibilityLabel={`${item.titulo}. ${item.texto}`}
            >
              <View style={estilos.icone}>
                <SymbolView name={item.icone} size={18} tintColor={cores.texto} />
              </View>
              <View style={estilos.itemTextos}>
                <Text style={estilos.itemTitulo}>{item.titulo}</Text>
                <Text style={estilos.itemTexto}>{item.texto}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={estilos.aviso} accessible>
          <SymbolView name="exclamationmark.triangle.fill" size={18} tintColor={cores.texto} />
          <Text style={estilos.avisoTexto}>{AVISO_CONSENTIMENTO}</Text>
        </View>
      </ScrollView>

      <View style={[estilos.barra, { paddingBottom: margens.bottom + Espacamento.md }]}>
        <View style={estilos.linhaAceite}>
          <Text style={estilos.textoAceite}>{TEXTO_ACEITE}</Text>
          <Switch
            value={aceito}
            onValueChange={setAceito}
            accessibilityLabel={TEXTO_ACEITE}
            trackColor={{ true: cores.sucesso }}
          />
        </View>
        {erro ? (
          <Text style={estilos.erro} accessibilityRole="alert">
            {erro}
          </Text>
        ) : null}
        <BotaoPrimario
          texto="Continuar"
          aoPresionar={continuar}
          desabilitado={!aceito}
          carregando={salvando}
        />
      </View>
    </View>
  );
}

const criarEstilos = (cores: CoresTema) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: cores.fundo },
    conteudo: { paddingHorizontal: Espacamento.lg, paddingBottom: 220 },
    titulo: {
      fontSize: Tipografia.tituloGrande,
      fontFamily: FamiliaFonte.bold,
      fontWeight: PesoFonte.bold,
      color: cores.texto,
      marginBottom: Espacamento.xs,
    },
    subtitulo: {
      fontSize: Tipografia.subtitulo,
      fontFamily: FamiliaFonte.regular,
      color: cores.textoSecundario,
      lineHeight: 20,
    },
    card: {
      backgroundColor: cores.superficie,
      borderRadius: RAIO_CARTAO,
      paddingHorizontal: Espacamento.lg,
      marginTop: Espacamento.xl,
    },
    item: { flexDirection: 'row', gap: Espacamento.md, paddingVertical: Espacamento.md },
    itemBorda: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: cores.separador },
    icone: {
      width: 36,
      height: 36,
      borderRadius: Raio.md - 2,
      backgroundColor: cores.elevada,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemTextos: { flex: 1 },
    itemTitulo: {
      fontSize: Tipografia.destaque,
      fontFamily: FamiliaFonte.semibold,
      fontWeight: PesoFonte.semibold,
      color: cores.texto,
    },
    itemTexto: {
      fontSize: Tipografia.subtitulo,
      fontFamily: FamiliaFonte.regular,
      color: cores.textoSecundario,
      marginTop: 2,
    },
    aviso: {
      flexDirection: 'row',
      gap: Espacamento.md,
      alignItems: 'center',
      backgroundColor: cores.superficie,
      borderRadius: RAIO_CARTAO,
      padding: Espacamento.lg,
      marginTop: Espacamento.md,
    },
    avisoTexto: {
      flex: 1,
      fontSize: Tipografia.subtitulo,
      fontFamily: FamiliaFonte.semibold,
      fontWeight: PesoFonte.semibold,
      color: cores.texto,
    },
    barra: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: Espacamento.lg,
      paddingTop: Espacamento.md,
      gap: Espacamento.md,
      backgroundColor: cores.superficie,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: cores.separador,
    },
    linhaAceite: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.md, minHeight: 44 },
    textoAceite: {
      flex: 1,
      fontSize: Tipografia.subtitulo,
      fontFamily: FamiliaFonte.regular,
      color: cores.texto,
    },
    erro: { fontSize: Tipografia.rodape, fontFamily: FamiliaFonte.regular, color: cores.erro },
  });
