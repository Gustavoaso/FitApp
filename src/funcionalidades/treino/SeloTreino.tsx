// Foto do treino com o selo TreinaAI por cima (RN21). É esta View que vira imagem
// (react-native-view-shot), então as cores são fixas: o selo fica igual no claro e no escuro.
import React from 'react';
import { Image, StyleSheet, Text, View, type HostInstance } from 'react-native';
import { FamiliaFonte, LIMA } from '@/compartilhado/tema';
import {
  montarNumerosSelo,
  type FormatoSelo,
  type ModeloSelo,
  type ResumoSessao,
} from './selo-treino';

const BRANCO = '#FFFFFF';
const FUNDO_MARCA = '#0B0B0D';

interface PropsSeloTreino {
  resumo: ResumoSessao;
  modelo: ModeloSelo;
  formato: FormatoSelo;
  /** Sem foto: cartão com o fundo da marca. */
  fotoUri: string | null;
  /** React 19: ref como prop; é o alvo da captura. */
  ref?: React.Ref<HostInstance>;
}

function Marca({ pequena }: { pequena?: boolean }) {
  return (
    <View style={estilos.marca}>
      <Image
        source={require('../../../assets/images/icon.png')}
        style={pequena ? estilos.iconePequeno : estilos.icone}
        accessibilityIgnoresInvertColors
      />
      <Text style={[estilos.textoMarca, pequena && estilos.textoMarcaPequena]}>
        TREINA<Text style={{ color: LIMA }}>AI</Text>
      </Text>
    </View>
  );
}

export function SeloTreino({ resumo, modelo, formato, fotoUri, ref }: PropsSeloTreino) {
  const numeros = montarNumerosSelo(resumo);
  const resumoTexto = `${resumo.nomeTreino}, ${numeros.map((n) => `${n.rotulo} ${n.valor}`).join(', ')}`;

  return (
    <View
      ref={ref}
      collapsable={false}
      accessible
      accessibilityLabel={`Selo TreinaAI: ${resumoTexto}`}
      style={[estilos.quadro, { aspectRatio: formato === '9:16' ? 9 / 16 : 4 / 5 }]}
    >
      {fotoUri ? (
        <>
          <Image source={{ uri: fotoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          {/* Véu escuro: números brancos legíveis sobre qualquer foto. */}
          <View style={[StyleSheet.absoluteFill, estilos.veu]} />
        </>
      ) : (
        <View style={[StyleSheet.absoluteFill, estilos.semFoto]}>
          <View style={estilos.brilhoMarca} />
        </View>
      )}

      {modelo === 'coluna' ? (
        <View style={estilos.coluna}>
          <Text style={estilos.nomeColuna} numberOfLines={2}>
            {resumo.nomeTreino}
          </Text>
          {numeros.map((n) => (
            <View key={n.rotulo} style={estilos.itemColuna}>
              <Text style={estilos.rotuloColuna}>{n.rotulo}</Text>
              <Text style={estilos.valorColuna}>{n.valor}</Text>
            </View>
          ))}
          <Marca />
        </View>
      ) : (
        <View style={estilos.faixa}>
          <View style={estilos.topoFaixa}>
            <Text style={estilos.nomeFaixa} numberOfLines={1}>
              {resumo.nomeTreino}
            </Text>
            <Marca pequena />
          </View>
          <View style={estilos.linhaFaixa}>
            {numeros.map((n) => (
              <View key={n.rotulo} style={estilos.itemFaixa}>
                <Text style={estilos.valorFaixa}>{n.valor}</Text>
                <Text style={estilos.rotuloFaixa}>{n.rotulo}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const sombraTexto = {
  textShadowColor: 'rgba(0, 0, 0, 0.45)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 6,
};

const estilos = StyleSheet.create({
  quadro: { width: '100%', overflow: 'hidden', backgroundColor: FUNDO_MARCA, borderRadius: 20 },
  veu: { backgroundColor: 'rgba(0, 0, 0, 0.22)' },
  semFoto: { backgroundColor: FUNDO_MARCA, alignItems: 'center', justifyContent: 'center' },
  brilhoMarca: {
    width: '90%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: LIMA,
    opacity: 0.08,
  },
  marca: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icone: { width: 30, height: 30, borderRadius: 7 },
  iconePequeno: { width: 22, height: 22, borderRadius: 5 },
  textoMarca: {
    color: BRANCO,
    fontFamily: FamiliaFonte.bold,
    fontSize: 18,
    letterSpacing: 1,
    ...sombraTexto,
  },
  textoMarcaPequena: { fontSize: 14 },
  // Modelo "coluna": números grandes empilhados, no espírito do Strava.
  coluna: { position: 'absolute', left: 24, bottom: 28, right: 24, gap: 14 },
  nomeColuna: {
    color: BRANCO,
    fontFamily: FamiliaFonte.semibold,
    fontSize: 20,
    ...sombraTexto,
  },
  itemColuna: { gap: 0 },
  rotuloColuna: {
    color: BRANCO,
    fontFamily: FamiliaFonte.medio,
    fontSize: 13,
    opacity: 0.9,
    ...sombraTexto,
  },
  valorColuna: {
    color: BRANCO,
    fontFamily: FamiliaFonte.bold,
    fontSize: 38,
    fontVariant: ['tabular-nums'],
    ...sombraTexto,
  },
  // Modelo "faixa": barra compacta no rodapé.
  faixa: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: 'rgba(11, 11, 13, 0.72)',
    borderTopWidth: 3,
    borderTopColor: LIMA,
  },
  topoFaixa: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  nomeFaixa: { flex: 1, color: BRANCO, fontFamily: FamiliaFonte.semibold, fontSize: 16 },
  linhaFaixa: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  itemFaixa: { flex: 1 },
  valorFaixa: {
    color: BRANCO,
    fontFamily: FamiliaFonte.bold,
    fontSize: 20,
    fontVariant: ['tabular-nums'],
  },
  rotuloFaixa: { color: BRANCO, opacity: 0.75, fontFamily: FamiliaFonte.regular, fontSize: 11 },
});
