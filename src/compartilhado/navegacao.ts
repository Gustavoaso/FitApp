// Opções de navegação usadas pelas pilhas das abas (título grande nativo da HIG).
import { createElement } from 'react';
import type { CoresTema } from '@/compartilhado/tema';
import { BotaoAvatar } from '@/compartilhado/ui/BotaoAvatar';

// Tipo inferido: @react-navigation/native-stack não é dependência direta do projeto.
export function opcoesPilhaAba(cores: CoresTema) {
  return {
    headerLargeTitle: true,
    // RN32: o Perfil abre pelo avatar no canto superior direito.
    headerRight: () => createElement(BotaoAvatar),
    headerShadowVisible: false,
    headerLargeTitleShadowVisible: false,
    headerStyle: { backgroundColor: cores.fundo },
    headerTitleStyle: { color: cores.texto },
    headerLargeTitleStyle: { color: cores.texto },
    headerTintColor: cores.destaque,
    contentStyle: { backgroundColor: cores.fundo },
  };
}
