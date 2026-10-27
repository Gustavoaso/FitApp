// Opções de navegação usadas pelas pilhas das abas (título grande nativo da HIG).
import type { CoresTema } from '@/compartilhado/tema';

// Tipo inferido: @react-navigation/native-stack não é dependência direta do projeto.
export function opcoesPilhaAba(cores: CoresTema) {
  return {
    headerLargeTitle: true,
    headerShadowVisible: false,
    headerLargeTitleShadowVisible: false,
    headerStyle: { backgroundColor: cores.fundo },
    headerTitleStyle: { color: cores.texto },
    headerLargeTitleStyle: { color: cores.texto },
    headerTintColor: cores.destaque,
    contentStyle: { backgroundColor: cores.fundo },
  };
}
