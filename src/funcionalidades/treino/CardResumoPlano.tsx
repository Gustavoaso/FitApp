// Resumo da semana: treinos feitos x meta, em segmentos (mockup treino v1).
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CardVidro } from '@/compartilhado/ui';
import { CoresTema, FamiliaFonte, Tipografia } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';

interface Props {
  feitos: number;
  meta: number;
}

export function CardResumoPlano({ feitos, meta }: Props) {
  const { cores } = useTema();
  const estilos = useMemo(() => criarEstilos(cores), [cores]);
  // Sem meta não há o que mostrar (nada de número inventado).
  if (meta <= 0) return null;

  const segmentos = Math.min(meta, 7);
  const feitosVisiveis = Math.min(Math.max(feitos, 0), meta);
  const faltam = meta - feitosVisiveis;
  const resumo = `${feitosVisiveis} de ${meta} treinos feitos esta semana`;

  return (
    <CardVidro semBorda estilo={estilos.card} rotuloAcessibilidade={resumo}>
      <View style={estilos.topo}>
        <Text style={estilos.titulo}>Treinos da semana</Text>
        <Text style={estilos.contagem}>
          <Text style={estilos.numero}>{feitosVisiveis}</Text> de {meta}
        </Text>
      </View>
      <View style={estilos.segmentos}>
        {Array.from({ length: segmentos }, (_, i) => (
          <View
            key={i}
            style={[estilos.segmento, i < feitosVisiveis && { backgroundColor: cores.destaque }]}
          />
        ))}
      </View>
      <Text style={estilos.rodape}>
        {faltam === 0
          ? 'Meta da semana atingida'
          : `Faltam ${faltam} ${faltam === 1 ? 'treino' : 'treinos'} esta semana`}
      </Text>
    </CardVidro>
  );
}

const criarEstilos = (cores: CoresTema) =>
  StyleSheet.create({
    card: { marginBottom: 12 },
    topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
    titulo: {
      flex: 1,
      fontFamily: FamiliaFonte.semibold,
      fontSize: Tipografia.destaque,
      color: cores.texto,
    },
    contagem: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Tipografia.rodape,
      color: cores.textoSecundario,
    },
    numero: { fontFamily: FamiliaFonte.bold, fontSize: Tipografia.titulo1, color: cores.texto },
    segmentos: { flexDirection: 'row', gap: 6, marginTop: 12 },
    segmento: { flex: 1, height: 6, borderRadius: 3, backgroundColor: cores.separador },
    rodape: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Tipografia.rodape,
      color: cores.textoSecundario,
      marginTop: 8,
    },
  });
