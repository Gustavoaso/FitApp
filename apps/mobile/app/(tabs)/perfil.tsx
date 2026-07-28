// ============================================================
// TELA: Perfil e Configurações (app/(tabs)/perfil.tsx)
// ============================================================
// Clean Dark UI. Avatar neutro, dados físicos em grid compacto,
// opções com ícones SVG, logout discreto sem borda vermelha.
// ============================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { CardVidro } from '../../componentes/ui';
import { Cores, Espacamento, Fonte, PesoFonte, Raio } from '../../constantes/Cores';
import { useAuth } from '../../contextos/AuthContexto';

const opcoes = [
  {
    id: 'notificacoes',
    icone: <SymbolView name="bell" size={18} tintColor={Cores.texto.secundario} />,
    titulo: 'Notificações',
    sub: 'Lembretes de treino e água',
  },
  {
    id: 'unidades',
    icone: <SymbolView name="ruler" size={18} tintColor={Cores.texto.secundario} />,
    titulo: 'Unidades de Medida',
    sub: 'Métrico · kg / cm',
  },
  {
    id: 'aparencia',
    icone: <SymbolView name="moon" size={18} tintColor={Cores.texto.secundario} />,
    titulo: 'Aparência',
    sub: 'Tema escuro',
  },
];

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

  const iniciais = (usuario?.user_metadata?.nome as string | undefined)
    ?.substring(0, 2)
    .toUpperCase() || 'AT';

  const nome = (usuario?.user_metadata?.nome as string | undefined) || 'Atleta';
  const email = usuario?.email || 'atleta@fitapp.com';

  return (
    <View style={estilos.container}>
      <ScrollView contentContainerStyle={estilos.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Cabeçalho do perfil ───────────────────────────── */}
        <View style={estilos.perfilHeader}>
          <View style={estilos.avatar}>
            <Text style={estilos.avatarTexto}>{iniciais}</Text>
          </View>
          <Text style={estilos.nome}>{nome}</Text>
          <Text style={estilos.email}>{email}</Text>
        </View>

        {/* ── Dados físicos ─────────────────────────────────── */}
        <Text style={estilos.secaoTitulo}>Dados Físicos</Text>
        <CardVidro estilo={estilos.cardDados}>
          <View style={estilos.gridDados}>
            {[
              { label: 'Peso', valor: '75 kg' },
              { label: 'Altura', valor: '175 cm' },
              { label: 'Idade', valor: '25 anos' },
              { label: 'Objetivo', valor: 'Hipertrofia' },
            ].map((dado, i) => (
              <View key={i} style={estilos.dadoItem}>
                <Text style={estilos.dadoLabel}>{dado.label}</Text>
                <Text style={estilos.dadoValor}>{dado.valor}</Text>
              </View>
            ))}
          </View>

          {/* Divisor */}
          <View style={estilos.divisor} />

          {/* Botão recalcular */}
          <TouchableOpacity
            style={estilos.botaoRecalcular}
            onPress={() => router.push('/questionario')}
            activeOpacity={0.7}
          >
          <SymbolView name="bolt.fill" size={16} tintColor={Cores.accent} />
            <Text style={estilos.textoRecalcular}>Recalcular Plano com IA</Text>
          </TouchableOpacity>
        </CardVidro>

        {/* ── Preferências ──────────────────────────────────── */}
        <Text style={estilos.secaoTitulo}>Preferências</Text>
        <CardVidro estilo={estilos.cardOpcoes}>
          {opcoes.map((op, i) => (
            <TouchableOpacity
              key={op.id}
              style={[estilos.itemOpcao, i < opcoes.length - 1 && estilos.itemBorda]}
              activeOpacity={0.7}
            >
              <View style={estilos.iconeOpcaoContainer}>{op.icone}</View>
              <View style={{ flex: 1 }}>
                <Text style={estilos.tituloOpcao}>{op.titulo}</Text>
                <Text style={estilos.subOpcao}>{op.sub}</Text>
              </View>
              <SymbolView name="chevron.right" size={14} tintColor={Cores.texto.desabilitado} />
            </TouchableOpacity>
          ))}
        </CardVidro>

        {/* ── Logout ────────────────────────────────────────── */}
        <TouchableOpacity
          style={estilos.botaoSair}
          onPress={lidarComSair}
          activeOpacity={0.6}
        >
          <SymbolView name="rectangle.portrait.and.arrow.right" size={16} tintColor={Cores.texto.desabilitado} />
          <Text style={estilos.textoSair}>Sair da Conta</Text>
        </TouchableOpacity>

        <Text style={estilos.versao}>FitApp v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo.principal },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 120,
  },

  perfilHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Cores.fundo.elevada,
    borderWidth: 1,
    borderColor: Cores.borda.media,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarTexto: {
    fontSize: 22,
    fontWeight: PesoFonte.semibold,
    color: Cores.texto.principal,
    letterSpacing: 1,
  },
  nome: {
    fontSize: Fonte.titulo,
    fontWeight: PesoFonte.semibold,
    color: Cores.texto.principal,
  },
  email: {
    fontSize: Fonte.label,
    color: Cores.texto.secundario,
    marginTop: 3,
  },

  secaoTitulo: {
    fontSize: Fonte.label,
    fontWeight: PesoFonte.semibold,
    color: Cores.texto.secundario,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Espacamento.md,
    marginTop: 4,
  },

  cardDados: { marginBottom: 24 },
  gridDados: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Espacamento.lg,
    marginBottom: 16,
  },
  dadoItem: { width: '45%' },
  dadoLabel: {
    fontSize: Fonte.micro,
    color: Cores.texto.desabilitado,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  dadoValor: {
    fontSize: Fonte.corpo,
    fontWeight: PesoFonte.semibold,
    color: Cores.texto.principal,
  },
  divisor: {
    height: 1,
    backgroundColor: Cores.borda.sutil,
    marginBottom: 14,
  },
  botaoRecalcular: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Raio.md,
    backgroundColor: Cores.accentSuave,
    borderWidth: 1,
    borderColor: Cores.accentBorda,
    alignSelf: 'flex-start',
  },
  textoRecalcular: {
    color: Cores.accent,
    fontWeight: PesoFonte.semibold,
    fontSize: Fonte.label,
  },

  cardOpcoes: { marginBottom: 28 },
  itemOpcao: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  itemBorda: {
    borderBottomWidth: 1,
    borderBottomColor: Cores.borda.sutil,
  },
  iconeOpcaoContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Cores.fundo.elevada,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloOpcao: {
    fontSize: Fonte.corpo,
    fontWeight: PesoFonte.medio,
    color: Cores.texto.principal,
  },
  subOpcao: {
    fontSize: Fonte.micro,
    color: Cores.texto.desabilitado,
    marginTop: 2,
  },

  // Logout — discreto, sem borda vermelha
  botaoSair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginBottom: 12,
  },
  textoSair: {
    fontSize: Fonte.corpo,
    color: Cores.texto.desabilitado,
    fontWeight: PesoFonte.medio,
  },

  versao: {
    textAlign: 'center',
    fontSize: Fonte.micro,
    color: Cores.texto.desabilitado,
    marginBottom: 8,
  },
});
