// ============================================================
// COMPONENTE: AnelProgresso (Progress Ring)
// ============================================================
// Indicador circular de progresso em SVG — Clean Dark UI.
// Suporta a tipografia arredondada SF Compact Rounded.
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { FamiliaFonte, PesoFonte, Tipografia } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';

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

  const { cores } = useTema();
  const corStroke = cor || cores.destaque;
  const restante = Math.max(meta - atual, 0);

  const textoAbaixo = subtextoCustom
    ? subtextoCustom
    : mostrarRestante
      ? `${restante}${unidade} restam`
      : `/${meta}${unidade}`;

  return (
    <View
      style={estilos.container}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${titulo ? `${titulo}: ` : ''}${atual}${unidade} de ${meta}${unidade}`}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(porcentagem * 100) }}
    >
      {titulo ? (
        <Text style={[estilos.tituloLabel, { color: cores.textoSecundario }]}>{titulo}</Text>
      ) : null}

      <View style={[estilos.ringWrapper, { width: tamanho, height: tamanho }]}>
        <Svg width={tamanho} height={tamanho}>
          {/* Track de fundo escuro */}
          <Circle
            cx={tamanho / 2}
            cy={tamanho / 2}
            r={raio}
            stroke={cores.destaqueSuave}
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
          <View style={[estilos.valorCentralContainer, { width: tamanho - 2 * espessura - 4 }]}>
            <Text
              style={[
                estilos.valorTexto,
                {
                  fontSize: tamanho > 80 ? Tipografia.titulo3 : Tipografia.legenda,
                  color: cores.texto,
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {atual}
            </Text>
          </View>
        )}
      </View>

      {textoAbaixo ? (
        <Text style={[estilos.metaTexto, { color: cores.texto }]}>{textoAbaixo}</Text>
      ) : null}
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
    fontSize: Tipografia.legenda,
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
    fontVariant: ['tabular-nums'],
  },
  metaTexto: {
    fontFamily: FamiliaFonte.bold,
    fontSize: Tipografia.legenda,
    fontWeight: PesoFonte.bold,
    marginTop: 8,
    textAlign: 'center',
  },
});
