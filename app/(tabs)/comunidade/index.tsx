// Vazia até a etapa 36 (posts e seguidores).
import { EstadoVazio } from '@/compartilhado/ui';

export default function Comunidade() {
  return (
    <EstadoVazio
      titulo="Comunidade em breve"
      mensagem="Aqui vão aparecer os posts de quem você segue."
      simbolo="bubble.left.and.bubble.right"
    />
  );
}
