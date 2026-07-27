// ============================================================
// COMPONENTE: AnelProgresso
// ============================================================
// Anel circular (tipo "anel de atividade" do Apple Watch)
// que mostra progresso de 0 a 100%.
//
// Usado no dashboard para calorias, macros e água.
//
// CONCEITOS IMPORTANTES:
// - SVG (Scalable Vector Graphics): formato de imagem vetorial
//   que permite desenhar formas geométricas com código.
//   Diferente de JPG/PNG, não perde qualidade ao ampliar.
// - <Circle>: elemento SVG que desenha um círculo.
//   Usamos dois: um para o "trilho" (cinza) e outro para
//   o preenchimento (colorido, proporcional ao progresso).
// - strokeDasharray + strokeDashoffset: propriedades SVG que
//   permitem desenhar "linhas tracejadas". Ajustando o offset,
//   controlamos quanto do círculo está preenchido.
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Cores, Fonte, PesoFonte } from '../../constantes/Cores';

/** Props do AnelProgresso */
interface AnelProgressoProps {
  /** Valor atual (ex: calorias consumidas) */
  atual: number;
  /** Valor meta (ex: calorias alvo) */
  meta: number;
  /** Tamanho do anel em pixels (largura e altura) */
  tamanho?: number;
  /** Espessura da linha do anel */
  espessura?: number;
  /** Cor do preenchimento */
  cor?: string;
  /** Label curto exibido abaixo do valor (ex: "kcal", "g") */
  unidade?: string;
  /** Se true, exibe o valor numérico no centro */
  mostrarValor?: boolean;
}

/**
 * AnelProgresso — Anel circular de progresso.
 *
 * Uso:
 * ```tsx
 * <AnelProgresso
 *   atual={1847}
 *   meta={2400}
 *   cor={Cores.primaria.base}
 *   unidade="kcal"
 * />
 * ```
 */
export function AnelProgresso({
  atual,
  meta,
  tamanho = 120,
  espessura = 10,
  cor = Cores.primaria.base,
  unidade,
  mostrarValor = true,
}: AnelProgressoProps) {
  // Calcula o progresso (0 a 1), limitando a 100%
  const progresso = meta > 0 ? Math.min(atual / meta, 1) : 0;

  // Geometria do círculo SVG
  const raio = (tamanho - espessura) / 2;             // Raio do círculo
  const circunferencia = 2 * Math.PI * raio;           // Perímetro total
  const offset = circunferencia * (1 - progresso);     // Quanto "esconder" da linha

  return (
    <View style={[estilos.container, { width: tamanho, height: tamanho }]}>
      <Svg width={tamanho} height={tamanho}>
        {/* Trilho (fundo cinza do anel) */}
        <Circle
          cx={tamanho / 2}        // Centro X
          cy={tamanho / 2}        // Centro Y
          r={raio}                // Raio
          stroke={Cores.vidro.fundo}  // Cor do trilho
          strokeWidth={espessura}
          fill="none"             // Sem preenchimento (só a borda)
        />

        {/* Preenchimento (anel colorido proporcional ao progresso) */}
        <Circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={raio}
          stroke={cor}
          strokeWidth={espessura}
          fill="none"
          strokeLinecap="round"             // Pontas arredondadas
          strokeDasharray={circunferencia}   // Comprimento total do traço
          strokeDashoffset={offset}          // Quanto esconder
          rotation={-90}                     // Começa do topo (padrão é 3h)
          origin={`${tamanho / 2}, ${tamanho / 2}`}  // Ponto de rotação
        />
      </Svg>

      {/* Valor numérico no centro */}
      {mostrarValor && (
        <View style={estilos.valorContainer}>
          <Text style={estilos.valor}>
            {atual.toLocaleString('pt-BR')}
          </Text>
          {unidade && (
            <Text style={estilos.unidade}>{unidade}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  valorContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  valor: {
    color: Cores.texto.principal,
    fontSize: Fonte.titulo,
    fontWeight: PesoFonte.bold,
  },
  unidade: {
    color: Cores.texto.secundario,
    fontSize: Fonte.micro,
    fontWeight: PesoFonte.medio,
    marginTop: 2,
  },
});
