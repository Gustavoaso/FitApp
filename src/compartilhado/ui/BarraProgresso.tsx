import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FamiliaFonte, Tipografia } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';

/** Percentual grande + barra fina. `valor` de 0 a 100. */
export function BarraProgresso({ valor, cor }: { valor: number; cor: string }) {
  const { cores } = useTema();
  const v = Math.max(0, Math.min(100, valor));
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Progresso estimado"
      accessibilityValue={{ min: 0, max: 100, now: v }}
      style={estilos.caixa}
    >
      <Text style={[estilos.pct, { color: cores.texto }]}>{v}%</Text>
      <View style={[estilos.trilho, { backgroundColor: cores.separador }]}>
        <View style={[estilos.preenchido, { width: `${v}%`, backgroundColor: cor }]} />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: { alignSelf: 'stretch', alignItems: 'center', gap: 8 },
  pct: {
    fontFamily: FamiliaFonte.bold,
    fontSize: Tipografia.titulo1,
    fontVariant: ['tabular-nums'],
  },
  trilho: { alignSelf: 'stretch', height: 6, borderRadius: 3, overflow: 'hidden' },
  preenchido: { height: 6, borderRadius: 3 },
});
