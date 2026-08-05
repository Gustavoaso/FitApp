// ============================================================
// TELA INICIAL / ROTEAMENTO RAIZ (app/index.tsx)
// ============================================================
// Etapa 1 — Decisão de Roteamento & Landing Page de Autenticação:
// 1. Se o usuário NÃO está autenticado: exibe a tela inicial com
//    duas opções claras ("Entrar" e "Criar Conta").
// 2. Se o usuário ESTÁ autenticado: verifica se possui planejamento ativo.
//    - Se SIM: redireciona para o Dashboard ((tabs)/inicio)
//    - Se NÃO: redireciona para o Questionário (/questionario)
// 3. Sem sessão, o fluxo começa sempre pelo Login/Cadastro.
// ============================================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useAuth } from '../contextos/AuthContexto';
import { repositorioPlano } from '../servicos/repositorio';
import { CardVidro, BotaoPrimario } from '../componentes/ui';
import { Cores, Espacamento, Fonte, PesoFonte, Raio } from '../constantes/Cores';

export default function TelaInicialRaiz() {
  const { usuario, carregando: carregandoAuth } = useAuth();
  const router = useRouter();

  const [verificandoPlano, setVerificandoPlano] = useState(true);
  const [possuiPlanoAtivo, setPossuiPlanoAtivo] = useState(false);

  useEffect(() => {
    async function checarStatusUsuario() {
      if (usuario) {
        setVerificandoPlano(true);
        const temPlano = await repositorioPlano.verificarUsuarioPossuiPlanoAtivo();
        setPossuiPlanoAtivo(temPlano);
        setVerificandoPlano(false);
      } else {
        setVerificandoPlano(false);
      }
    }

    if (!carregandoAuth) {
      checarStatusUsuario();
    }
  }, [usuario, carregandoAuth]);

  // 1. Enquanto carrega a sessão ou verifica o plano no banco
  if (carregandoAuth || (usuario && verificandoPlano)) {
    return (
      <View style={[estilos.container, estilos.centralizado]}>
        <ActivityIndicator size="large" color={Cores.accent} />
        <Text style={estilos.textoStatus}>Carregando suas informações...</Text>
      </View>
    );
  }

  // 2. Se usuário está logado
  if (usuario) {
    if (possuiPlanoAtivo) {
      return <Redirect href="/(tabs)/inicio" />;
    }

    // Conta autenticada sem plano: redireciona diretamente para o onboarding (questionário).
    return <Redirect href="/questionario" />;
  }

  // 3. Sem sessão: Login oferece o cadastro e inicia o onboarding após autenticar.
  return <Redirect href="/(auth)/login" />;
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Cores.fundo.principal,
  },
  centralizado: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Espacamento.xl,
  },
  textoStatus: {
    fontSize: Fonte.corpo,
    color: Cores.texto.secundario,
    marginTop: Espacamento.md,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Espacamento.xxl,
  },
  heroContainer: {
    alignItems: 'center',
    marginBottom: Espacamento.xxxl,
  },
  emojiHero: {
    fontSize: 56,
    marginBottom: Espacamento.sm,
  },
  tituloApp: {
    fontSize: Fonte.display,
    fontWeight: PesoFonte.extrabold,
    color: Cores.texto.principal,
    letterSpacing: -1,
  },
  subtituloHero: {
    fontSize: Fonte.corpo,
    color: Cores.texto.secundario,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  cardApresentacao: {
    padding: Espacamento.xxl,
  },
  tituloCard: {
    fontSize: Fonte.titulo,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
    textAlign: 'center',
    marginBottom: Espacamento.sm,
  },
  descricaoCard: {
    fontSize: Fonte.corpo,
    color: Cores.texto.secundario,
    textAlign: 'center',
    marginBottom: Espacamento.xxl,
    lineHeight: 20,
  },
  botaoEntrar: {
    marginBottom: Espacamento.md,
  },
  botaoCriarConta: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});
