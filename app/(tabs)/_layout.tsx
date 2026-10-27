// Abas nativas (UITabBarController): vidro no iOS 26+, encolhe ao rolar.
// API instável do SDK 54 (expo-router/unstable-native-tabs), aprovada no PLANO.md.
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTema } from '@/compartilhado/useTema';

export default function LayoutTabs() {
  const { cores } = useTema();
  return (
    <NativeTabs tintColor={cores.destaque} minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="inicio">
        <Label>Início</Label>
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="treino">
        <Label>Treino</Label>
        <Icon sf={{ default: 'dumbbell', selected: 'dumbbell.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="dieta">
        <Label>Dieta</Label>
        <Icon sf={{ default: 'fork.knife', selected: 'fork.knife' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="perfil">
        <Label>Perfil</Label>
        <Icon sf={{ default: 'person', selected: 'person.fill' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
