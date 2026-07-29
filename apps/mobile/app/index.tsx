// ============================================================
// TELA INICIAL / ROTEAMENTO RAIZ (app/index.tsx)
// ============================================================
// Etapa 1 — Decisão de Roteamento & Landing Page de Autenticação:
// 1. Se o usuário NÃO está autenticado: exibe a tela inicial com
//    duas opções claras ("Entrar" e "Criar Conta").
// 2. Se o usuário ESTÁ autenticado: verifica se possui planejamento ativo.
//    - Se SIM: redireciona para o Dashboard ((tabs)/inicio)
//    - Se NÃO: redireciona para o Questionário (/questionario)
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
      // Já tem plano -> direto para o app principal
      return <Redirect href="/(tabs)/inicio" />;
    } else {
      // Novo usuário ou sem plano -> direto para o questionário
      return <Redirect href="/questionario" />;
    }
  }

  // 3. Se NÃO está logado: exibe a Tela Inicial de Apresentação (Landing / Auth Options)
  return (
    <View style={estilos.container}>
      <ScrollView contentContainerStyle={estilos.scrollContent}>
        {/* Cabeçalho Hero */}
        <View style={estilos.heroContainer}>
          <SymbolView name="bolt.fill" size={44} tintColor={Cores.accent} weight="bold" />
          <Text style={estilos.tituloApp}>FitApp</Text>
          <Text style={estilos.subtituloHero}>
            Treinos e dietas personalizados construídos com Inteligência Artificial
          </Text>
        </View>

        {/* Card de Apresentação Glass */}
        <CardVidro estilo={estilos.cardApresentacao}>
          <Text style={estilos.tituloCard}>Bem-vindo ao FitApp</Text>
          <Text style={estilos.descricaoCard}>
            Conecte-se para continuar seu acompanhamento ou crie sua conta para gerar um plano 100% exclusivo.
          </Text>

          {/* Opção 1: Entrar (Usuário já cadastrado) */}
          <BotaoPrimario
            texto="Entrar na Minha Conta"
            aoPresionar={() => router.push('/(auth)/login')}
            estilo={estilos.botaoEntrar}
          />

          {/* Opção 2: Criar Conta (Novo Usuário) */}
          <BotaoPrimario
            texto="Criar Nova Conta"
            aoPresionar={() => router.push('/(auth)/cadastro')}
            variante="outline"
            estilo={estilos.botaoCriarConta}
          />
        </CardVidro>
      </ScrollView>
    </View>
  );
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
