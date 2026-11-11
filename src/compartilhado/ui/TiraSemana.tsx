// ============================================================
// COMPONENTE: TiraSemana
// ============================================================
// Tira dom–sáb: dia selecionado em cápsula lima e um ponto por dia
// (verde = feito, lima = planejado). Alvo de toque 44 pt.
// ============================================================

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CoresTema, FamiliaFonte, Tipografia } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import { gerarSemana } from '@/compartilhado/utilidades/semana';

export type MarcaDia = 'feito' | 'planejado';

interface PropsTiraSemana {
  /** Data selecionada (YYYY-MM-DD); define qual semana aparece. */
  dataSelecionada: string;
  aoSelecionar: (data: string) => void;
  marcas?: Record<string, MarcaDia | undefined>;
}

export function TiraSemana({ dataSelecionada, aoSelecionar, marcas = {} }: PropsTiraSemana) {
  const { cores } = useTema();
  const estilos = useMemo(() => criarEstilos(cores), [cores]);
  const semana = useMemo(() => gerarSemana(dataSelecionada), [dataSelecionada]);

  return (
    <View style={estilos.linha}>
      {semana.map((dia) => {
        const ativo = dia.data === dataSelecionada;
        const marca = marcas[dia.data];
        const sufixo = marca === 'feito' ? ', feito' : marca === 'planejado' ? ', planejado' : '';
        return (
          <TouchableOpacity
            key={dia.data}
            onPress={() => aoSelecionar(dia.data)}
            activeOpacity={0.7}
            style={estilos.dia}
            accessibilityRole="button"
            accessibilityState={{ selected: ativo }}
            accessibilityLabel={`${dia.abrev} ${dia.diaNum}${sufixo}`}
          >
            <Text style={[estilos.abrev, ativo && estilos.abrevAtiva]}>{dia.abrev}</Text>
            <View style={[estilos.capsula, ativo && estilos.capsulaAtiva]}>
              <Text style={[estilos.num, ativo && estilos.numAtivo]}>{dia.diaNum}</Text>
            </View>
            <View
              style={[
                estilos.ponto,
                marca === 'feito' && { backgroundColor: cores.sucesso },
                marca === 'planejado' && { backgroundColor: cores.destaqueTexto },
                !marca && { opacity: 0 },
              ]}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const criarEstilos = (cores: CoresTema) =>
  StyleSheet.create({
    linha: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    dia: { minWidth: 44, alignItems: 'center', gap: 4 },
    abrev: {
      fontFamily: FamiliaFonte.medio,
      fontSize: Tipografia.rodape,
      color: cores.textoSecundario,
    },
    abrevAtiva: { color: cores.texto },
    capsula: {
      minWidth: 36,
      minHeight: 44,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    capsulaAtiva: { backgroundColor: cores.destaque },
    num: { fontFamily: FamiliaFonte.semibold, fontSize: Tipografia.chamada, color: cores.texto },
    numAtivo: { color: cores.textoSobreDestaque },
    ponto: { width: 5, height: 5, borderRadius: 3, backgroundColor: cores.textoSecundario },
  });
