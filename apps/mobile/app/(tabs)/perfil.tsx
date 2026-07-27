// ============================================================
// TELA: Perfil e Configurações (app/(tabs)/perfil.tsx)
// ============================================================
// Perfil do usuário, dados físicos editáveis, recálculo de plano
// e botão de logout.
// ============================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CardVidro } from '../../componentes/ui';
import { Cores, Espacamento, Fonte, PesoFonte, Raio } from '../../constantes/Cores';
import { useAuth } from '../../contextos/AuthContexto';

export default function TelaPerfil() {
  const router = useRouter();
  const { usuario, sair } = useAuth();

  const lidarComSair = async () => {
    Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await sair();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const recalcularPlano = () => {
    router.push('/questionario');
  };

  return (
    <View style={estilos.container}>
      <ScrollView contentContainerStyle={estilos.scrollContent}>
        {/* Cabeçalho do Perfil */}
        <View style={estilos.perfilHeader}>
          <View style={estilos.avatar}>
            <Text style={estilos.avatarTexto}>
              {usuario?.user_metadata?.nome?.substring(0, 2).toUpperCase() || 'AT'}
            </Text>
          </View>
          <Text style={estilos.nome}>{usuario?.user_metadata?.nome || 'Atleta'}</Text>
          <Text style={estilos.email}>{usuario?.email || 'atleta@fitapp.com'}</Text>
        </View>

        {/* Card de Medidas do Corpo */}
        <Text style={estilos.secaoTitulo}>Dados Físicos</Text>
        <CardVidro estilo={estilos.cardDados}>
          <View style={estilos.gridDados}>
            <View style={estilos.dadoItem}>
              <Text style={estilos.dadoLabel}>Peso</Text>
              <Text style={estilos.dadoValor}>75 kg</Text>
            </View>
            <View style={estilos.dadoItem}>
              <Text style={estilos.dadoLabel}>Altura</Text>
              <Text style={estilos.dadoValor}>175 cm</Text>
            </View>
            <View style={estilos.dadoItem}>
              <Text style={estilos.dadoLabel}>Idade</Text>
              <Text style={estilos.dadoValor}>25 anos</Text>
            </View>
            <View style={estilos.dadoItem}>
              <Text style={estilos.dadoLabel}>Objetivo</Text>
              <Text style={estilos.dadoValor}>Hipertrofia</Text>
            </View>
          </View>

          <TouchableOpacity style={estilos.botaoRecalcular} onPress={recalcularPlano}>
            <Text style={estilos.textoRecalcular}>⚡ Recalcular Plano com IA</Text>
          </TouchableOpacity>
        </CardVidro>

        {/* Configurações */}
        <Text style={estilos.secaoTitulo}>Preferências</Text>
        <CardVidro estilo={estilos.cardOpcoes}>
          {[
            { icone: '🔔', titulo: 'Notificações & Lembretes', sub: 'Lembretes de treino e água' },
            { icone: '⚖️', titulo: 'Unidades de Medida', sub: 'Métrico (kg / cm)' },
            { icone: '🌙', titulo: 'Aparência', sub: 'Tema Escuro (Liquid Glass)' },
          ].map((op, i) => (
            <TouchableOpacity key={i} style={estilos.itemOpcao}>
              <Text style={estilos.iconeOpcao}>{op.icone}</Text>
              <View style={{ flex: 1 }}>
                <Text style={estilos.tituloOpcao}>{op.titulo}</Text>
                <Text style={estilos.subOpcao}>{op.sub}</Text>
              </View>
              <Text style={estilos.setaOpcao}>➔</Text>
            </TouchableOpacity>
          ))}
        </CardVidro>

        {/* Botão de Sair */}
        <TouchableOpacity style={estilos.botaoSair} onPress={lidarComSair}>
          <Text style={estilos.textoSair}>Sair da Conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Cores.fundo.principal,
  },
  scrollContent: {
    padding: Espacamento.xxl,
    paddingBottom: 100,
  },
  perfilHeader: {
    alignItems: 'center',
    marginTop: Espacamento.lg,
    marginBottom: Espacamento.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Cores.primaria.base,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Espacamento.md,
    borderWidth: 2,
    borderColor: Cores.vidro.borda,
  },
  avatarTexto: {
    fontSize: 28,
    fontWeight: PesoFonte.extrabold,
    color: Cores.texto.principal,
  },
  nome: {
    fontSize: Fonte.titulo,
    fontWeight: PesoFonte.extrabold,
    color: Cores.texto.principal,
  },
  email: {
    fontSize: Fonte.label,
    color: Cores.texto.secundario,
    marginTop: 2,
  },
  secaoTitulo: {
    fontSize: Fonte.subtitulo,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
    marginBottom: Espacamento.md,
  },
  cardDados: {
    marginBottom: Espacamento.xl,
  },
  gridDados: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Espacamento.lg,
    marginBottom: Espacamento.lg,
  },
  dadoItem: {
    width: '45%',
  },
  dadoLabel: {
    fontSize: Fonte.micro,
    color: Cores.texto.secundario,
  },
  dadoValor: {
    fontSize: Fonte.corpo,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
    marginTop: 2,
  },
  botaoRecalcular: {
    backgroundColor: Cores.primaria.suave,
    padding: Espacamento.md,
    borderRadius: Raio.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Cores.primaria.base,
  },
  textoRecalcular: {
    color: Cores.texto.principal,
    fontWeight: PesoFonte.bold,
    fontSize: Fonte.label,
  },
  cardOpcoes: {
    marginBottom: Espacamento.xl,
  },
  itemOpcao: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Espacamento.md,
    gap: Espacamento.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconeOpcao: {
    fontSize: 20,
  },
  tituloOpcao: {
    fontSize: Fonte.corpo,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
  },
  subOpcao: {
    fontSize: Fonte.micro,
    color: Cores.texto.secundario,
    marginTop: 2,
  },
  setaOpcao: {
    color: Cores.texto.secundario,
  },
  botaoSair: {
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    borderWidth: 1,
    borderColor: Cores.feedback.erro,
    padding: Espacamento.lg,
    borderRadius: Raio.lg,
    alignItems: 'center',
  },
  textoSair: {
    color: Cores.feedback.erro,
    fontWeight: PesoFonte.bold,
    fontSize: Fonte.corpo,
  },
});
