// Estante de medalhas (RN22) no Perfil: ganhas em destaque, as outras apagadas.
// O estado não depende só de cor: cada medalha tem o rótulo "conquistada" ou "bloqueada".
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { Espacamento, FamiliaFonte, Tipografia } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import { CONQUISTAS } from '@/compartilhado/utilidades/gamificacao';
import { CardVidro } from './CardVidro';

export function EstanteConquistas({ conquistadas }: { conquistadas: string[] }) {
  const { cores } = useTema();
  return (
    <CardVidro>
      <Text style={[estilos.titulo, { color: cores.texto }]}>Conquistas</Text>
      <View style={estilos.grade}>
        {Object.entries(CONQUISTAS).map(([codigo, c]) => {
          const ganha = conquistadas.includes(codigo);
          return (
            <View
              key={codigo}
              accessible
              accessibilityLabel={`${c.titulo}, ${ganha ? 'conquistada' : 'bloqueada'}. ${c.descricao}`}
              style={[estilos.item, { opacity: ganha ? 1 : 0.4 }]}
            >
              <View
                style={[
                  estilos.medalha,
                  { backgroundColor: ganha ? cores.destaque : cores.destaqueSuave },
                ]}
              >
                <SymbolView
                  name={(ganha ? c.simbolo : 'lock') as SFSymbol}
                  size={20}
                  tintColor={ganha ? cores.textoSobreDestaque : cores.textoSecundario}
                />
              </View>
              <Text style={[estilos.rotulo, { color: cores.texto }]} numberOfLines={2}>
                {c.titulo}
              </Text>
            </View>
          );
        })}
      </View>
    </CardVidro>
  );
}

const estilos = StyleSheet.create({
  titulo: {
    fontFamily: FamiliaFonte.semibold,
    fontSize: Tipografia.destaque,
    marginBottom: Espacamento.md,
  },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacamento.md },
  item: { width: '30%', alignItems: 'center', gap: Espacamento.xs },
  medalha: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rotulo: { fontFamily: FamiliaFonte.medio, fontSize: Tipografia.rodape, textAlign: 'center' },
});
