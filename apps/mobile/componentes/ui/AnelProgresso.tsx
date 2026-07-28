// ============================================================
// COMPONENTE: AnelProgresso (Progress Ring)
// ============================================================
// Indicador circular de progresso em SVG — Clean Dark UI.
// Suporta a tipografia arredondada SF Compact Rounded.
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Cores, FamiliaFonte, PesoFonte } from '../../constantes/Cores';

export interface PropsAnelProgresso {
  titulo?: string;
  atual: number;
  meta: number;
  unidade?: string;
  cor?: string;
  tamanho?: number;
  espessura?: number;
  mostrarRestante?: boolean;
  mostrarValor?: boolean;
  subtextoCustom?: string;
}

export function AnelProgresso({
  titulo,
  atual,
  meta,
  unidade = '',
  cor,
  tamanho = 60,
  espessura = 4,
  mostrarRestante = true,
  mostrarValor = true,
  subtextoCustom,
}: PropsAnelProgresso) {
  const raio = (tamanho - espessura) / 2;
  const circunferencia = 2 * Math.PI * raio;
  const porcentagem = Math.min(Math.max(atual / (meta || 1), 0), 1);
  const strokeDashoffset = circunferencia * (1 - porcentagem);

  const corStroke = cor || Cores.accent;
  const restante = Math.max(meta - atual, 0);

  const textoAbaixo = subtextoCustom
    ? subtextoCustom
    : mostrarRestante
      ? `${restante}${unidade} restam`
      : `/${meta}${unidade}`;

  return (
    <View style={estilos.container}>
      {titulo ? <Text style={estilos.tituloLabel}>{titulo}</Text> : null}

      <View style={[estilos.ringWrapper, { width: tamanho, height: tamanho }]}>
        <Svg width={tamanho} height={tamanho}>
          {/* Track de fundo escuro */}
          <Circle
            cx={tamanho / 2}
            cy={tamanho / 2}
            r={raio}
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth={espessura}
            fill="transparent"
          />

          {/* Progresso ativo */}
          <Circle
            cx={tamanho / 2}
            cy={tamanho / 2}
            r={raio}
            stroke={corStroke}
            strokeWidth={espessura}
            strokeDasharray={circunferencia}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            transform={`rotate(-90 ${tamanho / 2} ${tamanho / 2})`}
          />
        </Svg>

        {/* Valor Central */}
        {mostrarValor && (
          <View style={estilos.valorCentralContainer}>
            <Text
              style={[
                estilos.valorTexto,
                { fontSize: tamanho > 80 ? 20 : 13 },
              ]}
              numberOfLines={1}
            >
              {atual}
            </Text>
          </View>
        )}
      </View>

      {textoAbaixo ? <Text style={estilos.metaTexto}>{textoAbaixo}</Text> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloLabel: {
    fontFamily: FamiliaFonte.medio,
    fontSize: 12,
    color: Cores.texto.secundario,
    marginBottom: 8,
  },
  ringWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  valorCentralContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valorTexto: {
    fontFamily: FamiliaFonte.bold,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
  },
  metaTexto: {
    fontFamily: FamiliaFonte.bold,
    fontSize: 11,
    color: Cores.texto.principal,
    fontWeight: PesoFonte.bold,
    marginTop: 8,
  },
});
