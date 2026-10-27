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

import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/compartilhado/AuthContexto';
import { repositorioPlano } from '@/compartilhado/servicos/repositorio';
import { CoresTema, Espacamento, Fonte } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import { Skeleton } from '@/compartilhado/ui';

export default function TelaInicialRaiz() {
  const { cores } = useTema();
  const estilos = useMemo(() => criarEstilos(cores), [cores]);
  const { usuario, carregando: carregandoAuth } = useAuth();

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
        <Skeleton largura={64} altura={64} raio={32} />
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

  // 3. Sem sessão: redireciona para login
  return <Redirect href="/(auth)/login" />;
}

const criarEstilos = (cores: CoresTema) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  centralizado: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Espacamento.xl,
  },
  textoStatus: {
    fontSize: Fonte.corpo,
    color: cores.textoSecundario,
    marginTop: Espacamento.md,
  },
});
