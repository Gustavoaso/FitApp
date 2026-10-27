// ============================================================
// TELA: Fonte de uma justificativa (app/questionario/fonte.tsx)
// ============================================================
// FormSheet aberto ao tocar numa fonte do Resultado: mostra o trecho
// da base de conhecimento que embasou o número.
// ============================================================

import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { CoresTema, Espacamento, FamiliaFonte, PesoFonte, Tipografia } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';

export default function TelaFonte() {
  const { cores } = useTema();
  const estilos = useMemo(() => criarEstilos(cores), [cores]);
  const { titulo, fonte, conteudo } = useLocalSearchParams<{
    titulo?: string;
    fonte?: string;
    conteudo?: string;
  }>();

  return (
    <ScrollView style={estilos.container} contentContainerStyle={estilos.conteudo}>
      <Text style={estilos.titulo} accessibilityRole="header">
        {titulo ?? 'Fonte'}
      </Text>
      {fonte ? <Text style={estilos.fonte}>{fonte}</Text> : null}
      {conteudo ? <Text style={estilos.texto}>{conteudo}</Text> : null}
    </ScrollView>
  );
}

const criarEstilos = (cores: CoresTema) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: cores.superficie },
    conteudo: { padding: Espacamento.xl, paddingTop: Espacamento.xxxl, gap: Espacamento.sm },
    titulo: {
      fontFamily: FamiliaFonte.bold,
      fontWeight: PesoFonte.bold,
      fontSize: Tipografia.titulo3,
      color: cores.texto,
    },
    fonte: {
      fontFamily: FamiliaFonte.medio,
      fontSize: Tipografia.subtitulo,
      color: cores.textoSecundario,
    },
    texto: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Tipografia.corpo,
      lineHeight: 24,
      color: cores.texto,
      marginTop: Espacamento.sm,
    },
  });
