import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { Espacamento, FamiliaFonte, Raio, Tipografia } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';

interface Props {
  rotulo: string;
  /** Linha pequena sob o rótulo (ex.: "dias"). */
  legenda?: string;
  selecionado: boolean;
  /** Multiescolha usa checkbox; escolha única usa radio. */
  multipla?: boolean;
  /** Versão alta (64 pt) para poucas opções lado a lado. */
  alto?: boolean;
  aoPressionar: () => void;
}

/** Opção curta (chip). Selecionado: borda lima + check, não só cor. */
export function ChipOpcao({ rotulo, legenda, selecionado, multipla, alto, aoPressionar }: Props) {
  const { cores } = useTema();
  return (
    <Pressable
      accessibilityRole={multipla ? 'checkbox' : 'radio'}
      accessibilityLabel={legenda ? `${rotulo} ${legenda}` : rotulo}
      accessibilityState={{ checked: selecionado }}
      onPress={() => {
        Haptics.selectionAsync();
        aoPressionar();
      }}
      style={[
        estilos.chip,
        {
          minHeight: alto ? 64 : 48,
          backgroundColor: cores.superficie,
          borderColor: cores.separador,
        },
        selecionado && { borderColor: cores.destaque, backgroundColor: cores.destaqueSuave },
      ]}
    >
      {selecionado ? (
        <SymbolView name="checkmark" size={14} weight="bold" tintColor={cores.destaqueTexto} />
      ) : null}
      <Text style={[estilos.rotulo, { color: cores.texto }]}>{rotulo}</Text>
      {legenda ? (
        <Text style={[estilos.legenda, { color: cores.textoSecundario }]}>{legenda}</Text>
      ) : null}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  chip: {
    minWidth: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espacamento.sm,
    paddingHorizontal: Espacamento.xl,
    borderRadius: Raio.xl,
    borderWidth: 2,
  },
  rotulo: { fontFamily: FamiliaFonte.semibold, fontSize: Tipografia.destaque },
  legenda: { fontFamily: FamiliaFonte.regular, fontSize: Tipografia.rodape },
});
