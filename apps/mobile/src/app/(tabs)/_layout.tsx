import React from 'react';
import { Tabs } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Home, Dumbbell, CheckSquare, MessageSquare, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.dark.primary,
        tabBarInactiveTintColor: Colors.dark.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.dark.card,
          borderTopColor: Colors.dark.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="fitness"
        options={{
          title: 'Fitness',
          tabBarIcon: ({ color, size }) => <Dumbbell color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="todo"
        options={{
          title: 'To-Do',
          tabBarIcon: ({ color, size }) => <CheckSquare color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'AI Coach',
          tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
