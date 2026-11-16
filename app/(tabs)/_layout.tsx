// Abas nativas (UITabBarController): vidro no iOS 26+, encolhe ao rolar.
// API estável desde o SDK 58 (expo-router/native-tabs); Label e Icon ficam em NativeTabs.Trigger.
import { NativeTabs } from 'expo-router/native-tabs';
import { useTema } from '@/compartilhado/useTema';

export default function LayoutTabs() {
  const { cores } = useTema();
  return (
    <NativeTabs tintColor={cores.destaqueTexto} minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="inicio">
        <NativeTabs.Trigger.Label>Início</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="treino">
        <NativeTabs.Trigger.Label>Treino</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'dumbbell', selected: 'dumbbell.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="dieta">
        <NativeTabs.Trigger.Label>Dieta</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'fork.knife', selected: 'fork.knife' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="grupos">
        <NativeTabs.Trigger.Label>Grupos</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person.3', selected: 'person.3.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="comunidade">
        <NativeTabs.Trigger.Label>Comunidade</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{
            default: 'bubble.left.and.bubble.right',
            selected: 'bubble.left.and.bubble.right.fill',
          }}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
