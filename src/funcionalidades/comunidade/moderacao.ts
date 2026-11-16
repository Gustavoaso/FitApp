// Menus de denunciar e bloquear (Alert nativo). Reusado pelo feed e pelo perfil.
import { Alert } from 'react-native';
import { MOTIVOS_DENUNCIA } from './comunidade';
import { bloquearUsuario, denunciar } from './comunidade-servico';

export function escolherMotivo(alvo: { postId: string } | { usuarioId: string }) {
  Alert.alert('Por que denunciar?', undefined, [
    ...MOTIVOS_DENUNCIA.map((m) => ({
      text: m.rotulo,
      onPress: async () =>
        Alert.alert(
          (await denunciar(m.id, alvo)) ? 'Denúncia enviada' : 'Não foi possível denunciar',
        ),
    })),
    { text: 'Cancelar', style: 'cancel' as const },
  ]);
}

/** Bloqueio é imediato e some dos dois lados; `aoBloquear` atualiza a tela. */
export function confirmarBloqueio(usuarioId: string, apelido: string, aoBloquear: () => void) {
  Alert.alert(`Bloquear ${apelido}?`, 'Vocês deixam de ver os posts um do outro.', [
    { text: 'Cancelar', style: 'cancel' },
    {
      text: 'Bloquear',
      style: 'destructive',
      onPress: async () => {
        if (await bloquearUsuario(usuarioId)) aoBloquear();
        else Alert.alert('Não foi possível bloquear');
      },
    },
  ]);
}
