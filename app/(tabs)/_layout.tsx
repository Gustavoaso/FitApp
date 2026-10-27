// ============================================================
// LAYOUT: Tab Bar Flutuante Estilo Instagram (app/(tabs)/_layout.tsx)
// ============================================================
// Barra cápsula escura flutuante com pílula ativa deslizante (Animated.spring 100% nativo).
// Design idêntico ao Instagram com animação fluida e zero erros.
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  Platform,
  View,
  TouchableOpacity,
  StyleSheet,
  LayoutChangeEvent,
  Animated,
} from 'react-native';
import { SymbolView, SymbolViewProps } from 'expo-symbols';
import { Cores } from '../../constantes/Cores';

const SIMBOLOS = {
  inicio: { inativo: 'house', ativo: 'house.fill' },
  treino: { inativo: 'dumbbell', ativo: 'dumbbell.fill' },
  dieta: { inativo: 'apple.logo', ativo: 'apple.logo' },
  perfil: { inativo: 'person', ativo: 'person.fill' },
} as const;

function CustomInstagramTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const animValue = useRef(new Animated.Value(state.index)).current;

  const numTabs = state.routes.length;
  const paddingHorizontal = 6;
  const usableWidth = containerWidth > 0 ? containerWidth - paddingHorizontal * 2 : 0;
  const tabWidth = numTabs > 0 ? usableWidth / numTabs : 0;

  // Efeito de mola animado ao mudar de tab
  useEffect(() => {
    Animated.spring(animValue, {
      toValue: state.index,
      useNativeDriver: true,
      tension: 68,
      friction: 10,
    }).start();
  }, [state.index, animValue]);

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  // Interpolação da posição horizontal da pílula ativa
  const translateX = animValue.interpolate({
    inputRange: state.routes.map((_, i) => i),
    outputRange: state.routes.map((_, i) => i * tabWidth + paddingHorizontal),
  });

  return (
    <View style={estilos.tabBarContainer} onLayout={handleLayout}>
      {/* Capsule Ativo Deslizante (Estilo Instagram) */}
      {containerWidth > 0 && tabWidth > 0 && (
        <Animated.View
          style={[
            estilos.slidingCapsuleWrapper,
            {
              width: tabWidth,
              transform: [{ translateX }],
            },
          ]}
        >
          <View style={estilos.slidingCapsuleInner} />
        </Animated.View>
      )}

      {/* Itens das Tabs */}
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const routeName = route.name as keyof typeof SIMBOLOS;
        const simbolos = SIMBOLOS[routeName] || { inativo: 'square', ativo: 'square.fill' };

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.7}
            style={estilos.tabItem}
          >
            <SymbolView
              name={(isFocused ? simbolos.ativo : simbolos.inativo) as NonNullable<SymbolViewProps['name']>}
              size={22}
              tintColor={isFocused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.45)'}
              weight={isFocused ? 'bold' : 'regular'}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function LayoutTabs() {
  return (
    <Tabs
      tabBar={(props) => <CustomInstagramTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="inicio" />
      <Tabs.Screen name="treino" />
      <Tabs.Screen name="dieta" />
      <Tabs.Screen name="perfil" />
    </Tabs>
  );
}

const TAB_BAR_HEIGHT = 56;

const estilos = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 20,
    right: 20,
    height: TAB_BAR_HEIGHT,
    borderRadius: 32,
    backgroundColor: '#0E1015',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 12,
  },
  slidingCapsuleWrapper: {
    position: 'absolute',
    height: TAB_BAR_HEIGHT - 12, // 44px
    justifyContent: 'center',
    alignItems: 'center',
    top: 6,
    left: 0,
  },
  slidingCapsuleInner: {
    width: '92%',
    height: '100%',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  tabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});
