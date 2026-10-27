// Hook do tema: segue o modo do sistema (app.json: userInterfaceStyle automatic).
import { useColorScheme } from 'react-native';
import { CoresClaro, CoresEscuro, CoresTema } from '@/compartilhado/tema';

export interface Tema {
  escuro: boolean;
  cores: CoresTema;
}

export function useTema(): Tema {
  // Sem preferência (null) cai no escuro, a identidade original do app.
  const escuro = useColorScheme() !== 'light';
  return { escuro, cores: escuro ? CoresEscuro : CoresClaro };
}
