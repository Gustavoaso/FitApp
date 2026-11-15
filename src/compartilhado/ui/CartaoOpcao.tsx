import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { usePressao } from '@/compartilhado/movimento';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { Espacamento, FamiliaFonte, RAIO_CARTAO, Tipografia } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';

const PressableAnimado = Animated.createAnimatedComponent(Pressable);

interface Props {
  titulo: string;
  descricao?: string;
  icone?: SFSymbol;
  /** Número no lugar do ícone (ex.: faixas de experiência). */
  numero?: number;
  selecionado: boolean;
  aoPressionar: () => void;
}

/** Cartão de escolha única (mín. 80 pt). Selecionado: borda lima + check, não só cor. */
export function CartaoOpcao({
  titulo,
  descricao,
  icone,
  numero,
  selecionado,
  aoPressionar,
}: Props) {
  const { cores } = useTema();
  const pressao = usePressao();
  return (
    <PressableAnimado
      onPressIn={pressao.aoPressionarDentro}
      onPressOut={pressao.aoPressionarFora}
      accessibilityRole="radio"
      accessibilityLabel={titulo}
      accessibilityHint={descricao}
      accessibilityState={{ checked: selecionado }}
      onPress={() => {
        Haptics.selectionAsync();
        aoPressionar();
      }}
      style={[
        estilos.cartao,
        {
          backgroundColor: cores.superficie,
          borderColor: selecionado ? cores.destaque : cores.separador,
        },
        selecionado && { backgroundColor: cores.destaqueSuave },
        pressao.estilo,
      ]}
    >
      <View style={[estilos.marca, { backgroundColor: cores.elevada }]}>
        {icone ? (
          <SymbolView name={icone} size={20} tintColor={cores.destaqueTexto} />
        ) : (
          <Text style={[estilos.numero, { color: cores.destaqueTexto }]}>{numero}</Text>
        )}
      </View>
      <View style={estilos.textos}>
        <Text style={[estilos.titulo, { color: cores.texto }]}>{titulo}</Text>
        {descricao ? (
          <Text style={[estilos.descricao, { color: cores.textoSecundario }]}>{descricao}</Text>
        ) : null}
      </View>
      {selecionado ? (
        <SymbolView name="checkmark.circle.fill" size={22} tintColor={cores.destaqueTexto} />
      ) : null}
    </PressableAnimado>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.lg,
    paddingHorizontal: Espacamento.lg,
    paddingVertical: Espacamento.md,
    borderRadius: RAIO_CARTAO,
    borderWidth: 2,
  },
  marca: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numero: { fontFamily: FamiliaFonte.bold, fontSize: Tipografia.destaque },
  textos: { flex: 1, gap: 2 },
  titulo: { fontFamily: FamiliaFonte.semibold, fontSize: Tipografia.destaque },
  descricao: { fontFamily: FamiliaFonte.regular, fontSize: Tipografia.subtitulo },
});
