// ============================================================
// TELA: Dashboard / Início (app/(tabs)/inicio.tsx)
// ============================================================
// Clean Dark UI — referência Oura / WHOOP / Fitbod.
// Hierarquia clara: saudação compacta → métricas → hidratação → treino.
// Sem emojis, sem glow colorido, única accent color (#3B82F6).
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { CardVidro, AnelProgresso, BotaoPrimario } from '../../componentes/ui';
import { Cores, Espacamento, FamiliaFonte, Fonte, PesoFonte, Raio } from '../../constantes/Cores';

export default function TelaInicio() {
  const router = useRouter();

  const [caloriasConsumidas] = useState(1847);
  const [caloriasMeta] = useState(2400);

  const [proteina] = useState(124);
  const [proteinaMeta] = useState(160);

  const [carboidrato] = useState(198);
  const [carboidratoMeta] = useState(280);

  const [gordura] = useState(52);
  const [gorduraMeta] = useState(72);

  const [coposAgua, setCoposAgua] = useState(5);
  const totalCopos = 8;

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  const diaSemana = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const diasemana = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);

  const porcentagemCalorias = Math.round((caloriasConsumidas / caloriasMeta) * 100);

  return (
    <View style={estilos.container}>
      <ScrollView
        contentContainerStyle={estilos.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Cabeçalho ─────────────────────────────────────── */}
        <View style={estilos.cabecalho}>
          <View>
            <Text style={estilos.saudacao}>{saudacao}</Text>
            <Text style={estilos.dataAtual}>{diasemana}</Text>
          </View>
        </View>

        {/* ── Card Principal: Calorias (compacto) ──────────── */}
        <CardVidro estilo={estilos.cardCalorias}>
          <View style={estilos.rowCalorias}>
            {/* Anel menor — não dominando a tela */}
            <AnelProgresso
              atual={caloriasConsumidas}
              meta={caloriasMeta}
              tamanho={88}
              espessura={5}
              mostrarValor={true}
            />

            <View style={estilos.colInfoCalorias}>
              <Text style={estilos.labelCalorias}>Calorias hoje</Text>
              <Text style={estilos.valorCalorias}>{caloriasConsumidas.toLocaleString()}</Text>
              <Text style={estilos.metaCalorias}>meta {caloriasMeta.toLocaleString()} kcal</Text>

              {/* Barra de progresso fina */}
              <View style={estilos.barraFundo}>
                <View
                  style={[
                    estilos.barraProgresso,
                    { width: `${porcentagemCalorias}%` },
                  ]}
                />
              </View>
              <Text style={estilos.textoPorcentagem}>{porcentagemCalorias}% concluído</Text>
            </View>
          </View>
        </CardVidro>

        {/* ── Macronutrientes ───────────────────────────────── */}
        <Text style={estilos.secaoTitulo}>Macronutrientes</Text>
        <View style={estilos.gridMacros}>
          {[
        { icone: <SymbolView name="fork.knife" size={16} tintColor={Cores.texto.secundario} />, nome: 'Proteína', atual: proteina, meta: proteinaMeta },
          { icone: <SymbolView name="leaf" size={16} tintColor={Cores.texto.secundario} />, nome: 'Carbos', atual: carboidrato, meta: carboidratoMeta },
          { icone: <SymbolView name="drop" size={16} tintColor={Cores.texto.secundario} />, nome: 'Gordura', atual: gordura, meta: gorduraMeta },
          ].map((macro, i) => (
            <CardVidro key={i} estilo={estilos.cardMacro}>
              <View style={estilos.rowMacroTopo}>
                {macro.icone}
                <Text style={estilos.macroNome}>{macro.nome}</Text>
              </View>
              <Text style={estilos.macroValor}>{macro.atual}<Text style={estilos.macroUnidade}>g</Text></Text>
              <View style={estilos.barraFundoMacro}>
                <View
                  style={[
                    estilos.barraProgressoMacro,
                    { width: `${Math.min((macro.atual / macro.meta) * 100, 100)}%` },
                  ]}
                />
              </View>
              <Text style={estilos.macroMeta}>/{macro.meta}g</Text>
            </CardVidro>
          ))}
        </View>

        {/* ── Hidratação ────────────────────────────────────── */}
        <Text style={estilos.secaoTitulo}>Hidratação</Text>
        <CardVidro estilo={estilos.cardAgua}>
          <View style={estilos.rowAguaTopo}>
            <View style={estilos.rowAguaInfo}>
              <SymbolView name="drop.fill" size={18} tintColor={Cores.accent} />
              <Text style={estilos.aguaLabel}>Meta de Água</Text>
            </View>
            <Text style={estilos.aguaValor}>
              {coposAgua * 250}
              <Text style={estilos.aguaUnidade}> / {totalCopos * 250}ml</Text>
            </Text>
          </View>

          <View style={estilos.dotsAgua}>
            {Array.from({ length: totalCopos }).map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => i === coposAgua && setCoposAgua(coposAgua + 1)}
                style={[
                  estilos.dotAgua,
                  i < coposAgua && estilos.dotAguaPreenchido,
                ]}
              />
            ))}
          </View>

          <View style={estilos.rowAguaBotao}>
            <TouchableOpacity
              style={estilos.botaoMaisAgua}
              onPress={() => coposAgua < totalCopos && setCoposAgua(coposAgua + 1)}
              activeOpacity={0.7}
            >
              <Text style={estilos.textoBotaoMaisAgua}>+ 250ml</Text>
            </TouchableOpacity>
            <Text style={estilos.textoCoposAgua}>{coposAgua} de {totalCopos} copos</Text>
          </View>
        </CardVidro>

        {/* ── Próxima Sessão de Treino ──────────────────────── */}
        <Text style={estilos.secaoTitulo}>Próxima Sessão</Text>
        <CardVidro estilo={estilos.cardTreino}>
          <View style={estilos.rowTreino}>
            <View style={estilos.colTreino}>
              <Text style={estilos.badgeTreino}>HOJE</Text>
              <Text style={estilos.treinoTitulo}>Peito & Tríceps</Text>
              <Text style={estilos.treinoSub}>4 exercícios · ~45 min</Text>
            </View>
            <View style={estilos.iconeTreinoContainer}>
              <SymbolView name="bolt.fill" size={20} tintColor={Cores.accent} />
            </View>
          </View>

          <BotaoPrimario
            texto="Iniciar Treino"
            aoPresionar={() => router.push('/treino-ao-vivo')}
            estilo={estilos.botaoIniciar}
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 120,
  },

  // Cabeçalho
  cabecalho: {
    marginBottom: 24,
  },
  saudacao: {
    fontFamily: FamiliaFonte.bold,
    fontSize: Fonte.titulo,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
  },
  dataAtual: {
    fontFamily: FamiliaFonte.regular,
    fontSize: Fonte.label,
    color: Cores.texto.secundario,
    marginTop: 3,
  },

  // Card Calorias
  cardCalorias: {
    marginBottom: 24,
  },
  rowCalorias: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  colInfoCalorias: {
    flex: 1,
  },
  labelCalorias: {
    fontFamily: FamiliaFonte.semibold,
    fontSize: Fonte.micro,
    color: Cores.texto.secundario,
    fontWeight: PesoFonte.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  valorCalorias: {
    fontFamily: FamiliaFonte.bold,
    fontSize: Fonte.display,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
    letterSpacing: -0.5,
  },
  metaCalorias: {
    fontFamily: FamiliaFonte.regular,
    fontSize: Fonte.micro,
    color: Cores.texto.desabilitado,
    marginBottom: 10,
  },
  barraFundo: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 5,
  },
  barraProgresso: {
    height: '100%',
    backgroundColor: Cores.accent,
    borderRadius: 2,
  },
  textoPorcentagem: {
    fontFamily: FamiliaFonte.regular,
    fontSize: Fonte.micro,
    color: Cores.texto.secundario,
  },

  // Macros
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
  gridMacros: {
    flexDirection: 'row',
    gap: Espacamento.sm,
    marginBottom: 24,
  },
  cardMacro: {
    flex: 1,
    padding: Espacamento.md,
  },
  rowMacroTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  macroNome: {
    fontSize: Fonte.micro,
    color: Cores.texto.secundario,
    fontWeight: PesoFonte.medio,
  },
  macroValor: {
    fontSize: 18,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
  },
  macroUnidade: {
    fontSize: Fonte.micro,
    color: Cores.texto.secundario,
    fontWeight: PesoFonte.regular,
  },
  barraFundoMacro: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 1,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 4,
  },
  barraProgressoMacro: {
    height: '100%',
    backgroundColor: Cores.accent,
    borderRadius: 1,
  },
  macroMeta: {
    fontSize: Fonte.micro,
    color: Cores.texto.desabilitado,
  },

  // Água
  cardAgua: {
    marginBottom: 24,
  },
  rowAguaTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  rowAguaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aguaLabel: {
    fontSize: Fonte.corpo,
    fontWeight: PesoFonte.semibold,
    color: Cores.texto.principal,
  },
  aguaValor: {
    fontSize: Fonte.corpo,
    fontWeight: PesoFonte.bold,
    color: Cores.accent,
  },
  aguaUnidade: {
    fontWeight: PesoFonte.regular,
    color: Cores.texto.secundario,
    fontSize: Fonte.label,
  },
  dotsAgua: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  dotAgua: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dotAguaPreenchido: {
    backgroundColor: Cores.accent,
  },
  rowAguaBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  botaoMaisAgua: {
    backgroundColor: Cores.accentSuave,
    borderWidth: 1,
    borderColor: Cores.accentBorda,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Raio.sm,
  },
  textoBotaoMaisAgua: {
    fontSize: Fonte.label,
    color: Cores.accent,
    fontWeight: PesoFonte.semibold,
  },
  textoCoposAgua: {
    fontSize: Fonte.micro,
    color: Cores.texto.desabilitado,
  },

  // Card Treino
  cardTreino: {
    marginBottom: 24,
  },
  rowTreino: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Espacamento.lg,
  },
  colTreino: {
    flex: 1,
  },
  badgeTreino: {
    fontSize: Fonte.micro,
    fontWeight: PesoFonte.bold,
    color: Cores.accent,
    letterSpacing: 1,
    marginBottom: 4,
  },
  treinoTitulo: {
    fontSize: Fonte.subtitulo,
    fontWeight: PesoFonte.semibold,
    color: Cores.texto.principal,
  },
  treinoSub: {
    fontSize: Fonte.label,
    color: Cores.texto.secundario,
    marginTop: 3,
  },
  iconeTreinoContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Cores.accentSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoIniciar: {
    // margem herdada
  },
});
