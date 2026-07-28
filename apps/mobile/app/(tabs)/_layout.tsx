// ============================================================
// LAYOUT: Tab Bar Flutuante (app/(tabs)/_layout.tsx)
// ============================================================
// Ícones nativos SF Symbols via expo-symbols (SymbolView).
// Réplica idêntica do design da referência (house, dumbbell, apple, person).
// ============================================================

import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, View, StyleSheet } from 'react-native';
import { SymbolView, SymbolViewProps } from 'expo-symbols';
import { Cores } from '../../constantes/Cores';

const SIMBOLOS = {
  inicio: { inativo: 'house', ativo: 'house.fill' },
  treino: { inativo: 'dumbbell', ativo: 'dumbbell.fill' },
  dieta: { inativo: 'apple.logo', ativo: 'apple.logo' },
  perfil: { inativo: 'person', ativo: 'person.fill' },
} as const;

interface PropsItemTab {
  focused: boolean;
  simboloInativo: NonNullable<SymbolViewProps['name']>;
  simboloAtivo: NonNullable<SymbolViewProps['name']>;
}

function ItemTab({ focused, simboloInativo, simboloAtivo }: PropsItemTab) {
  return (
    <View style={estilos.itemTab}>
      <SymbolView
        name={focused ? simboloAtivo : simboloInativo}
        size={22}
        tintColor={focused ? Cores.accent : Cores.texto.desabilitado}
        weight={focused ? 'bold' : 'regular'}
      />
      {focused && <View style={estilos.pontoAtivo} />}
    </View>
  );
}

export default function LayoutTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: estilos.tabBar,
        tabBarItemStyle: estilos.tabItem,
      }}
    >
      <Tabs.Screen
        name="inicio"
        options={{
          tabBarIcon: ({ focused }) => (
            <ItemTab
              focused={focused}
              simboloInativo={SIMBOLOS.inicio.inativo}
              simboloAtivo={SIMBOLOS.inicio.ativo}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="treino"
        options={{
          tabBarIcon: ({ focused }) => (
            <ItemTab
              focused={focused}
              simboloInativo={SIMBOLOS.treino.inativo}
              simboloAtivo={SIMBOLOS.treino.ativo}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="dieta"
        options={{
          tabBarIcon: ({ focused }) => (
            <ItemTab
              focused={focused}
              simboloInativo={SIMBOLOS.dieta.inativo}
              simboloAtivo={SIMBOLOS.dieta.ativo}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="perfil"
        options={{
          tabBarIcon: ({ focused }) => (
            <ItemTab
              focused={focused}
              simboloInativo={SIMBOLOS.perfil.inativo}
              simboloAtivo={SIMBOLOS.perfil.ativo}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const TAB_BAR_HEIGHT = 64;

const estilos = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 20,
    right: 20,
    height: TAB_BAR_HEIGHT,
    borderRadius: 32,
    borderTopWidth: 0,
    backgroundColor: '#0D0E12',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
    paddingBottom: 0,
    paddingTop: 0,
  },
  tabItem: {
    height: TAB_BAR_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 0,
  },
  itemTab: {
    alignItems: 'center',
    justifyContent: 'center',
    height: TAB_BAR_HEIGHT,
    gap: 4,
  },
  pontoAtivo: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Cores.accent,
  },
});
