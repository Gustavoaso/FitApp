// ============================================================
// COMPONENTE: BotaoPrimario
// ============================================================
// Botão principal do app com gradiente roxo, border-radius alto
// e animação de press (escala 0.97 + feedback háptico).
//
// Usado para ações principais: "Começar Agora", "Concluir Série",
// "Registrar Refeição", etc.
//
// CONCEITOS IMPORTANTES:
// - LinearGradient: componente que cria um degradê (transição
//   suave entre duas cores). Aqui, vai do roxo ao roxo-claro.
// - Pressable: componente do React Native que detecta toques.
//   Diferente do Button, permite estilização total.
// - Haptics: vibração sutil ao tocar o botão, dando feedback
//   tátil que o usuário mal percebe conscientemente mas que
//   torna a experiência mais "sólida".
// ============================================================

import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Cores, Raio, Espacamento, Fonte, PesoFonte } from '../../constantes/Cores';

/** Props do BotaoPrimario */
interface BotaoPrimarioProps {
  /** Texto exibido no botão */
  texto: string;
  /** Função chamada ao pressionar */
  aoPresionar: () => void;
  /** Se true, mostra um spinner e desabilita o botão */
  carregando?: boolean;
  /** Se true, desabilita o botão (fica opaco) */
  desabilitado?: boolean;
  /** Estilos extras para o container (opcional) */
  estilo?: ViewStyle;
  /** Estilos extras para o texto (opcional) */
  estiloTexto?: TextStyle;
}

/**
 * BotaoPrimario — Botão com gradiente e feedback háptico.
 *
 * Uso:
 * ```tsx
 * <BotaoPrimario
 *   texto="Começar Agora"
 *   aoPresionar={() => console.log('Clicou!')}
 * />
 * ```
 */
export function BotaoPrimario({
  texto,
  aoPresionar,
  carregando = false,
  desabilitado = false,
  estilo,
  estiloTexto,
}: BotaoPrimarioProps) {
  const estaDesabilitado = desabilitado || carregando;

  /** Ao pressionar, vibra sutilmente e executa a ação */
  const lidarComPressionar = () => {
    if (estaDesabilitado) return;
    // HapticFeedbackStyle.Light = vibração sutil
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    aoPresionar();
  };

  return (
    <Pressable
      onPress={lidarComPressionar}
      disabled={estaDesabilitado}
      style={({ pressed }) => [
        estilos.container,
        // Quando pressionado: diminui levemente a escala (efeito de "afundar")
        pressed && !estaDesabilitado && estilos.pressionado,
        estaDesabilitado && estilos.desabilitado,
        estilo,
      ]}
    >
      <LinearGradient
        colors={[Cores.primaria.gradienteInicio, Cores.primaria.gradienteFim]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={estilos.gradiente}
      >
        {carregando ? (
          <ActivityIndicator color={Cores.texto.principal} size="small" />
        ) : (
          <Text style={[estilos.texto, estiloTexto]}>{texto}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  container: {
    borderRadius: Raio.lg,
    overflow: 'hidden',
    // Sombra colorida
    shadowColor: Cores.primaria.base,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  gradiente: {
    paddingVertical: Espacamento.lg,
    paddingHorizontal: Espacamento.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: {
    color: Cores.texto.principal,
    fontSize: Fonte.corpo,
    fontWeight: PesoFonte.bold,
  },
  pressionado: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  desabilitado: {
    opacity: 0.5,
  },
});
