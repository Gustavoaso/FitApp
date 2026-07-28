// ============================================================
// TELA: Perfil e Configurações (app/(tabs)/perfil.tsx)
// ============================================================
// Clean Dark UI — Ajuste 5:
// Telas e modais interativos para:
// - Recalcular plano com IA
// - Notificações (lembretes)
// - Unidades de medida (Métrico / Imperial)
// - Aparência (Design System Liquid Glass / Tema)
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Switch,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { BlurView } from 'expo-blur';
import { CardVidro } from '../../componentes/ui';
import { Cores, Espacamento, FamiliaFonte, Fonte, PesoFonte, Raio } from '../../constantes/Cores';
import { useAuth } from '../../contextos/AuthContexto';

export default function TelaPerfil() {
  const router = useRouter();
  const { usuario, sair } = useAuth();

  // Estados do Ajuste 5
  const [modalNotificacoesVisivel, setModalNotificacoesVisivel] = useState(false);
  const [modalUnidadesVisivel, setModalUnidadesVisivel] = useState(false);
  const [modalAparenciaVisivel, setModalAparenciaVisivel] = useState(false);

  // Notificações
  const [lembreteTreino, setLembreteTreino] = useState(true);
  const [lembreteAgua, setLembreteAgua] = useState(true);
  const [lembreteRefeicao, setLembreteRefeicao] = useState(false);

  // Unidades
  const [sistemaUnidades, setSistemaUnidades] = useState<'metrico' | 'imperial'>('metrico');

  // Aparência
  const [temaSelecionado, setTemaSelecionado] = useState('OLED Preto Puro');

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

  const lidarComRecalcularPlano = () => {
    Alert.alert(
      'Recalcular Plano com IA',
      'Deseja refazer o questionário com seus dados atuais para que o Claude recalcule sua dieta e treino?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Recalcular Agora',
          onPress: () => router.push('/questionario'),
        },
      ]
    );
  };

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
        <CardVidro semBorda estilo={estilos.cardDados}>
          <View style={estilos.gridDados}>
            {[
              { label: 'Peso', valor: sistemaUnidades === 'metrico' ? '75 kg' : '165 lbs' },
              { label: 'Altura', valor: sistemaUnidades === 'metrico' ? '175 cm' : '5 ft 9 in' },
              { label: 'Idade', valor: '25 anos' },
              { label: 'Objetivo', valor: 'Hipertrofia' },
            ].map((dado, i) => (
              <View key={i} style={estilos.dadoItem}>
                <Text style={estilos.dadoLabel}>{dado.label}</Text>
                <Text style={estilos.dadoValor}>{dado.valor}</Text>
              </View>
            ))}
          </View>

          <View style={estilos.divisor} />

          {/* Botão recalcular plano com IA */}
          <TouchableOpacity
            style={estilos.botaoRecalcular}
            onPress={lidarComRecalcularPlano}
            activeOpacity={0.7}
          >
            <SymbolView name="bolt.fill" size={16} tintColor="#EAB308" weight="bold" />
            <Text style={estilos.textoRecalcular}>Recalcular Plano com IA</Text>
          </TouchableOpacity>
        </CardVidro>

        {/* ── Preferências (Ajuste 5) ───────────────────────── */}
        <Text style={estilos.secaoTitulo}>Preferências</Text>
        <CardVidro semBorda estilo={estilos.cardOpcoes}>

          {/* Notificações */}
          <TouchableOpacity
            style={[estilos.itemOpcao, estilos.itemBorda]}
            onPress={() => setModalNotificacoesVisivel(true)}
            activeOpacity={0.7}
          >
            <View style={estilos.iconeOpcaoContainer}>
              <SymbolView name="bell.fill" size={18} tintColor={Cores.texto.secundario} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={estilos.tituloOpcao}>Notificações</Text>
              <Text style={estilos.subOpcao}>
                {lembreteTreino ? 'Lembretes de treino e água ativos' : 'Notificações desativadas'}
              </Text>
            </View>
            <SymbolView name="chevron.right" size={14} tintColor={Cores.texto.desabilitado} />
          </TouchableOpacity>

          {/* Unidades de Medida */}
          <TouchableOpacity
            style={[estilos.itemOpcao, estilos.itemBorda]}
            onPress={() => setModalUnidadesVisivel(true)}
            activeOpacity={0.7}
          >
            <View style={estilos.iconeOpcaoContainer}>
              <SymbolView name="ruler.fill" size={18} tintColor={Cores.texto.secundario} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={estilos.tituloOpcao}>Unidades de Medida</Text>
              <Text style={estilos.subOpcao}>
                {sistemaUnidades === 'metrico' ? 'Sistema Métrico (kg / cm / ml)' : 'Sistema Imperial (lbs / in / fl oz)'}
              </Text>
            </View>
            <SymbolView name="chevron.right" size={14} tintColor={Cores.texto.desabilitado} />
          </TouchableOpacity>

          {/* Aparência */}
          <TouchableOpacity
            style={estilos.itemOpcao}
            onPress={() => setModalAparenciaVisivel(true)}
            activeOpacity={0.7}
          >
            <View style={estilos.iconeOpcaoContainer}>
              <SymbolView name="moon.fill" size={18} tintColor={Cores.texto.secundario} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={estilos.tituloOpcao}>Aparência</Text>
              <Text style={estilos.subOpcao}>{temaSelecionado} · Liquid Glass</Text>
            </View>
            <SymbolView name="chevron.right" size={14} tintColor={Cores.texto.desabilitado} />
          </TouchableOpacity>

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

      {/* ── Modal Notificações ──────────────────────────────── */}
      <Modal visible={modalNotificacoesVisivel} animationType="slide" transparent statusBarTranslucent>
        <TouchableOpacity style={estilos.modalOverlay} activeOpacity={1} onPress={() => setModalNotificacoesVisivel(false)} />
        <BlurView intensity={80} tint="dark" style={estilos.modalCard}>
          <View style={estilos.modalHandle} />
          <Text style={estilos.modalTitulo}>Preferências de Notificação</Text>

          <View style={estilos.rowSwitch}>
            <View style={{ flex: 1 }}>
              <Text style={estilos.txtSwitchTitulo}>Lembretes de Treino</Text>
              <Text style={estilos.txtSwitchSub}>Notificar no horário do treino planejado</Text>
            </View>
            <Switch value={lembreteTreino} onValueChange={setLembreteTreino} trackColor={{ true: Cores.accent }} />
          </View>

          <View style={estilos.rowSwitch}>
            <View style={{ flex: 1 }}>
              <Text style={estilos.txtSwitchTitulo}>Lembrete de Hidratação</Text>
              <Text style={estilos.txtSwitchSub}>Lembretes periódicos para beber água</Text>
            </View>
            <Switch value={lembreteAgua} onValueChange={setLembreteAgua} trackColor={{ true: Cores.accent }} />
          </View>

          <View style={estilos.rowSwitch}>
            <View style={{ flex: 1 }}>
              <Text style={estilos.txtSwitchTitulo}>Lembrete de Refeições</Text>
              <Text style={estilos.txtSwitchSub}>Alertas para registrar refeições</Text>
            </View>
            <Switch value={lembreteRefeicao} onValueChange={setLembreteRefeicao} trackColor={{ true: Cores.accent }} />
          </View>

          <View style={estilos.modalAcoes}>
            <TouchableOpacity onPress={() => setModalNotificacoesVisivel(false)} style={estilos.btnSalvar}>
              <Text style={estilos.txtSalvar}>Concluído</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>

      {/* ── Modal Unidades de Medida ────────────────────────── */}
      <Modal visible={modalUnidadesVisivel} animationType="slide" transparent statusBarTranslucent>
        <TouchableOpacity style={estilos.modalOverlay} activeOpacity={1} onPress={() => setModalUnidadesVisivel(false)} />
        <BlurView intensity={80} tint="dark" style={estilos.modalCard}>
          <View style={estilos.modalHandle} />
          <Text style={estilos.modalTitulo}>Unidades de Medida</Text>

          <TouchableOpacity
            style={[estilos.itemSelect, sistemaUnidades === 'metrico' && estilos.itemSelectAtivo]}
            onPress={() => setSistemaUnidades('metrico')}
          >
            <View style={{ flex: 1 }}>
              <Text style={estilos.txtSelectTitulo}>Sistema Métrico (Padrão)</Text>
              <Text style={estilos.txtSelectSub}>Quilogramas (kg), Centímetros (cm), Mililitros (ml)</Text>
            </View>
            {sistemaUnidades === 'metrico' && <SymbolView name="checkmark.circle.fill" size={20} tintColor={Cores.accent} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[estilos.itemSelect, sistemaUnidades === 'imperial' && estilos.itemSelectAtivo]}
            onPress={() => setSistemaUnidades('imperial')}
          >
            <View style={{ flex: 1 }}>
              <Text style={estilos.txtSelectTitulo}>Sistema Imperial</Text>
              <Text style={estilos.txtSelectSub}>Libras (lbs), Polegadas (in), Onças (fl oz)</Text>
            </View>
            {sistemaUnidades === 'imperial' && <SymbolView name="checkmark.circle.fill" size={20} tintColor={Cores.accent} />}
          </TouchableOpacity>

          <View style={estilos.modalAcoes}>
            <TouchableOpacity onPress={() => setModalUnidadesVisivel(false)} style={estilos.btnSalvar}>
              <Text style={estilos.txtSalvar}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>

      {/* ── Modal Aparência ─────────────────────────────────── */}
      <Modal visible={modalAparenciaVisivel} animationType="slide" transparent statusBarTranslucent>
        <TouchableOpacity style={estilos.modalOverlay} activeOpacity={1} onPress={() => setModalAparenciaVisivel(false)} />
        <BlurView intensity={80} tint="dark" style={estilos.modalCard}>
          <View style={estilos.modalHandle} />
          <Text style={estilos.modalTitulo}>Preferências de Aparência</Text>

          {['OLED Preto Puro', 'Liquid Glass Dark', 'Modo Automático (Sistema)'].map(t => (
            <TouchableOpacity
              key={t}
              style={[estilos.itemSelect, temaSelecionado === t && estilos.itemSelectAtivo]}
              onPress={() => setTemaSelecionado(t)}
            >
              <Text style={estilos.txtSelectTitulo}>{t}</Text>
              {temaSelecionado === t && <SymbolView name="checkmark.circle.fill" size={20} tintColor={Cores.accent} />}
            </TouchableOpacity>
          ))}

          <View style={estilos.modalAcoes}>
            <TouchableOpacity onPress={() => setModalAparenciaVisivel(false)} style={estilos.btnSalvar}>
              <Text style={estilos.txtSalvar}>Concluído</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>
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
    marginBottom: 24,
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
    fontFamily: FamiliaFonte.bold,
    fontSize: 22,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
    letterSpacing: 1,
  },
  nome: {
    fontFamily: FamiliaFonte.bold,
    fontSize: Fonte.titulo,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
  },
  email: {
    fontFamily: FamiliaFonte.regular,
    fontSize: Fonte.label,
    color: Cores.texto.secundario,
    marginTop: 3,
  },

  secaoTitulo: {
    fontFamily: FamiliaFonte.bold,
    fontSize: Fonte.label,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.secundario,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Espacamento.md,
    marginTop: 4,
  },

  cardDados: { marginBottom: 20, marginHorizontal: -20 },
  gridDados: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Espacamento.lg,
  },
  dadoItem: {
    width: '50%',
    marginBottom: Espacamento.md,
  },
  dadoLabel: {
    fontFamily: FamiliaFonte.regular,
    fontSize: Fonte.micro,
    color: Cores.texto.secundario,
  },
  dadoValor: {
    fontFamily: FamiliaFonte.bold,
    fontSize: Fonte.subtitulo,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
    marginTop: 2,
  },
  divisor: {
    height: 1,
    backgroundColor: Cores.borda.sutil,
    marginHorizontal: Espacamento.lg,
  },
  botaoRecalcular: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Espacamento.md,
  },
  textoRecalcular: {
    fontFamily: FamiliaFonte.bold,
    fontSize: Fonte.corpo,
    color: Cores.texto.principal,
    fontWeight: PesoFonte.bold,
  },

  cardOpcoes: { marginBottom: 24, marginHorizontal: -20 },
  itemOpcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.md,
    padding: Espacamento.lg,
  },
  itemBorda: {
    borderBottomWidth: 1,
    borderBottomColor: Cores.borda.sutil,
  },
  iconeOpcaoContainer: {
    width: 36,
    height: 36,
    borderRadius: Raio.sm,
    backgroundColor: Cores.fundo.elevada,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloOpcao: {
    fontFamily: FamiliaFonte.bold,
    fontSize: Fonte.corpo,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
  },
  subOpcao: {
    fontFamily: FamiliaFonte.regular,
    fontSize: Fonte.micro,
    color: Cores.texto.secundario,
    marginTop: 2,
  },

  botaoSair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Espacamento.md,
    marginBottom: Espacamento.lg,
  },
  textoSair: {
    fontFamily: FamiliaFonte.regular,
    fontSize: Fonte.corpo,
    color: Cores.texto.desabilitado,
  },
  versao: {
    fontFamily: FamiliaFonte.regular,
    textAlign: 'center',
    fontSize: Fonte.micro,
    color: Cores.texto.desabilitado,
  },

  // Modal & Sheet
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Cores.borda.forte,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    backgroundColor: 'rgba(16,19,24,0.97)',
    borderTopWidth: 1,
    borderColor: Cores.borda.sutil,
  },
  modalTitulo: {
    fontFamily: FamiliaFonte.bold,
    fontSize: Fonte.subtitulo,
    color: Cores.texto.principal,
    marginBottom: 20,
  },
  rowSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  txtSwitchTitulo: {
    fontFamily: FamiliaFonte.bold,
    fontSize: Fonte.corpo,
    color: Cores.texto.principal,
  },
  txtSwitchSub: {
    fontFamily: FamiliaFonte.regular,
    fontSize: 12,
    color: Cores.texto.secundario,
    marginTop: 2,
  },
  itemSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: Cores.fundo.elevada,
    borderRadius: Raio.md,
    marginBottom: 10,
  },
  itemSelectAtivo: {
    borderWidth: 1,
    borderColor: Cores.accent,
  },
  txtSelectTitulo: {
    fontFamily: FamiliaFonte.bold,
    fontSize: Fonte.corpo,
    color: Cores.texto.principal,
  },
  txtSelectSub: {
    fontFamily: FamiliaFonte.regular,
    fontSize: 12,
    color: Cores.texto.secundario,
    marginTop: 2,
  },
  modalAcoes: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 },
  btnSalvar: { backgroundColor: Cores.accent, paddingVertical: 10, paddingHorizontal: 20, borderRadius: Raio.md },
  txtSalvar: { fontFamily: FamiliaFonte.bold, color: '#080A0E', fontSize: Fonte.corpo },
});
