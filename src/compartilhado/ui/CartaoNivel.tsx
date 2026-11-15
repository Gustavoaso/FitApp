// Cartão de nível e sequência semanal (RN22) na tela Início.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Espacamento, FamiliaFonte, Tipografia } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import { NumeroContado } from '@/compartilhado/movimento';
import {
  formatarSemanas,
  progressoNivel,
  type ResumoGamificacao,
} from '@/compartilhado/utilidades/gamificacao';
import { CardVidro } from './CardVidro';

export function CartaoNivel({ resumo }: { resumo: ResumoGamificacao }) {
  const { cores } = useTema();
  const pct = progressoNivel(resumo);
  const falta =
    resumo.xpProximoNivel === null ? null : Math.max(0, resumo.xpProximoNivel - resumo.xp);
  const sequencia =
    resumo.semanasSeguidas > 0
      ? `${formatarSemanas(resumo.semanasSeguidas)} seguidas`
      : 'Cumpra a semana para começar a sequência';
  const rotulo = `Nível ${resumo.nivel}, ${resumo.nomeNivel}, ${resumo.xp} pontos. ${sequencia}.`;

  return (
    <CardVidro rotuloAcessibilidade={rotulo}>
      <View style={estilos.topo}>
        <View>
          <Text style={[estilos.nivel, { color: cores.texto }]}>Nível {resumo.nivel}</Text>
          <Text style={[estilos.nome, { color: cores.destaqueTexto }]}>{resumo.nomeNivel}</Text>
        </View>
        <Text style={[estilos.xp, { color: cores.texto }]}>
          <NumeroContado valor={resumo.xp} formatar={(n) => `${n} XP`} />
        </Text>
      </View>
      <View style={[estilos.trilho, { backgroundColor: cores.separador }]}>
        <View style={[estilos.preenchido, { width: `${pct}%`, backgroundColor: cores.destaque }]} />
      </View>
      <Text style={[estilos.legenda, { color: cores.textoSecundario }]}>
        {falta === null ? 'Nível máximo' : `Faltam ${falta} XP para o próximo nível`}
      </Text>
      <Text style={[estilos.legenda, { color: cores.texto }]}>{sequencia}</Text>
    </CardVidro>
  );
}

const estilos = StyleSheet.create({
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nivel: { fontFamily: FamiliaFonte.bold, fontSize: Tipografia.titulo2 },
  nome: { fontFamily: FamiliaFonte.semibold, fontSize: Tipografia.subtitulo },
  xp: {
    fontFamily: FamiliaFonte.bold,
    fontSize: Tipografia.titulo3,
    fontVariant: ['tabular-nums'],
  },
  trilho: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: Espacamento.md,
  },
  preenchido: { height: 8, borderRadius: 4 },
  legenda: { fontFamily: FamiliaFonte.regular, fontSize: Tipografia.rodape, marginTop: 2 },
});
