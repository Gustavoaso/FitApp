// ============================================================
// COMPONENTE: AnelProgresso (Progress Ring)
// ============================================================
// Indicador circular de progresso em SVG — Clean Dark UI.
// Stroke fino, cor accent única, sem gradiente colorido, sem glow.
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Cores, PesoFonte } from '../../constantes/Cores';

export interface PropsAnelProgresso {
  titulo?: string;
  atual: number;
  meta: number;
  unidade?: string;
  cor?: string;
  corGradienteInicio?: string;
  corGradienteFim?: string;
  tamanho?: number;
  espessura?: number;
  mostrarRestante?: boolean;
  mostrarValor?: boolean;
}

export function AnelProgresso({
  titulo,
  atual,
  meta,
  unidade = '',
  cor,
  tamanho = 80,
  espessura = 4,
  mostrarRestante = false,
  mostrarValor = true,
}: PropsAnelProgresso) {
  const raio = (tamanho - espessura) / 2;
  const circunferencia = 2 * Math.PI * raio;
  const porcentagem = Math.min(Math.max(atual / (meta || 1), 0), 1);
  const strokeDashoffset = circunferencia * (1 - porcentagem);

  const corStroke = cor || Cores.accent;
  const restante = Math.max(meta - atual, 0);

  return (
    <View style={estilos.container}>
      {titulo ? <Text style={estilos.tituloLabel}>{titulo}</Text> : null}

      <View style={[estilos.ringWrapper, { width: tamanho, height: tamanho }]}>
        <Svg width={tamanho} height={tamanho}>
          {/* Track de fundo */}
          <Circle
            cx={tamanho / 2}
            cy={tamanho / 2}
            r={raio}
            stroke="rgba(255, 255, 255, 0.06)"
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
            <Text style={[estilos.valorTexto, { fontSize: tamanho > 90 ? 22 : 13 }]} numberOfLines={1}>
              {atual}
            </Text>
            {unidade ? (
              <Text style={[estilos.unidadeTexto, { fontSize: tamanho > 90 ? 11 : 9 }]}>
                {unidade}
              </Text>
            ) : null}
          </View>
        )}
      </View>

      {titulo && (
        <Text style={estilos.metaTexto}>
          {mostrarRestante ? `${restante}${unidade} faltam` : `/${meta}${unidade}`}
        </Text>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloLabel: {
    fontSize: 10,
    color: Cores.texto.secundario,
    fontWeight: PesoFonte.medio,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
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
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
  },
  unidadeTexto: {
    color: Cores.texto.secundario,
    fontWeight: PesoFonte.medio,
    marginTop: -1,
  },
  metaTexto: {
    fontSize: 10,
    color: Cores.texto.desabilitado,
    fontWeight: PesoFonte.medio,
    marginTop: 4,
  },
});
