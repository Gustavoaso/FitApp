// ============================================================
// TELA: Cadastro ((auth)/cadastro.tsx)
// ============================================================
// Permite que novos usuários crie uma conta no FitApp.
// Após o cadastro, direciona para o questionário inicial.
// ============================================================

import React, { useState } from 'react';
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
import { CardVidro, BotaoPrimario } from '../../componentes/ui';
import { Cores, Espacamento, Fonte, PesoFonte, Raio } from '../../constantes/Cores';
import { useAuth } from '../../contextos/AuthContexto';
import { validarEmail } from '@fitapp/utilidades';

export default function TelaCadastro() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { cadastrarComEmail } = useAuth();
  const router = useRouter();

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

    setCarregando(true);
    const { erro } = await cadastrarComEmail(nome, email, senha);
    setCarregando(false);

    if (erro === 'CONFIRMACAO_PENDENTE') {
      Alert.alert(
        'Conta Criada!',
        'Sua conta foi criada no Supabase.\n\nPara entrar sem precisar abrir o e-mail, desative a opção "Confirm email" no seu painel do Supabase (Authentication > Providers > Email).\n\nOu acesse sua caixa de entrada e clique no link de confirmação.',
        [{ text: 'Entendido', onPress: () => router.replace('/(auth)/login') }]
      );
    } else if (erro) {
      Alert.alert('Erro ao cadastrar', erro);
    } else {
      router.replace('/');
    }
  };

  return (
    <KeyboardAvoidingView
      style={estilos.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={estilos.scrollContent}>
        <View style={estilos.cabecalho}>
          <SymbolView name="paperplane.fill" size={36} tintColor={Cores.accent} weight="bold" />
          <Text style={estilos.titulo}>Crie sua conta</Text>
          <Text style={estilos.subtitulo}>Comece sua jornada de evolução</Text>
        </View>

        <CardVidro estilo={estilos.cardFormulario}>
          <View style={estilos.campo}>
            <Text style={estilos.label}>Seu Nome</Text>
            <TextInput
              style={estilos.input}
              placeholder="Como quer ser chamado?"
              placeholderTextColor={Cores.texto.secundario}
              value={nome}
              onChangeText={setNome}
            />
          </View>

          <View style={estilos.campo}>
            <Text style={estilos.label}>E-mail</Text>
            <TextInput
              style={estilos.input}
              placeholder="seu@email.com"
              placeholderTextColor={Cores.texto.secundario}
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
              placeholderTextColor={Cores.texto.secundario}
              secureTextEntry
              value={senha}
              onChangeText={setSenha}
            />
          </View>

          <BotaoPrimario
            texto="Criar Conta"
            aoPresionar={lidarComCadastro}
            carregando={carregando}
            estilo={estilos.botaoCadastro}
          />
        </CardVidro>

        <View style={estilos.rodape}>
          <Text style={estilos.textoRodape}>Já possui uma conta? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={estilos.linkLogin}>Voltar para o Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Cores.fundo.principal,
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
    color: Cores.texto.principal,
  },
  subtitulo: {
    fontSize: Fonte.corpo,
    color: Cores.texto.secundario,
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
    color: Cores.texto.secundario,
    marginBottom: Espacamento.sm,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Cores.vidro.borda,
    borderRadius: Raio.md,
    padding: Espacamento.md,
    fontSize: Fonte.corpo,
    color: Cores.texto.principal,
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
    color: Cores.texto.secundario,
    fontSize: Fonte.corpo,
  },
  linkLogin: {
    color: Cores.secundaria,
    fontSize: Fonte.corpo,
    fontWeight: PesoFonte.bold,
  },
});
