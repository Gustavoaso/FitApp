// Lista de posts com os estados de tela (carregando, vazio, erro) e curtir/apagar otimistas.
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { Alert, FlatList, RefreshControl } from 'react-native';
import * as Haptics from 'expo-haptics';
import { EstadoErro, EstadoVazio, Skeleton } from '@/compartilhado/ui';
import { useAuth } from '@/compartilhado/AuthContexto';
import { CartaoPost } from './CartaoPost';
import {
  alternarCurtida,
  apagarPost,
  listarPosts,
  type Aba,
  type Post,
} from './comunidade-servico';

type Props = {
  aba: Aba | 'usuario';
  autor?: string;
  aoAbrirPerfil: (autorId: string) => void;
  cabecalho?: ReactElement;
  textoVazio: string;
  /** Muda para recarregar (ex.: depois de publicar). */
  versao?: number;
};

export function ListaPosts({ aba, autor, aoAbrirPerfil, cabecalho, textoVazio, versao }: Props) {
  const { usuario } = useAuth();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [falhou, setFalhou] = useState(false);
  const [atualizando, setAtualizando] = useState(false);

  const carregar = useCallback(
    () =>
      listarPosts(aba, autor).then((r) => {
        setFalhou(r === null);
        if (r) setPosts(r);
      }),
    [aba, autor],
  );

  useEffect(() => {
    void carregar();
  }, [carregar, versao]);

  const curtir = async (p: Post) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const mudar = (curtiu: boolean) =>
      setPosts(
        (l) =>
          l?.map((x) =>
            x.id === p.id ? { ...x, curtiu, curtidas: x.curtidas + (curtiu ? 1 : -1) } : x,
          ) ?? null,
      );
    mudar(!p.curtiu);
    if (!(await alternarCurtida(p.id, p.curtiu))) mudar(p.curtiu);
  };

  const apagar = (p: Post) =>
    Alert.alert('Apagar post?', 'Não dá para desfazer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          if (await apagarPost(p)) setPosts((l) => l?.filter((x) => x.id !== p.id) ?? null);
        },
      },
    ]);

  if (falhou && !posts)
    return <EstadoErro mensagem="Não foi possível carregar." aoTentarDeNovo={carregar} />;
  if (!posts) return <Skeleton altura={120} largura="100%" />;
  return (
    <FlatList
      data={posts}
      keyExtractor={(p) => p.id}
      ListHeaderComponent={cabecalho}
      ListEmptyComponent={
        <EstadoVazio titulo="Nada por aqui" mensagem={textoVazio} simbolo="text.bubble" />
      }
      refreshControl={
        <RefreshControl
          refreshing={atualizando}
          onRefresh={async () => {
            setAtualizando(true);
            await carregar();
            setAtualizando(false);
          }}
        />
      }
      contentInsetAdjustmentBehavior="automatic"
      renderItem={({ item }) => (
        <CartaoPost
          post={item}
          meu={item.autorId === usuario?.id}
          aoAbrirPerfil={aoAbrirPerfil}
          aoCurtir={curtir}
          aoApagar={apagar}
        />
      )}
    />
  );
}
