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

import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { BlurView } from 'expo-blur';
import { CardVidro, EstanteConquistas } from '@/compartilhado/ui';
import { buscarResumoGamificacao } from '@/compartilhado/servicos/gamificacao-servico';
import { VisualizadorJSONModal } from './VisualizadorJSONModal';
import {
  CoresTema,
  Espacamento,
  FamiliaFonte,
  Fonte,
  PesoFonte,
  Raio,
  Tipografia,
} from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import { useAuth } from '@/compartilhado/AuthContexto';
import { repositorioPlano } from '@/compartilhado/servicos/repositorio';
import { obterHistoricoPeso } from '@/compartilhado/servicos/progresso-servico';
import { montarDadosFisicos, SEM_DADO } from './dados-fisicos';
import { obterDadosRawTacoAPI } from './taco-sincronizacao-servico';
import { obterDadosRawExerciseDB } from './exercise-db-sincronizacao-servico';
import { excluirConta } from './excluir-conta-servico';

export default function TelaPerfil() {
  const { cores, escuro } = useTema();
  const estilos = useMemo(() => criarEstilos(cores), [cores]);
  const router = useRouter();
  const { usuario, sair } = useAuth();

  // Inspector JSON Dev
  const [modalJSONVisivel, setModalJSONVisivel] = useState(false);
  const [rawTaco, setRawTaco] = useState<any[]>([]);
  const [rawExerciseDB, setRawExerciseDB] = useState<any[]>([]);
  const [carregandoJSON, setCarregandoJSON] = useState(false);
  const [erroJSON, setErroJSON] = useState<string | null>(null);

  const lidarComAbrirInspectorJSON = async () => {
    setModalJSONVisivel(true);
    setCarregandoJSON(true);
    setErroJSON(null);
    try {
      const [alimentos, exercicios] = await Promise.all([
        obterDadosRawTacoAPI(),
        obterDadosRawExerciseDB(),
      ]);
      setRawTaco(alimentos || []);
      setRawExerciseDB(exercicios || []);
    } catch (err: any) {
      setErroJSON(err?.message || 'Falha ao conectar com as APIs.');
    } finally {
      setCarregandoJSON(false);
    }
  };

  // Estados do Perfil e Físicos
  const [conquistas, setConquistas] = useState<string[] | null>(null);
  const [dadosFisicos, setDadosFisicos] = useState({
    peso: SEM_DADO,
    altura: SEM_DADO,
    idade: SEM_DADO,
    objetivo: SEM_DADO,
  });

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

  const carregarPerfilReal = async () => {
    const perfilBanco = await repositorioPlano.obterPerfilUsuario();
    const ultimasRespostas = await repositorioPlano.obterUltimasRespostasQuestionario();

    // O peso registrado no Início aparece aqui sem reabrir o app.
    const pesagens = await obterHistoricoPeso();
    const ultimoPeso = pesagens[pesagens.length - 1]?.pesoKg;

    setDadosFisicos(montarDadosFisicos(perfilBanco, ultimasRespostas, sistemaUnidades, ultimoPeso));
    const resumo = await buscarResumoGamificacao(new Date().toISOString().split('T')[0]);
    setConquistas(resumo ? resumo.conquistas : null);
  };

  useFocusEffect(
    useCallback(() => {
      carregarPerfilReal();
    }, []),
  );

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

  const [excluindo, setExcluindo] = useState(false);

  const confirmarExclusao = async () => {
    setExcluindo(true);
    try {
      await excluirConta();
      router.replace('/(auth)/login');
    } catch {
      setExcluindo(false);
      Alert.alert(
        'Não foi possível excluir',
        'Verifique a conexão e tente de novo. Nada foi apagado.',
      );
    }
  };

  const lidarComExcluirConta = () => {
    Alert.alert(
      'Excluir sua conta?',
      'Seus planos, treinos e registros de dieta serão apagados para sempre.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir conta e dados', style: 'destructive', onPress: confirmarExclusao },
      ],
    );
  };

  const iniciais =
    (usuario?.user_metadata?.nome as string | undefined)?.substring(0, 2).toUpperCase() || 'AT';

  const nome = (usuario?.user_metadata?.nome as string | undefined) || SEM_DADO;
  const email = usuario?.email || '';

  const lidarComRecalcularPlano = async () => {
    const perfilBanco = await repositorioPlano.obterPerfilUsuario();
    const respostasSalvas = await repositorioPlano.obterUltimasRespostasQuestionario();

    const payload = {
      perfil: {
        sexo_biologico: respostasSalvas?.perfil?.sexo_biologico || perfilBanco?.sexo || 'Masculino',
        idade: respostasSalvas?.perfil?.idade || perfilBanco?.idade || 25,
        peso_atual: respostasSalvas?.perfil?.peso_atual || perfilBanco?.peso_kg || 75,
        altura: respostasSalvas?.perfil?.altura || perfilBanco?.altura_cm || 175,
      },
      objetivo: {
        objetivo_principal:
          respostasSalvas?.objetivo?.objetivo_principal || perfilBanco?.objetivo || 'Hipertrofia',
        atividade_fora_treino:
          respostasSalvas?.objetivo?.atividade_fora_treino ||
          perfilBanco?.nivel_atividade ||
          'Moderado',
        nivel_experiencia:
          respostasSalvas?.objetivo?.nivel_experiencia ||
          perfilBanco?.nivel_experiencia ||
          'Intermediário',
      },
      treino: respostasSalvas?.treino || {},
      dieta: respostasSalvas?.dieta || {},
    };

    router.push({
      pathname: '/questionario',
      params: {
        origem: 'perfil',
        dadosFormulario: JSON.stringify(payload),
      },
    });
  };

  return (
    <View style={estilos.container}>
      <ScrollView
        contentContainerStyle={estilos.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Cabeçalho do perfil ───────────────────────────── */}
        <View style={estilos.perfilHeader}>
          <View style={estilos.avatar}>
            <Text style={estilos.avatarTexto}>{iniciais}</Text>
          </View>
          <Text style={estilos.nome}>{nome}</Text>
          <Text style={estilos.email}>{email}</Text>
        </View>

        {conquistas ? <EstanteConquistas conquistadas={conquistas} /> : null}

        {/* ── Dados físicos ─────────────────────────────────── */}
        <Text style={estilos.secaoTitulo}>Dados Físicos</Text>
        <CardVidro semBorda estilo={estilos.cardDados}>
          <View style={estilos.gridDados}>
            {[
              { label: 'Peso', valor: dadosFisicos.peso },
              { label: 'Altura', valor: dadosFisicos.altura },
              { label: 'Idade', valor: dadosFisicos.idade },
              { label: 'Objetivo', valor: dadosFisicos.objetivo },
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
            <SymbolView name="bolt.fill" size={16} tintColor={cores.destaqueTexto} weight="bold" />
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
              <SymbolView name="bell.fill" size={18} tintColor={cores.textoSecundario} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={estilos.tituloOpcao}>Notificações</Text>
              <Text style={estilos.subOpcao}>
                {lembreteTreino ? 'Lembretes de treino e água ativos' : 'Notificações desativadas'}
              </Text>
            </View>
            <SymbolView name="chevron.right" size={14} tintColor={cores.textoSecundario} />
          </TouchableOpacity>

          {/* Unidades de Medida */}
          <TouchableOpacity
            style={[estilos.itemOpcao, estilos.itemBorda]}
            onPress={() => setModalUnidadesVisivel(true)}
            activeOpacity={0.7}
          >
            <View style={estilos.iconeOpcaoContainer}>
              <SymbolView name="ruler.fill" size={18} tintColor={cores.textoSecundario} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={estilos.tituloOpcao}>Unidades de Medida</Text>
              <Text style={estilos.subOpcao}>
                {sistemaUnidades === 'metrico'
                  ? 'Sistema Métrico (kg / cm / ml)'
                  : 'Sistema Imperial (lbs / in / fl oz)'}
              </Text>
            </View>
            <SymbolView name="chevron.right" size={14} tintColor={cores.textoSecundario} />
          </TouchableOpacity>

          {/* Aparência */}
          <TouchableOpacity
            style={[estilos.itemOpcao, estilos.itemBorda]}
            onPress={() => setModalAparenciaVisivel(true)}
            activeOpacity={0.7}
          >
            <View style={estilos.iconeOpcaoContainer}>
              <SymbolView name="moon.fill" size={18} tintColor={cores.textoSecundario} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={estilos.tituloOpcao}>Aparência</Text>
              <Text style={estilos.subOpcao}>{temaSelecionado} · Liquid Glass</Text>
            </View>
            <SymbolView name="chevron.right" size={14} tintColor={cores.textoSecundario} />
          </TouchableOpacity>

          {/* Dev Tool: só em desenvolvimento, nunca para quem usa o app. */}
          {__DEV__ ? (
            <TouchableOpacity
              style={estilos.itemOpcao}
              onPress={lidarComAbrirInspectorJSON}
              disabled={carregandoJSON}
              activeOpacity={0.7}
            >
              <View
                style={[
                  estilos.iconeOpcaoContainer,
                  { backgroundColor: 'rgba(234, 179, 8, 0.15)' },
                ]}
              >
                <SymbolView name="terminal.fill" size={18} tintColor={cores.destaque} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[estilos.tituloOpcao, { color: cores.destaque }]}>
                  {carregandoJSON ? 'Buscando JSON...' : 'Dev: Inspetor de JSON das APIs'}
                </Text>
                <Text style={estilos.subOpcao}>
                  Abre modal interativo para expandir/colapsar os objetos brutos
                </Text>
              </View>
              <SymbolView name="chevron.right" size={14} tintColor={cores.destaque} />
            </TouchableOpacity>
          ) : null}
        </CardVidro>

        {/* ── Logout ────────────────────────────────────────── */}
        <TouchableOpacity style={estilos.botaoSair} onPress={lidarComSair} activeOpacity={0.6}>
          <SymbolView
            name="rectangle.portrait.and.arrow.right"
            size={16}
            tintColor={cores.textoSecundario}
          />
          <Text style={estilos.textoSair}>Sair da Conta</Text>
        </TouchableOpacity>

        {/* ── Excluir conta: destrutivo, separado do resto ───── */}
        <CardVidro semBorda estilo={estilos.cardOpcoes}>
          <TouchableOpacity
            style={estilos.itemOpcao}
            onPress={lidarComExcluirConta}
            disabled={excluindo}
            accessibilityRole="button"
            accessibilityLabel="Excluir conta"
            accessibilityHint="Apaga sua conta, planos e histórico. Não tem volta."
            activeOpacity={0.7}
          >
            <View style={{ flex: 1 }}>
              <Text style={[estilos.tituloOpcao, { color: cores.erro }]}>
                {excluindo ? 'Excluindo conta...' : 'Excluir conta'}
              </Text>
              <Text style={estilos.subOpcao}>
                Apaga sua conta, planos e histórico. Não tem volta.
              </Text>
            </View>
          </TouchableOpacity>
        </CardVidro>

        <Text style={estilos.versao}>TreinaAI v1.0.0</Text>
      </ScrollView>

      {/* ── Modal Notificações ──────────────────────────────── */}
      <Modal
        visible={modalNotificacoesVisivel}
        animationType="slide"
        transparent
        statusBarTranslucent
      >
        <TouchableOpacity
          style={estilos.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalNotificacoesVisivel(false)}
        />
        <BlurView intensity={80} tint={escuro ? 'dark' : 'light'} style={estilos.modalCard}>
          <View style={estilos.modalHandle} />
          <Text style={estilos.modalTitulo}>Preferências de Notificação</Text>

          <View style={estilos.rowSwitch}>
            <View style={{ flex: 1 }}>
              <Text style={estilos.txtSwitchTitulo}>Lembretes de Treino</Text>
              <Text style={estilos.txtSwitchSub}>Notificar no horário do treino planejado</Text>
            </View>
            <Switch
              value={lembreteTreino}
              onValueChange={setLembreteTreino}
              trackColor={{ true: cores.destaque }}
            />
          </View>

          <View style={estilos.rowSwitch}>
            <View style={{ flex: 1 }}>
              <Text style={estilos.txtSwitchTitulo}>Lembrete de Hidratação</Text>
              <Text style={estilos.txtSwitchSub}>Lembretes periódicos para beber água</Text>
            </View>
            <Switch
              value={lembreteAgua}
              onValueChange={setLembreteAgua}
              trackColor={{ true: cores.destaque }}
            />
          </View>

          <View style={estilos.rowSwitch}>
            <View style={{ flex: 1 }}>
              <Text style={estilos.txtSwitchTitulo}>Lembrete de Refeições</Text>
              <Text style={estilos.txtSwitchSub}>Alertas para registrar refeições</Text>
            </View>
            <Switch
              value={lembreteRefeicao}
              onValueChange={setLembreteRefeicao}
              trackColor={{ true: cores.destaque }}
            />
          </View>

          <View style={estilos.modalAcoes}>
            <TouchableOpacity
              onPress={() => setModalNotificacoesVisivel(false)}
              style={estilos.btnSalvar}
            >
              <Text style={estilos.txtSalvar}>Concluído</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>

      {/* ── Modal Unidades de Medida ────────────────────────── */}
      <Modal visible={modalUnidadesVisivel} animationType="slide" transparent statusBarTranslucent>
        <TouchableOpacity
          style={estilos.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalUnidadesVisivel(false)}
        />
        <BlurView intensity={80} tint={escuro ? 'dark' : 'light'} style={estilos.modalCard}>
          <View style={estilos.modalHandle} />
          <Text style={estilos.modalTitulo}>Unidades de Medida</Text>

          <TouchableOpacity
            style={[estilos.itemSelect, sistemaUnidades === 'metrico' && estilos.itemSelectAtivo]}
            onPress={() => setSistemaUnidades('metrico')}
          >
            <View style={{ flex: 1 }}>
              <Text style={estilos.txtSelectTitulo}>Sistema Métrico (Padrão)</Text>
              <Text style={estilos.txtSelectSub}>
                Quilogramas (kg), Centímetros (cm), Mililitros (ml)
              </Text>
            </View>
            {sistemaUnidades === 'metrico' && (
              <SymbolView name="checkmark.circle.fill" size={20} tintColor={cores.destaque} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[estilos.itemSelect, sistemaUnidades === 'imperial' && estilos.itemSelectAtivo]}
            onPress={() => setSistemaUnidades('imperial')}
          >
            <View style={{ flex: 1 }}>
              <Text style={estilos.txtSelectTitulo}>Sistema Imperial</Text>
              <Text style={estilos.txtSelectSub}>Libras (lbs), Polegadas (in), Onças (fl oz)</Text>
            </View>
            {sistemaUnidades === 'imperial' && (
              <SymbolView name="checkmark.circle.fill" size={20} tintColor={cores.destaque} />
            )}
          </TouchableOpacity>

          <View style={estilos.modalAcoes}>
            <TouchableOpacity
              onPress={() => setModalUnidadesVisivel(false)}
              style={estilos.btnSalvar}
            >
              <Text style={estilos.txtSalvar}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>

      {/* ── Modal Aparência ─────────────────────────────────── */}
      <Modal visible={modalAparenciaVisivel} animationType="slide" transparent statusBarTranslucent>
        <TouchableOpacity
          style={estilos.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalAparenciaVisivel(false)}
        />
        <BlurView intensity={80} tint={escuro ? 'dark' : 'light'} style={estilos.modalCard}>
          <View style={estilos.modalHandle} />
          <Text style={estilos.modalTitulo}>Preferências de Aparência</Text>

          {['OLED Preto Puro', 'Liquid Glass Dark', 'Modo Automático (Sistema)'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[estilos.itemSelect, temaSelecionado === t && estilos.itemSelectAtivo]}
              onPress={() => setTemaSelecionado(t)}
            >
              <Text style={estilos.txtSelectTitulo}>{t}</Text>
              {temaSelecionado === t && (
                <SymbolView name="checkmark.circle.fill" size={20} tintColor={cores.destaque} />
              )}
            </TouchableOpacity>
          ))}

          <View style={estilos.modalAcoes}>
            <TouchableOpacity
              onPress={() => setModalAparenciaVisivel(false)}
              style={estilos.btnSalvar}
            >
              <Text style={estilos.txtSalvar}>Concluído</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>

      {/* Modal Inspector JSON Dev */}
      <VisualizadorJSONModal
        visivel={modalJSONVisivel}
        aoFechar={() => setModalJSONVisivel(false)}
        dadosTaco={rawTaco}
        dadosExerciseDB={rawExerciseDB}
        carregando={carregandoJSON}
        erro={erroJSON}
        aoTentarDeNovo={lidarComAbrirInspectorJSON}
      />
    </View>
  );
}

