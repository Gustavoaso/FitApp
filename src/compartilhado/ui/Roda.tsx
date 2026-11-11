import React, { useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type ScrollViewInstance,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { FamiliaFonte, Raio, Tipografia } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';

const ALTURA_ITEM = 44;
const LINHAS = 5;

interface Props {
  valor: number;
  min: number;
  max: number;
  aoMudar: (novo: number) => void;
  rotulo: string;
}

/** Roda vertical com encaixe (snap): vale o item que parar na faixa do meio. */
export function Roda({ valor, min, max, aoMudar, rotulo }: Props) {
  const { cores } = useTema();
  const rolagem = useRef<ScrollViewInstance>(null);
  const ultimo = useRef(valor);
  const itens = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  const indice = (e: { nativeEvent: NativeScrollEvent }) =>
    Math.max(0, Math.min(max - min, Math.round(e.nativeEvent.contentOffset.y / ALTURA_ITEM)));

  const mudar = (novo: number) => {
    if (novo < min || novo > max) return;
    rolagem.current?.scrollTo({ y: (novo - min) * ALTURA_ITEM, animated: true });
    aoMudar(novo);
  };

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
      style={{ height: ALTURA_ITEM * LINHAS }}
    >
      <View
        pointerEvents="none"
        style={[estilos.faixa, { backgroundColor: cores.elevada, top: ALTURA_ITEM * 2 }]}
      />
      <ScrollView
        ref={rolagem}
        testID="roda"
        showsVerticalScrollIndicator={false}
        snapToInterval={ALTURA_ITEM}
        decelerationRate="fast"
        scrollEventThrottle={16}
        contentOffset={{ x: 0, y: (valor - min) * ALTURA_ITEM }}
        contentContainerStyle={{ paddingVertical: ALTURA_ITEM * 2 }}
        onScroll={(e) => {
          const atual = min + indice(e);
          if (atual !== ultimo.current) {
            ultimo.current = atual;
            Haptics.selectionAsync();
          }
        }}
        onMomentumScrollEnd={(e) => aoMudar(min + indice(e))}
        onScrollEndDrag={(e) => aoMudar(min + indice(e))}
      >
        {itens.map((n) => (
          <View key={n} style={estilos.item}>
            <Text
              style={[
                estilos.numero,
                { color: n === valor ? cores.texto : cores.textoSecundario },
                n === valor && estilos.numeroAtivo,
              ]}
            >
              {n}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  faixa: { position: 'absolute', left: 0, right: 0, height: ALTURA_ITEM, borderRadius: Raio.md },
  item: { height: ALTURA_ITEM, alignItems: 'center', justifyContent: 'center' },
  numero: {
    fontFamily: FamiliaFonte.medio,
    fontSize: Tipografia.titulo3,
    fontVariant: ['tabular-nums'],
  },
  numeroAtivo: { fontFamily: FamiliaFonte.bold, fontSize: Tipografia.titulo2 },
});
