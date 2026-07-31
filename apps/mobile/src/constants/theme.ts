import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#FFFFFF',
    textSecondary: '#D6D6D6',
    background: '#141417',
    card: '#1E1E24',
    inputBackground: '#18181C',
    border: '#2C2C34',
    primary: '#D4AF37',
    primaryText: '#141417',
    success: '#34C759',
    error: '#FF373C',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#D6D6D6',
    background: '#141417',
    card: '#1E1E24',
    inputBackground: '#18181C',
    border: '#2C2C34',
    primary: '#D4AF37',
    primaryText: '#141417',
    success: '#34C759',
    error: '#FF373C',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
  },
} as const;

export type ThemeColor = keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
