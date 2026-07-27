// ============================================================
// LAYOUT DA TAB BAR: (app/(tabs)/_layout.tsx)
// ============================================================
// Configura as 4 abas principais do app: Início, Treino, Dieta, Perfil.
// ============================================================

import React from 'react';
import { Tabs } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import { Cores } from '../../constantes/Cores';

function TabBarIcon({ emoji }: { emoji: string }) {
  return <Text style={estilos.iconeEmoji}>{emoji}</Text>;
}

export default function LayoutTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Cores.primaria.base,
        tabBarInactiveTintColor: Cores.texto.secundario,
        tabBarStyle: {
          backgroundColor: Cores.fundo.superficie,
          borderTopColor: Cores.vidro.borda,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="inicio"
        options={{
          title: 'Início',
          tabBarIcon: () => <TabBarIcon emoji="🏠" />,
        }}
      />
      <Tabs.Screen
        name="treino"
        options={{
          title: 'Treino',
          tabBarIcon: () => <TabBarIcon emoji="🏋️" />,
        }}
      />
      <Tabs.Screen
        name="dieta"
        options={{
          title: 'Dieta',
          tabBarIcon: () => <TabBarIcon emoji="🥗" />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: () => <TabBarIcon emoji="👤" />,
        }}
      />
    </Tabs>
  );
}

const estilos = StyleSheet.create({
  iconeEmoji: {
    fontSize: 20,
  },
});
