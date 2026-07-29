// ============================================================
// TELA: Login ((auth)/login.tsx)
// ============================================================
// Tela de login do FitApp com design "liquid glass".
// Permite entrar com e-mail/senha ou navegar para o cadastro.
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

export default function TelaLogin() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
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

    setCarregando(true);
    const { erro } = await entrarComEmail(email, senha);
    setCarregando(false);

    if (erro) {
      Alert.alert('Erro ao entrar', erro);
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
        {/* Cabeçalho / Branding */}
        <View style={estilos.cabecalho}>
          <SymbolView name="bolt.fill" size={36} tintColor={Cores.accent} weight="bold" />
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
              placeholder="••••••••"
              placeholderTextColor={Cores.texto.secundario}
              secureTextEntry
              value={senha}
              onChangeText={setSenha}
            />
          </View>

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
    letterSpacing: -0.5,
  },
  subtitulo: {
    fontSize: Fonte.corpo,
    color: Cores.texto.secundario,
    marginTop: 4,
  },
  cardFormulario: {
    marginBottom: Espacamento.xxl,
  },
  cardTitulo: {
    fontSize: Fonte.titulo,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
    marginBottom: Espacamento.xl,
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
  botaoEntrar: {
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
  linkCadastro: {
    color: Cores.secundaria,
    fontSize: Fonte.corpo,
    fontWeight: PesoFonte.bold,
  },
});
