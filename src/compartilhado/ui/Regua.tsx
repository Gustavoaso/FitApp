import React, { useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type ScrollViewInstance,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Espacamento, FamiliaFonte, Tipografia } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';

const PASSO = 10; // px por unidade

interface Props {
  valor: number;
  min: number;
  max: number;
  unidade: string;
  rotulo: string;
  aoMudar: (novo: number) => void;
}

/** Régua horizontal com encaixe e haptic de seleção a cada marca. */
export function Regua({ valor, min, max, unidade, rotulo, aoMudar }: Props) {
  const { cores } = useTema();
  const rolagem = useRef<ScrollViewInstance>(null);
  const [largura, setLargura] = useState(0);
  const [atual, setAtual] = useState(valor);
  const marcas = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const margem = Math.max(0, largura / 2 - PASSO / 2);

  const valorDe = (e: { nativeEvent: NativeScrollEvent }) =>
    min + Math.max(0, Math.min(max - min, Math.round(e.nativeEvent.contentOffset.x / PASSO)));

  const mudar = (novo: number) => {
    if (novo < min || novo > max) return;
    rolagem.current?.scrollTo({ x: (novo - min) * PASSO, animated: true });
    setAtual(novo);
    aoMudar(novo);
  };

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={rotulo}
      accessibilityValue={{ min, max, now: valor, text: `${valor} ${unidade}` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) =>
        mudar(valor + (e.nativeEvent.actionName === 'increment' ? 1 : -1))
      }
      style={estilos.caixa}
    >
      <Text style={[estilos.rotulo, { color: cores.textoSecundario }]}>{rotulo.toUpperCase()}</Text>
      <Text style={[estilos.valor, { color: cores.texto }]}>
        {atual}
        <Text style={[estilos.unidade, { color: cores.textoSecundario }]}> {unidade}</Text>
      </Text>
      <View
        onLayout={(e) => {
          const l = e.nativeEvent.layout.width;
          setLargura(l);
          rolagem.current?.scrollTo({ x: (valor - min) * PASSO, animated: false });
        }}
      >
        <ScrollView
          ref={rolagem}
          testID={`regua-${rotulo}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={PASSO}
          decelerationRate="fast"
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingHorizontal: margem }}
          onScroll={(e) => {
            const v = valorDe(e);
            if (v !== atual) {
              setAtual(v);
              Haptics.selectionAsync();
            }
          }}
          onMomentumScrollEnd={(e) => aoMudar(valorDe(e))}
          onScrollEndDrag={(e) => aoMudar(valorDe(e))}
        >
          {marcas.map((n) => (
            <View key={n} style={estilos.marca}>
              <View
                style={[
                  estilos.traco,
                  { backgroundColor: n % 10 === 0 ? cores.texto : cores.separador },
                  n % 10 === 0 && estilos.tracoLongo,
                ]}
              />
              {n % 10 === 0 ? (
                <Text numberOfLines={1} style={[estilos.numero, { color: cores.textoSecundario }]}>
                  {n}
                </Text>
              ) : null}
            </View>
          ))}
        </ScrollView>
        <View pointerEvents="none" style={[estilos.agulha, { backgroundColor: cores.destaque }]} />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: { gap: Espacamento.xs },
  rotulo: { fontFamily: FamiliaFonte.semibold, fontSize: Tipografia.rodape, letterSpacing: 1 },
  valor: { fontFamily: FamiliaFonte.bold, fontSize: 40, fontVariant: ['tabular-nums'] },
  unidade: { fontFamily: FamiliaFonte.medio, fontSize: Tipografia.titulo3 },
  marca: { width: PASSO, height: 64, alignItems: 'center' },
  traco: { width: 2, height: 20, borderRadius: 1 },
  tracoLongo: { height: 36 },
  // Texto de 40 pt centrado no traço de 10 pt (left = -15).
  numero: {
    position: 'absolute',
    top: 40,
    left: -15,
    width: 40,
    textAlign: 'center',
    fontSize: Tipografia.rodape,
  },
  agulha: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -2,
    width: 4,
    height: 44,
    borderRadius: 2,
  },
});
