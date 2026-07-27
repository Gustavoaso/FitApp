// ============================================================
// COMPONENTE: AnelProgresso (Liquid Glass Progress Ring)
// ============================================================
// Indicador circular de progresso em SVG para Calorias e Macros
// com estilo minimalista Liquid Glass, valor central e meta.
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
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
  corGradienteInicio,
  corGradienteFim,
  tamanho = 76,
  espessura = 5,
  mostrarRestante = true,
  mostrarValor = true,
}: PropsAnelProgresso) {
  const raio = (tamanho - espessura) / 2;
  const circunferencia = 2 * Math.PI * raio;
  const porcentagem = Math.min(Math.max(atual / (meta || 1), 0), 1);
  const strokeDashoffset = circunferencia * (1 - porcentagem);

  const restante = Math.max(meta - atual, 0);
  const corInicio = corGradienteInicio || cor || Cores.primaria.base;
  const corFim = corGradienteFim || cor || Cores.primaria.base;
  const gradientId = `grad_${(titulo || 'ring').replace(/\s+/g, '_')}_${tamanho}`;

  const ePequeno = tamanho <= 62;

  return (
    <View style={estilos.container}>
      {titulo ? (
        <Text style={[estilos.tituloLabel, ePequeno && estilos.tituloLabelPequeno]}>
          {titulo}
        </Text>
      ) : null}

      <View style={[estilos.ringWrapper, { width: tamanho, height: tamanho }]}>
        <Svg width={tamanho} height={tamanho}>
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={corInicio} stopOpacity={1} />
              <Stop offset="100%" stopColor={corFim} stopOpacity={1} />
            </LinearGradient>
          </Defs>

          {/* Círculo de Fundo (Track Traseiro) */}
          <Circle
            cx={tamanho / 2}
            cy={tamanho / 2}
            r={raio}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={espessura}
            fill="transparent"
          />

          {/* Círculo de Progresso Ativo */}
          <Circle
            cx={tamanho / 2}
            cy={tamanho / 2}
            r={raio}
            stroke={`url(#${gradientId})`}
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
              style={[estilos.valorTexto, ePequeno && estilos.valorTextoPequeno]}
              numberOfLines={1}
            >
              {atual}
            </Text>

            {unidade ? (
              <Text style={[estilos.unidadeTexto, ePequeno && estilos.unidadeTextoPequeno]}>
                {unidade}
              </Text>
            ) : null}
          </View>
        )}
      </View>

      {/* Meta / Restante */}
      {titulo && (
        <Text style={[estilos.metaTexto, ePequeno && estilos.metaTextoPequeno]}>
          {mostrarRestante ? `${restante}${unidade} faltam` : `Meta: ${meta}${unidade}`}
        </Text>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  tituloLabel: {
    fontSize: 11,
    color: Cores.texto.secundario,
    fontWeight: PesoFonte.semibold,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tituloLabelPequeno: {
    fontSize: 10,
    marginBottom: 4,
  },
  ringWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: '#0A0F1D',
    borderRadius: 999,
  },
  valorCentralContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valorTexto: {
    fontSize: 15,
    fontWeight: PesoFonte.extrabold,
    color: Cores.texto.principal,
  },
  valorTextoPequeno: {
    fontSize: 12,
  },
  unidadeTexto: {
    fontSize: 9,
    color: Cores.texto.desabilitado,
    fontWeight: PesoFonte.medio,
    marginTop: -2,
  },
  unidadeTextoPequeno: {
    fontSize: 8,
  },
  metaTexto: {
    fontSize: 11,
    color: Cores.texto.secundario,
    fontWeight: PesoFonte.medio,
    marginTop: 6,
  },
  metaTextoPequeno: {
    fontSize: 10,
    marginTop: 4,
    color: Cores.texto.desabilitado,
  },
});
