import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { Espacamento, FamiliaFonte } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';

interface Props {
  valor: number;
  min: number;
  max: number;
  aoMudar: (novo: number) => void;
  /** Rótulo lido pelo VoiceOver (ex.: "Refeições por dia"). */
  rotulo: string;
}

/** Número grande com – e + de 56 pt, sem teclado. */
export function Stepper({ valor, min, max, aoMudar, rotulo }: Props) {
  const { cores } = useTema();
  const mudar = (novo: number) => {
    if (novo < min || novo > max) return;
    Haptics.selectionAsync();
    aoMudar(novo);
  };
  const botao = (nome: 'minus' | 'plus', rotuloBotao: string, novo: number, bloqueado: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotuloBotao}
      accessibilityState={{ disabled: bloqueado }}
      disabled={bloqueado}
      onPress={() => mudar(novo)}
      style={[estilos.botao, { backgroundColor: cores.elevada }, bloqueado && { opacity: 0.4 }]}
    >
      <SymbolView name={nome} size={24} weight="bold" tintColor={cores.texto} />
    </Pressable>
  );
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={rotulo}
      accessibilityValue={{ min, max, now: valor }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) =>
        mudar(valor + (e.nativeEvent.actionName === 'increment' ? 1 : -1))
      }
      style={estilos.linha}
    >
      {botao('minus', 'Diminuir', valor - 1, valor <= min)}
      <Text style={[estilos.numero, { color: cores.texto }]}>{valor}</Text>
      {botao('plus', 'Aumentar', valor + 1, valor >= max)}
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espacamento.xxxl,
  },
  botao: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numero: {
    fontFamily: FamiliaFonte.bold,
    fontSize: 72,
    minWidth: 96,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
});
