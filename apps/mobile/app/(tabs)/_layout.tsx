// ============================================================
// LAYOUT DA TAB BAR: (app/(tabs)/_layout.tsx)
// ============================================================
// Bottom Navigation flutuante em Liquid Glass (iOS 26 HIG).
// Ícones minimalistas sem texto, destaque na cor primária e blur sutil.
// ============================================================

import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Cores, Raio } from '../../constantes/Cores';
import {
  IconeInicio,
  IconeTreino,
  IconeDieta,
  IconePerfil,
} from '../../componentes/ui/IconesNavegacao';

function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={estilos.containerFloating}>
      <BlurView intensity={85} tint="dark" style={estilos.glassPill}>
        <View style={estilos.tabRow}>
          {state.routes.map((route: any, index: number) => {
            const isFocused = state.index === index;

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

            const cor = isFocused ? Cores.primaria.base : 'rgba(255, 255, 255, 0.38)';

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                activeOpacity={0.7}
                style={estilos.tabItem}
              >
                <View style={estilos.iconWrapper}>
                  {route.name === 'inicio' && <IconeInicio cor={cor} tamanho={22} />}
                  {route.name === 'treino' && <IconeTreino cor={cor} tamanho={22} />}
                  {route.name === 'dieta' && <IconeDieta cor={cor} tamanho={22} />}
                  {route.name === 'perfil' && <IconePerfil cor={cor} tamanho={22} />}

                  {isFocused && <View style={estilos.pontoIndicador} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

export default function LayoutTabs() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="inicio" options={{ title: 'Início' }} />
      <Tabs.Screen name="treino" options={{ title: 'Treino' }} />
      <Tabs.Screen name="dieta" options={{ title: 'Dieta' }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}

const estilos = StyleSheet.create({
  containerFloating: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassPill: {
    width: '100%',
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  tabRow: {
    flexDirection: 'row',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 36,
  },
  pontoIndicador: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Cores.primaria.base,
    shadowColor: Cores.primaria.base,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
});
