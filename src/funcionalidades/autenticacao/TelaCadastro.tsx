// ============================================================
// TELA: Cadastro ((auth)/cadastro.tsx)
// ============================================================
// Permite que novos usuários crie uma conta no FitApp.
// Após o cadastro, direciona para o questionário inicial.
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

export default function TelaCadastro() {
  const { cores } = useTema();
  const estilos = useMemo(() => criarEstilos(cores), [cores]);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const { cadastrarComEmail } = useAuth();
  const router = useRouter();

  const voltarParaLogin = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(auth)/login');
  };

  const lidarComCadastro = async () => {
    if (!nome || nome.trim().length < 2) {
      Alert.alert('Aviso', 'Por favor, digite seu nome.');
      return;
    }
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
    const resposta = await cadastrarComEmail(nome, email, senha);
    setCarregando(false);

    if (resposta.erro === 'CONFIRMACAO_PENDENTE') {
      Alert.alert(
        'Conta Criada!',
        'Sua conta foi criada no Supabase.\n\nPara entrar sem precisar abrir o e-mail, desative a opção "Confirm email" no seu painel do Supabase (Authentication > Providers > Email).\n\nOu acesse sua caixa de entrada e clique no link de confirmação.',
        [{ text: 'Entendido', onPress: () => router.replace('/(auth)/login') }]
      );
    } else if (resposta.erro) {
      setErro(resposta.erro);
    } else {
      router.replace('/consentimento');
    }
  };

  return (
    <KeyboardAvoidingView
      style={estilos.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={estilos.scrollContent}>
        <View style={estilos.cabecalho}>
          <SymbolView name="paperplane.fill" size={36} tintColor={cores.destaque} weight="bold" />
          <Text style={estilos.titulo}>Crie sua conta</Text>
          <Text style={estilos.subtitulo}>Comece sua jornada de evolução</Text>
        </View>

        <CardVidro estilo={estilos.cardFormulario}>
          <View style={estilos.campo}>
            <Text style={estilos.label}>Seu Nome</Text>
            <TextInput
              style={estilos.input}
              placeholder="Como quer ser chamado?"
              placeholderTextColor={cores.textoSecundario}
              value={nome}
              onChangeText={setNome}
            />
          </View>

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
              placeholder="Mínimo 6 caracteres"
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
            texto="Criar Conta"
            aoPresionar={lidarComCadastro}
            carregando={carregando}
            estilo={estilos.botaoCadastro}
          />
        </CardVidro>

        <View style={estilos.rodape}>
          <Text style={estilos.textoRodape}>Já possui uma conta? </Text>
          <TouchableOpacity onPress={voltarParaLogin}>
            <Text style={estilos.linkLogin}>Voltar para o Login</Text>
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
  },
  subtitulo: {
    fontSize: Fonte.corpo,
    color: cores.textoSecundario,
    marginTop: 4,
  },
  cardFormulario: {
    marginBottom: Espacamento.xxl,
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
  botaoCadastro: {
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
  linkLogin: {
    color: cores.destaque,
    fontSize: Fonte.corpo,
    fontWeight: PesoFonte.bold,
  },
});
