// Uma linha do feed (mockup A: lista contínua, sem card). Toque no avatar/nome abre o perfil.
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { FotoStorage } from '@/compartilhado/ui/FotoStorage';
import { Espacamento, FamiliaFonte, Tipografia, type CoresTema } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import { tempoRelativo } from './comunidade';
import type { Post } from './comunidade-servico';

type Props = {
  post: Post;
  meu: boolean;
  aoAbrirPerfil: (autorId: string) => void;
  aoCurtir: (post: Post) => void;
  aoApagar: (post: Post) => void;
};

export function CartaoPost({ post, meu, aoAbrirPerfil, aoCurtir, aoApagar }: Props) {
  const { cores } = useTema();
  const e = useMemo(() => criarEstilos(cores), [cores]);
  return (
    <View style={e.linha}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Perfil de ${post.apelido}`}
        onPress={() => aoAbrirPerfil(post.autorId)}
      >
        <FotoStorage
          bucket="avatares"
          caminho={post.avatarCaminho}
          rotulo={`Foto de ${post.apelido}`}
          estilo={e.avatar}
        />
      </Pressable>
      <View style={e.corpo}>
        <Text style={e.cabecalho} numberOfLines={1}>
          <Text style={e.nome}>{post.apelido}</Text>
          {post.usuario ? `  @${post.usuario}` : ''} · {tempoRelativo(post.criadoEm)}
        </Text>
        <Text style={e.texto}>{post.texto}</Text>
        {post.fotoCaminho ? (
          <FotoStorage
            bucket="posts"
            caminho={post.fotoCaminho}
            rotulo="Foto do post"
            estilo={e.foto}
          />
        ) : null}
        <View style={e.acoes}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={post.curtiu ? 'Descurtir' : 'Curtir'}
            hitSlop={12}
            onPress={() => aoCurtir(post)}
            style={e.acao}
          >
            <SymbolView
              name={post.curtiu ? 'heart.fill' : 'heart'}
              size={18}
              tintColor={post.curtiu ? cores.destaqueTexto : cores.textoSecundario}
            />
            <Text style={e.contador}>{post.curtidas}</Text>
          </Pressable>
          {meu ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Apagar post"
              hitSlop={12}
              onPress={() => aoApagar(post)}
            >
              <SymbolView name="trash" size={18} tintColor={cores.textoSecundario} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const criarEstilos = (c: CoresTema) =>
  StyleSheet.create({
    linha: {
      flexDirection: 'row',
      gap: Espacamento.md,
      padding: Espacamento.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.separador,
    },
    avatar: { width: 40, height: 40, borderRadius: 20 },
    corpo: { flex: 1, gap: Espacamento.xs },
    cabecalho: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Tipografia.rodape,
      color: c.textoSecundario,
    },
    nome: { fontFamily: FamiliaFonte.semibold, fontSize: Tipografia.subtitulo, color: c.texto },
    texto: { fontFamily: FamiliaFonte.regular, fontSize: Tipografia.corpo, color: c.texto },
    foto: { height: 220, borderRadius: 16, marginTop: Espacamento.sm },
    acoes: {
      flexDirection: 'row',
      gap: Espacamento.xxl,
      marginTop: Espacamento.sm,
      alignItems: 'center',
    },
    acao: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.xs, minHeight: 28 },
    contador: {
      fontSize: Tipografia.rodape,
      color: c.textoSecundario,
      fontVariant: ['tabular-nums'],
    },
  });
