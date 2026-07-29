// ============================================================
// TELA: Overview do Planejamento (app/questionario/resultado.tsx)
// ============================================================
// Clean Dark UI — Padrão do FitApp (Tokens de Cor, Tipografia e Vidro).
// Exibe a síntese do planejamento gerado com nós visuais e timeline vertical,
// sem emojis, utilizando exclusivamente a biblioteca SF Symbols.
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { BlurView } from 'expo-blur';
import { CardVidro, BotaoPrimario } from '../../componentes/ui';
import { Cores, Espacamento, FamiliaFonte, Fonte, PesoFonte, Raio } from '../../constantes/Cores';
import { formatarAgua } from '@fitapp/utilidades';
import { repositorioPlano } from '../../servicos/repositorio';
import type { PlanoIAGerado } from '@fitapp/tipos';

export default function TelaResultadoQuestionario() {
  const router = useRouter();
  const { plano, respostas } = useLocalSearchParams<{ plano: string; respostas?: string }>();
  const [salvando, setSalvando] = useState(false);

  // Parse dos dados do plano gerado e das respostas do questionário
  const dadosPlano: PlanoIAGerado | null = plano ? JSON.parse(plano) : null;
  const dadosRespostas = respostas ? JSON.parse(respostas) : null;

  const resumo = dadosPlano?.resumo || {
    tmb: 1847,
    tdee: 2400,
    caloriasAlvo: 2400,
    macros: { proteinas: 160, carboidratos: 280, gorduras: 72 },
    metaAguaMl: 3200,
  };

  const refeicoes = dadosPlano?.dieta?.refeicoes || [
    { nome: 'Café da Manhã', horario: '07:30', alimentos: [] },
    { nome: 'Almoço', horario: '12:30', alimentos: [] },
    { nome: 'Jantar', horario: '19:30', alimentos: [] },
  ];

  const diasTreino = dadosPlano?.treino?.dias || [
    { diaSemana: 1, nome: 'Push', exercicios: [{ nome: 'Supino', series: 4, repeticoes: 10, descansoSegundos: 60 }] },
    { diaSemana: 2, nome: 'Pull', exercicios: [{ nome: 'Puxada', series: 4, repeticoes: 10, descansoSegundos: 60 }] },
    { diaSemana: 3, nome: 'Legs', exercicios: [{ nome: 'Agachamento', series: 4, repeticoes: 10, descansoSegundos: 90 }] },
  ];

  const aceitarEIniciar = async () => {
    setSalvando(true);
    try {
      if (dadosPlano) {
        await repositorioPlano.salvarPlanoComoAtivo(dadosPlano, dadosRespostas);
      }
      setSalvando(false);
      router.replace('/(tabs)/inicio');
    } catch {
      setSalvando(false);
      Alert.alert('Erro', 'Não foi possível salvar seu plano ativo. Tente novamente.');
    }
  };

  const ajustarRespostas = () => {
    router.push({
      pathname: '/questionario',
      params: {
        dadosFormulario: respostas || JSON.stringify(dadosRespostas || {}),
      },
    });
  };

  return (
    <View style={estilos.container}>
      <ScrollView contentContainerStyle={estilos.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── 1. Árvore de Nós Metríca ── */}
        <View style={estilos.noHeaderContainer}>
          {/* Nó Central Superior com SF Symbol */}
          <View style={estilos.noCentralOrb}>
            <SymbolView name="sparkles" size={24} tintColor={Cores.accent} weight="bold" />
          </View>

          {/* Linhas Conectoras */}
          <View style={estilos.noLinhasContainer}>
            <View style={estilos.linhaDiagonalEsq} />
            <View style={estilos.linhaDiagonalEsqMeio} />
            <View style={estilos.linhaDiagonalDirMeio} />
            <View style={estilos.linhaDiagonalDir} />
          </View>

          <View style={estilos.linhaHorizontalConectora} />

          {/* 4 Nós de Métricas (Kcal, Proteína, Carbos, Gordura) */}
          <View style={estilos.rowNosMetricas}>
            {[
              { valor: resumo.caloriasAlvo, label: 'kcal' },
              { valor: resumo.macros.proteinas, label: 'P (g)' },
              { valor: resumo.macros.carboidratos, label: 'C (g)' },
              { valor: resumo.macros.gorduras, label: 'G (g)' },
            ].map((item, i) => (
              <View key={i} style={estilos.noItem}>
                <View style={estilos.noCirculo}>
                  <Text style={estilos.noValor}>{item.valor}</Text>
                </View>
                <Text style={estilos.noLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── 2. Timeline Vertical com Cards da Paleta do App ── */}
        <View style={estilos.timelineWrapper}>
          <View style={estilos.timelineLinhaVertical} />

          <View style={estilos.timelineItemsContainer}>

            {/* Refeições */}
            <View style={estilos.timelineRow}>
              <View style={estilos.timelineNode}>
                <View style={estilos.nodeDot} />
              </View>

              <CardVidro semBorda estilo={estilos.cardTimelinePill}>
                <View style={estilos.iconePillContainer}>
                  <SymbolView name="fork.knife" size={18} tintColor={Cores.accent} />
                </View>

                <View style={estilos.colTextosPill}>
                  <Text style={estilos.tituloPill}>{refeicoes.length} refeições</Text>
                  <Text style={estilos.subtituloPill}>Personalizadas para seu objetivo</Text>
                </View>

                <View style={estilos.checkmarkCircle}>
                  <SymbolView name="checkmark" size={12} tintColor={Cores.accent} weight="bold" />
                </View>
              </CardVidro>
            </View>

            {/* Treinos */}
            {diasTreino.map((dia, idx) => (
              <View key={idx} style={estilos.timelineRow}>
                <View style={estilos.timelineNode}>
                  <View style={estilos.nodeDot} />
                </View>

                <CardVidro semBorda estilo={estilos.cardTimelinePill}>
                  <View style={estilos.iconePillContainer}>
                    <SymbolView name="dumbbell.fill" size={18} tintColor={Cores.accent} />
                  </View>

                  <View style={estilos.colTextosPill}>
                    <Text style={estilos.tituloPill}>{dia.nome}</Text>
                    <Text style={estilos.subtituloPill}>{dia.exercicios.length} exercícios</Text>
                  </View>

                  <View style={estilos.checkmarkCircle}>
                    <SymbolView name="checkmark" size={12} tintColor={Cores.accent} weight="bold" />
                  </View>
                </CardVidro>
              </View>
            ))}

            {/* Hidratação */}
            <View style={estilos.timelineRow}>
              <View style={estilos.timelineNode}>
                <View style={estilos.nodeDot} />
              </View>

              <CardVidro semBorda estilo={estilos.cardTimelinePill}>
                <View style={estilos.iconePillContainer}>
                  <SymbolView name="drop.fill" size={18} tintColor={Cores.accent} />
                </View>

                <View style={estilos.colTextosPill}>
                  <Text style={estilos.tituloPill}>Hidratação</Text>
                  <Text style={estilos.subtituloPill}>Meta de {formatarAgua(resumo.metaAguaMl)} por dia</Text>
                </View>

                <View style={estilos.checkmarkCircle}>
                  <SymbolView name="checkmark" size={12} tintColor={Cores.accent} weight="bold" />
                </View>
              </CardVidro>
            </View>

          </View>
        </View>

        {/* ── 3. Observações / Comentários da IA ── */}
        {dadosPlano?.comentarios && dadosPlano.comentarios.length > 0 && (
          <View style={estilos.secaoComentarios}>
            <View style={estilos.headerComentariosRow}>
              <SymbolView name="lightbulb.fill" size={18} tintColor={Cores.accent} />
              <Text style={estilos.secaoTituloComentario}>Observações da IA</Text>
            </View>
            <CardVidro semBorda estilo={estilos.cardComentarios}>
              {dadosPlano.comentarios.map((item, idx) => (
                <View key={idx} style={estilos.itemComentario}>
                  <Text style={estilos.bulletComentario}>•</Text>
                  <Text style={estilos.textoComentario}>{item}</Text>
                </View>
              ))}
            </CardVidro>
          </View>
        )}

      </ScrollView>

      {/* ── 4. Floating Action Footer ── */}
      <BlurView intensity={90} tint="dark" style={estilos.floatingFooter}>
        <BotaoPrimario
          texto={salvando ? 'Ativando seu plano...' : 'Aceitar Planejamento'}
          aoPresionar={aceitarEIniciar}
          carregando={salvando}
          estilo={estilos.botaoAceitarNativo}
        />

        <TouchableOpacity
          style={estilos.btnAjustarRespostasNativo}
          onPress={ajustarRespostas}
          disabled={salvando}
          activeOpacity={0.7}
        >
          <Text style={estilos.txtAjustarRespostasNativo}>Ajustar respostas</Text>
        </TouchableOpacity>
      </BlurView>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Cores.fundo.principal,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 160,
  },

  // ── Árvore de Nós ──────────────────────────────
  noHeaderContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10,
  },
  noCentralOrb: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Cores.accentSuave,
    borderWidth: 1.5,
    borderColor: Cores.accentBorda,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  noLinhasContainer: {
    width: '80%',
    height: 24,
    position: 'relative',
    marginTop: -2,
  },
  linhaDiagonalEsq: {
    position: 'absolute',
    left: '10%',
    top: 0,
    width: 2,
    height: 24,
    backgroundColor: Cores.borda.sutil,
    transform: [{ rotate: '45deg' }],
  },
  linhaDiagonalEsqMeio: {
    position: 'absolute',
    left: '35%',
    top: 0,
    width: 2,
    height: 24,
    backgroundColor: Cores.borda.sutil,
    transform: [{ rotate: '15deg' }],
  },
  linhaDiagonalDirMeio: {
    position: 'absolute',
    right: '35%',
    top: 0,
    width: 2,
    height: 24,
    backgroundColor: Cores.borda.sutil,
    transform: [{ rotate: '-15deg' }],
  },
  linhaDiagonalDir: {
    position: 'absolute',
    right: '10%',
    top: 0,
    width: 2,
    height: 24,
    backgroundColor: Cores.borda.sutil,
    transform: [{ rotate: '-45deg' }],
  },
  linhaHorizontalConectora: {
    width: '84%',
    height: 2,
    backgroundColor: Cores.accent,
    marginTop: -2,
    marginBottom: -16,
    zIndex: 1,
    opacity: 0.6,
  },
  rowNosMetricas: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    zIndex: 5,
  },
  noItem: {
    alignItems: 'center',
  },
  noCirculo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Cores.fundo.elevada,
    borderWidth: 1.5,
    borderColor: Cores.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noValor: {
    fontFamily: FamiliaFonte.bold,
    fontSize: 14,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
  },
  noLabel: {
    fontFamily: FamiliaFonte.regular,
    fontSize: 11,
    color: Cores.texto.secundario,
    marginTop: 6,
  },

  // ── Timeline Vertical ──────────────────────────────
  timelineWrapper: {
    position: 'relative',
    paddingLeft: 12,
  },
  timelineLinhaVertical: {
    position: 'absolute',
    left: 19,
    top: 16,
    bottom: 16,
    width: 2,
    backgroundColor: Cores.accent,
    opacity: 0.4,
  },
  timelineItemsContainer: {
    gap: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineNode: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Cores.fundo.principal,
    borderWidth: 2,
    borderColor: Cores.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    zIndex: 5,
  },
  nodeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Cores.accent,
  },

  // Cards da Timeline (Compactos)
  cardTimelinePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Raio.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  iconePillContainer: {
    width: 32,
    height: 32,
    borderRadius: Raio.sm,
    backgroundColor: Cores.accentSuave,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  colTextosPill: {
    flex: 1,
  },
  tituloPill: {
    fontFamily: FamiliaFonte.bold,
    fontSize: 14,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
  },
  subtituloPill: {
    fontFamily: FamiliaFonte.regular,
    fontSize: 11,
    color: Cores.texto.secundario,
    marginTop: 1,
  },
  checkmarkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Cores.accentBorda,
    backgroundColor: Cores.accentSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Comentários da IA
  secaoComentarios: {
    marginTop: 24,
  },
  headerComentariosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  secaoTituloComentario: {
    fontFamily: FamiliaFonte.bold,
    fontSize: Fonte.subtitulo,
    color: Cores.texto.principal,
  },
  cardComentarios: {
    padding: Espacamento.md,
  },
  itemComentario: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bulletComentario: {
    color: Cores.accent,
    marginRight: 6,
    fontSize: 14,
  },
  textoComentario: {
    fontFamily: FamiliaFonte.regular,
    fontSize: Fonte.label,
    color: Cores.texto.principal,
    flex: 1,
    lineHeight: 18,
  },

  // Floating Action Footer
  floatingFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    backgroundColor: 'rgba(8, 10, 14, 0.95)',
    borderTopWidth: 1,
    borderTopColor: Cores.borda.sutil,
    alignItems: 'center',
  },
  botaoAceitarNativo: {
    width: '100%',
    height: 52,
    borderRadius: Raio.md,
    marginBottom: 10,
  },
  btnAjustarRespostasNativo: {
    paddingVertical: 8,
  },
  txtAjustarRespostasNativo: {
    fontFamily: FamiliaFonte.semibold,
    fontSize: Fonte.label,
    color: Cores.texto.secundario,
  },
});
