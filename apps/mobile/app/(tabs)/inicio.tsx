// ============================================================
// TELA: Dashboard / Início (app/(tabs)/inicio.tsx)
// ============================================================
// Tela principal do app após login/questionário.
// Exibe anel de calorias, progresso de macros, meta de água
// e o card de atalho para o próximo treino.
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CardVidro, AnelProgresso, BotaoPrimario } from '../../componentes/ui';
import { Cores, Espacamento, Fonte, PesoFonte, Raio } from '../../constantes/Cores';
import { formatarCalorias, formatarGramas, formatarAgua } from '@fitapp/utilidades';

export default function TelaInicio() {
  const router = useRouter();

  // Estados simulados do progresso do dia (futuramente sincronizados com Supabase)
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

  const adicionarCopoAgua = () => {
    if (coposAgua < totalCopos) {
      setCoposAgua(coposAgua + 1);
    }
  };

  return (
    <View style={estilos.container}>
      <ScrollView contentContainerStyle={estilos.scrollContent}>
        {/* Cabeçalho */}
        <View style={estilos.cabecalho}>
          <View>
            <Text style={estilos.saudacao}>Olá, Atleta 👋</Text>
            <Text style={estilos.dataAtual}>Segunda-feira, 27 de Julho</Text>
          </View>
        </View>

        {/* Card Principal: Anel de Calorias */}
        <CardVidro estilo={estilos.cardCalorias}>
          <Text style={estilos.cardTitulo}>Resumo de Calorias</Text>
          <View style={estilos.anelContainer}>
            <AnelProgresso
              atual={caloriasConsumidas}
              meta={caloriasMeta}
              tamanho={160}
              espessura={14}
              cor={Cores.primaria.base}
              unidade={`/ ${caloriasMeta} kcal`}
            />
          </View>
        </CardVidro>

        {/* Macros */}
        <Text style={estilos.secaoTitulo}>Macronutrientes</Text>
        <View style={estilos.gridMacros}>
          {/* Proteína */}
          <CardVidro estilo={estilos.cardMacroItem}>
            <Text style={estilos.macroEmoji}>🥩</Text>
            <Text style={estilos.macroNome}>Proteína</Text>
            <Text style={estilos.macroValores}>
              {proteina} / <Text style={estilos.textMuted}>{proteinaMeta}g</Text>
            </Text>
            <View style={estilos.barFundo}>
              <View
                style={[
                  estilos.barProgresso,
                  {
                    width: `${Math.min((proteina / proteinaMeta) * 100, 100)}%`,
                    backgroundColor: Cores.feedback.sucesso,
                  },
                ]}
              />
            </View>
          </CardVidro>

          {/* Carboidrato */}
          <CardVidro estilo={estilos.cardMacroItem}>
            <Text style={estilos.macroEmoji}>🍚</Text>
            <Text style={estilos.macroNome}>Carbos</Text>
            <Text style={estilos.macroValores}>
              {carboidrato} / <Text style={estilos.textMuted}>{carboidratoMeta}g</Text>
            </Text>
            <View style={estilos.barFundo}>
              <View
                style={[
                  estilos.barProgresso,
                  {
                    width: `${Math.min((carboidrato / carboidratoMeta) * 100, 100)}%`,
                    backgroundColor: Cores.secundaria,
                  },
                ]}
              />
            </View>
          </CardVidro>

          {/* Gordura */}
          <CardVidro estilo={estilos.cardMacroItem}>
            <Text style={estilos.macroEmoji}>🥑</Text>
            <Text style={estilos.macroNome}>Gordura</Text>
            <Text style={estilos.macroValores}>
              {gordura} / <Text style={estilos.textMuted}>{gorduraMeta}g</Text>
            </Text>
            <View style={estilos.barFundo}>
              <View
                style={[
                  estilos.barProgresso,
                  {
                    width: `${Math.min((gordura / gorduraMeta) * 100, 100)}%`,
                    backgroundColor: Cores.feedback.alerta,
                  },
                ]}
              />
            </View>
          </CardVidro>
        </View>

        {/* Registro de Água */}
        <Text style={estilos.secaoTitulo}>Hidratação</Text>
        <CardVidro estilo={estilos.cardAgua}>
          <View style={estilos.rowAguaTop}>
            <Text style={estilos.cardTitulo}>Meta de Água</Text>
            <Text style={estilos.aguaTotal}>{coposAgua * 250}ml / {totalCopos * 250}ml</Text>
          </View>

          <View style={estilos.coposRow}>
            {Array.from({ length: totalCopos }).map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={adicionarCopoAgua}
                style={[
                  estilos.copoIcone,
                  index < coposAgua && estilos.copoPreenchido,
                ]}
              >
                <Text style={{ fontSize: 18 }}>💧</Text>
              </TouchableOpacity>
            ))}
          </View>
        </CardVidro>

        {/* Card do Próximo Treino */}
        <Text style={estilos.secaoTitulo}>Próxima Sessão</Text>
        <CardVidro estilo={estilos.cardTreino}>
          <View style={estilos.rowTreinoTop}>
            <View>
              <Text style={estilos.badgeTreino}>HOJE</Text>
              <Text style={estilos.treinoTitulo}>Peito + Tríceps</Text>
              <Text style={estilos.treinoSub}>4 exercícios · 45 min</Text>
            </View>
          </View>

          <BotaoPrimario
            texto="Iniciar Treino Ao Vivo ➔"
            aoPresionar={() => router.push('/treino-ao-vivo')}
            estilo={estilos.botaoIniciarTreino}
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
    padding: Espacamento.xxl,
    paddingBottom: Espacamento.xxxl * 2,
  },
  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Espacamento.xl,
    marginTop: Espacamento.md,
  },
  saudacao: {
    fontSize: Fonte.display,
    fontWeight: PesoFonte.extrabold,
    color: Cores.texto.principal,
  },
  dataAtual: {
    fontSize: Fonte.label,
    color: Cores.texto.secundario,
    marginTop: 2,
  },
  cardCalorias: {
    alignItems: 'center',
    paddingVertical: Espacamento.xl,
    marginBottom: Espacamento.xl,
  },
  cardTitulo: {
    fontSize: Fonte.subtitulo,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
    marginBottom: Espacamento.md,
  },
  anelContainer: {
    marginVertical: Espacamento.sm,
  },
  secaoTitulo: {
    fontSize: Fonte.subtitulo,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
    marginBottom: Espacamento.md,
    marginTop: Espacamento.sm,
  },
  gridMacros: {
    flexDirection: 'row',
    gap: Espacamento.md,
    marginBottom: Espacamento.xl,
  },
  cardMacroItem: {
    flex: 1,
    padding: Espacamento.md,
  },
  macroEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  macroNome: {
    fontSize: Fonte.micro,
    color: Cores.texto.secundario,
    fontWeight: PesoFonte.medio,
  },
  macroValores: {
    fontSize: Fonte.corpo,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
    marginVertical: 4,
  },
  textMuted: {
    color: Cores.texto.secundario,
    fontSize: Fonte.label,
  },
  barFundo: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  barProgresso: {
    height: '100%',
    borderRadius: 2,
  },
  cardAgua: {
    marginBottom: Espacamento.xl,
  },
  rowAguaTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Espacamento.md,
  },
  aguaTotal: {
    fontSize: Fonte.label,
    fontWeight: PesoFonte.bold,
    color: Cores.secundaria,
  },
  coposRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  copoIcone: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Cores.vidro.borda,
    opacity: 0.4,
  },
  copoPreenchido: {
    backgroundColor: 'rgba(0, 210, 255, 0.2)',
    borderColor: Cores.secundaria,
    opacity: 1,
  },
  cardTreino: {
    marginBottom: Espacamento.xl,
  },
  rowTreinoTop: {
    marginBottom: Espacamento.md,
  },
  badgeTreino: {
    fontSize: 10,
    fontWeight: PesoFonte.bold,
    color: Cores.primaria.base,
    backgroundColor: Cores.primaria.suave,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Raio.sm,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  treinoTitulo: {
    fontSize: Fonte.titulo,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
  },
  treinoSub: {
    fontSize: Fonte.label,
    color: Cores.texto.secundario,
    marginTop: 2,
  },
  botaoIniciarTreino: {
    marginTop: Espacamento.sm,
  },
});