const criarEstilos = (cores: CoresTema) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: cores.fundo },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: Espacamento.sm, // o título grande fica no header nativo
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
      backgroundColor: cores.elevada,
      borderWidth: 1,
      borderColor: cores.separador,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    avatarTexto: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Tipografia.titulo2,
      fontWeight: PesoFonte.bold,
      color: cores.texto,
      letterSpacing: 1,
    },
    nome: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.titulo,
      fontWeight: PesoFonte.bold,
      color: cores.texto,
    },
    email: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Fonte.label,
      color: cores.textoSecundario,
      marginTop: 3,
    },

    secaoTitulo: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.label,
      fontWeight: PesoFonte.bold,
      color: cores.textoSecundario,
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
      color: cores.textoSecundario,
    },
    dadoValor: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.subtitulo,
      fontWeight: PesoFonte.bold,
      color: cores.texto,
      marginTop: 2,
    },
    divisor: {
      height: 1,
      backgroundColor: cores.separador,
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
      color: cores.texto,
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
      borderBottomColor: cores.separador,
    },
    iconeOpcaoContainer: {
      width: 36,
      height: 36,
      borderRadius: Raio.sm,
      backgroundColor: cores.elevada,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tituloOpcao: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.corpo,
      fontWeight: PesoFonte.bold,
      color: cores.texto,
    },
    subOpcao: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Fonte.micro,
      color: cores.textoSecundario,
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
      color: cores.textoSecundario,
    },
    versao: {
      fontFamily: FamiliaFonte.regular,
      textAlign: 'center',
      fontSize: Fonte.micro,
      color: cores.textoSecundario,
    },

    // Modal & Sheet
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
    modalHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: cores.separador,
      alignSelf: 'center',
      marginBottom: 16,
    },
    modalCard: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      backgroundColor: cores.elevada,
      borderTopWidth: 1,
      borderColor: cores.separador,
    },
    modalTitulo: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.subtitulo,
      color: cores.texto,
      marginBottom: 20,
    },
    rowSwitch: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: cores.destaqueSuave,
    },
    txtSwitchTitulo: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.corpo,
      color: cores.texto,
    },
    txtSwitchSub: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Fonte.micro,
      color: cores.textoSecundario,
      marginTop: 2,
    },
    itemSelect: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      backgroundColor: cores.elevada,
      borderRadius: Raio.md,
      marginBottom: 10,
    },
    itemSelectAtivo: {
      borderWidth: 1,
      borderColor: cores.destaque,
    },
    txtSelectTitulo: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.corpo,
      color: cores.texto,
    },
    txtSelectSub: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Fonte.micro,
      color: cores.textoSecundario,
      marginTop: 2,
    },
    modalAcoes: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 },
    btnSalvar: {
      backgroundColor: cores.destaque,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: Raio.md,
    },
    txtSalvar: {
      fontFamily: FamiliaFonte.bold,
      color: cores.textoSobreDestaque,
      fontSize: Fonte.corpo,
    },
  });
