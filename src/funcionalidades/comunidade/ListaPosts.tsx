// Lista de posts com os estados de tela (carregando, vazio, erro) e curtir/apagar otimistas.
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { Alert, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { EstadoErro, EstadoVazio, Skeleton } from '@/compartilhado/ui';
import { useAuth } from '@/compartilhado/AuthContexto';
import { CartaoPost } from './CartaoPost';
import { confirmarBloqueio, escolherMotivo } from './moderacao';
import {
  alternarCurtida,
  alternarRepost,
  apagarPost,
  listarPosts,
  type Aba,
  type Post,
} from './comunidade-servico';

type Props = {
  aba: Aba | 'usuario' | 'respostas';
  /** Autor (aba "usuario") ou post pai (aba "respostas"). */
  alvo?: string;
  aoAbrirPerfil: (autorId: string) => void;
  cabecalho?: ReactElement;
  textoVazio: string;
  /** Muda para recarregar (ex.: depois de publicar). */
  versao?: number;
};

export function ListaPosts({ aba, alvo, aoAbrirPerfil, cabecalho, textoVazio, versao }: Props) {
  const { usuario } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [falhou, setFalhou] = useState(false);
  const [atualizando, setAtualizando] = useState(false);

  const carregar = useCallback(
    () =>
      listarPosts(aba, alvo).then((r) => {
        setFalhou(r === null);
        if (r) setPosts(r);
      }),
    [aba, alvo],
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

  const abrirPost = (p: Post) => router.push(`/comunidade/post/${p.repostDe ?? p.id}`);

  // Repostar um repost leva ao original.
  const repostar = (p: Post) => {
    const alvoId = p.repostDe ?? p.id;
    Alert.alert('Repostar', undefined, [
      {
        text: p.repostei ? 'Desfazer repost' : 'Repostar',
        onPress: async () => {
          if (await alternarRepost(alvoId, p.repostei)) await carregar();
        },
      },
      {
        text: 'Repostar com comentário',
        onPress: () => router.push(`/comunidade/novo?repost=${alvoId}`),
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const mais = (p: Post) =>
    Alert.alert('Mais opções', undefined, [
      { text: 'Denunciar post', onPress: () => escolherMotivo({ postId: p.id }) },
      { text: 'Denunciar usuário', onPress: () => escolherMotivo({ usuarioId: p.autorId }) },
      {
        text: 'Bloquear usuário',
        style: 'destructive',
        onPress: () => confirmarBloqueio(p.autorId, p.apelido, carregar),
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);

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
          aoAbrirPost={abrirPost}
          aoRepostar={repostar}
          aoMais={mais}
        />
      )}
    />
  );
}
