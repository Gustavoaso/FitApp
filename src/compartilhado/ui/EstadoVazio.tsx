// ============================================================
// COMPONENTE: EstadoVazio
// ============================================================
// Tela/área sem dados: símbolo, uma frase e a ação que resolve.
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SymbolView, SFSymbol } from 'expo-symbols';
import { Espacamento, FamiliaFonte, PesoFonte, Tipografia } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import { BotaoPrimario } from './BotaoPrimario';

interface PropsEstadoVazio {
  titulo: string;
  mensagem?: string;
  simbolo?: SFSymbol;
  textoAcao?: string;
  aoAgir?: () => void;
}

export function EstadoVazio({
  titulo,
  mensagem,
  simbolo = 'tray',
  textoAcao,
  aoAgir,
}: PropsEstadoVazio) {
  const { cores } = useTema();

  return (
    <View style={estilos.container}>
      <SymbolView
        name={simbolo}
        size={40}
        tintColor={cores.textoSecundario}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <Text accessibilityRole="header" style={[estilos.titulo, { color: cores.texto }]}>
        {titulo}
      </Text>
      {mensagem ? (
        <Text style={[estilos.mensagem, { color: cores.textoSecundario }]}>{mensagem}</Text>
      ) : null}
      {textoAcao && aoAgir ? (
        <BotaoPrimario texto={textoAcao} aoPresionar={aoAgir} estilo={estilos.botao} />
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Espacamento.xxl,
    gap: Espacamento.sm,
  },
  titulo: {
    fontFamily: FamiliaFonte.semibold,
    fontWeight: PesoFonte.semibold,
    fontSize: Tipografia.destaque,
    textAlign: 'center',
    marginTop: Espacamento.sm,
  },
  mensagem: {
    fontFamily: FamiliaFonte.regular,
    fontSize: Tipografia.subtitulo,
    textAlign: 'center',
  },
  botao: {
    marginTop: Espacamento.md,
    alignSelf: 'stretch',
  },
});
