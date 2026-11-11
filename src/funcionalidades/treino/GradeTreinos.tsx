// Grade de treinos do plano (mockup treino v1): 2 colunas, cada card com um neon do tema
// em gradiente suave e a letra do treino grande ao fundo. Com texto extra grande vira 1 coluna.
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CoresTema, FamiliaFonte, Tipografia, RAIO_CARTAO } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';

export interface TreinoDaGrade {
  id: string;
  foco: string;
  totalExercicios: number;
}

/** A partir deste fator de fonte (Dynamic Type grande) a grade usa 1 coluna. */
const FATOR_UMA_COLUNA = 1.3;
/** 22% de opacidade em hex, como no mockup (neon sobre o card). */
const ALFA_GRADIENTE = '38';

export function GradeTreinos({ treinos }: { treinos: TreinoDaGrade[] }) {
  const { cores } = useTema();
  const { fontScale } = useWindowDimensions();
  const estilos = useMemo(() => criarEstilos(cores), [cores]);
  const neons = [cores.destaque, cores.macros.agua, cores.macros.proteina, cores.macros.gordura];
  const umaColuna = fontScale >= FATOR_UMA_COLUNA;

  return (
    <View style={estilos.grade}>
      {treinos.map((treino, i) => {
        const neon = neons[i % neons.length];
        const letra = String.fromCharCode(65 + (i % 26));
        const exercicios = `${treino.totalExercicios} ${treino.totalExercicios === 1 ? 'exercício' : 'exercícios'}`;
        return (
          <LinearGradient
            key={treino.id}
            colors={[`${neon}${ALFA_GRADIENTE}`, cores.superficie]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.6, y: 1 }}
            style={[estilos.card, umaColuna && estilos.cardLargo]}
          >
            <Text style={[estilos.letra, { color: neon }]} importantForAccessibility="no">
              {letra}
            </Text>
            <View accessible accessibilityLabel={`Treino ${letra}, ${treino.foco}, ${exercicios}`}>
              <Text style={estilos.foco}>{treino.foco}</Text>
              <Text style={estilos.detalhe}>{exercicios}</Text>
            </View>
          </LinearGradient>
        );
      })}
    </View>
  );
}

const criarEstilos = (cores: CoresTema) =>
  StyleSheet.create({
    grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    card: {
      flexBasis: '47%',
      flexGrow: 1,
      minHeight: 168,
      borderRadius: RAIO_CARTAO,
      padding: 16,
      justifyContent: 'flex-end',
      overflow: 'hidden',
    },
    cardLargo: { flexBasis: '100%' },
    letra: {
      position: 'absolute',
      right: 12,
      top: 4,
      fontFamily: FamiliaFonte.bold,
      fontSize: 64,
      lineHeight: 72,
      opacity: 0.22,
    },
    foco: {
      fontFamily: FamiliaFonte.semibold,
      fontSize: Tipografia.destaque,
      color: cores.texto,
    },
    detalhe: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Tipografia.rodape,
      color: cores.textoSecundario,
      marginTop: 4,
    },
  });
