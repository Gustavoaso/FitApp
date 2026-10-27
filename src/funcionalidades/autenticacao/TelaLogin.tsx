// ============================================================
// TELA: Login ((auth)/login.tsx)
// ============================================================
// Tela de login do FitApp com design "liquid glass".
// Permite entrar com e-mail/senha ou navegar para o cadastro.
// ============================================================

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { CardVidro, BotaoPrimario } from '@/compartilhado/ui';
import { CoresTema, Espacamento, Fonte, PesoFonte, Raio } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import { useAuth } from '@/compartilhado/AuthContexto';
import { validarEmail } from '@/compartilhado/utilidades';

export default function TelaLogin() {
  const { cores } = useTema();
  const estilos = useMemo(() => criarEstilos(cores), [cores]);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const { entrarComEmail } = useAuth();
  const router = useRouter();

  const lidarComEntrar = async () => {
    const valEmail = validarEmail(email);
    if (!valEmail.valido) {
      Alert.alert('Aviso', valEmail.mensagem);
      return;
    }
    if (!senha || senha.length < 6) {
      Alert.alert('Aviso', 'A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setErro(null);
    setCarregando(true);
    const resposta = await entrarComEmail(email, senha);
    setCarregando(false);

    if (resposta.erro) {
      setErro(resposta.erro);
    } else {
      // A rota raiz decide entre questionário e dashboard conforme o plano ativo.
      router.replace('/');
    }
  };

  return (
    <KeyboardAvoidingView
      style={estilos.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={estilos.scrollContent}>
        {/* Cabeçalho / Branding */}
        <View style={estilos.cabecalho}>
          <SymbolView name="bolt.fill" size={36} tintColor={cores.destaque} weight="bold" />
          <Text style={estilos.titulo}>FitApp</Text>
          <Text style={estilos.subtitulo}>Seu treino e dieta sob medida</Text>
        </View>

        {/* Card de Formulário Glass */}
        <CardVidro estilo={estilos.cardFormulario}>
          <Text style={estilos.cardTitulo}>Entrar na sua conta</Text>

          <View style={estilos.campo}>
            <Text style={estilos.label}>E-mail</Text>
            <TextInput
              style={estilos.input}
              placeholder="seu@email.com"
              placeholderTextColor={cores.textoSecundario}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={estilos.campo}>
            <Text style={estilos.label}>Senha</Text>
            <TextInput
              style={estilos.input}
              placeholder="••••••••"
              placeholderTextColor={cores.textoSecundario}
              secureTextEntry
              value={senha}
              onChangeText={setSenha}
            />
          </View>

          {erro ? (
            <Text accessibilityRole="alert" style={estilos.textoErro}>
              {erro}
            </Text>
          ) : null}

          <BotaoPrimario
            texto="Entrar"
            aoPresionar={lidarComEntrar}
            carregando={carregando}
            estilo={estilos.botaoEntrar}
          />
        </CardVidro>

        {/* Rodapé / Link de Cadastro */}
        <View style={estilos.rodape}>
          <Text style={estilos.textoRodape}>Ainda não tem conta? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/cadastro')}>
            <Text style={estilos.linkCadastro}>Cadastre-se</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const criarEstilos = (cores: CoresTema) =>
  StyleSheet.create({
  textoErro: { color: cores.erro, fontSize: Fonte.label, textAlign: 'center', marginBottom: Espacamento.md },
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Espacamento.xxl,
  },
  cabecalho: {
    alignItems: 'center',
    marginBottom: Espacamento.xxxl,
  },
  logoEmoji: {
    fontSize: 48,
    marginBottom: Espacamento.sm,
  },
  titulo: {
    fontSize: Fonte.display,
    fontWeight: PesoFonte.extrabold,
    color: cores.texto,
    letterSpacing: -0.5,
  },
  subtitulo: {
    fontSize: Fonte.corpo,
    color: cores.textoSecundario,
    marginTop: 4,
  },
  cardFormulario: {
    marginBottom: Espacamento.xxl,
  },
  cardTitulo: {
    fontSize: Fonte.titulo,
    fontWeight: PesoFonte.bold,
    color: cores.texto,
    marginBottom: Espacamento.xl,
  },
  campo: {
    marginBottom: Espacamento.lg,
  },
  label: {
    fontSize: Fonte.label,
    fontWeight: PesoFonte.medio,
    color: cores.textoSecundario,
    marginBottom: Espacamento.sm,
  },
  input: {
    backgroundColor: cores.destaqueSuave,
    borderWidth: 1,
    borderColor: cores.separador,
    borderRadius: Raio.md,
    padding: Espacamento.md,
    fontSize: Fonte.corpo,
    color: cores.texto,
  },
  botaoEntrar: {
    marginTop: Espacamento.md,
  },
  rodape: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoRodape: {
    color: cores.textoSecundario,
    fontSize: Fonte.corpo,
  },
  linkCadastro: {
    color: cores.destaque,
    fontSize: Fonte.corpo,
    fontWeight: PesoFonte.bold,
  },
});
