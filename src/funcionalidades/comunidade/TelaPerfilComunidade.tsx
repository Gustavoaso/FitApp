// Perfil público de outra pessoa (RN24/RN30): avatar, @usuario, bio, contadores, seguir e posts.
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BotaoPrimario, EstadoErro } from '@/compartilhado/ui';
import { FotoStorage } from '@/compartilhado/ui/FotoStorage';
import { useAuth } from '@/compartilhado/AuthContexto';
import { Espacamento, FamiliaFonte, Tipografia, type CoresTema } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import { ListaPosts } from './ListaPosts';
import {
  alternarSeguir,
  carregarPerfilComunidade,
  type PerfilComunidade,
} from './comunidade-servico';

export default function TelaPerfilComunidade() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cores } = useTema();
  const e = useMemo(() => criarEstilos(cores), [cores]);
  const router = useRouter();
  const { usuario } = useAuth();
  const [perfil, setPerfil] = useState<PerfilComunidade | null>(null);
  const [falhou, setFalhou] = useState(false);

  const carregar = useCallback(async () => {
    const p = await carregarPerfilComunidade(id);
    setFalhou(!p);
    setPerfil(p);
  }, [id]);
  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  const seguir = async () => {
    if (!perfil) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (await alternarSeguir(id, perfil.euSigo))
      setPerfil({
        ...perfil,
        euSigo: !perfil.euSigo,
        seguidores: perfil.seguidores + (perfil.euSigo ? -1 : 1),
      });
  };

  if (falhou) return <EstadoErro mensagem="Perfil não encontrado." aoTentarDeNovo={carregar} />;
  if (!perfil) return null;
  const numeros = [
    ['Posts', perfil.posts],
    ['Seguidores', perfil.seguidores],
    ['Seguindo', perfil.seguindo],
  ] as const;
  const cabecalho = (
    <View style={e.topo}>
      <FotoStorage
        bucket="avatares"
        caminho={perfil.avatarCaminho}
        rotulo={`Foto de ${perfil.apelido}`}
        estilo={e.avatar}
      />
      <Text style={e.nome}>{perfil.apelido}</Text>
      {perfil.usuario ? <Text style={e.usuario}>@{perfil.usuario}</Text> : null}
      {perfil.bio ? <Text style={e.bio}>{perfil.bio}</Text> : null}
      <View style={e.numeros}>
        {numeros.map(([rotulo, n]) => (
          <View key={rotulo} accessible accessibilityLabel={`${n} ${rotulo}`} style={e.numero}>
            <Text style={e.valor}>{n}</Text>
            <Text style={e.rotulo}>{rotulo}</Text>
          </View>
        ))}
      </View>
      {usuario?.id !== id ? (
        <BotaoPrimario texto={perfil.euSigo ? 'Seguindo' : 'Seguir'} aoPresionar={seguir} />
      ) : null}
    </View>
  );
  return (
    <ListaPosts
      aba="usuario"
      autor={id}
      cabecalho={cabecalho}
      textoVazio="Ainda sem posts."
      aoAbrirPerfil={(a) => a !== id && router.push(`/comunidade/usuario/${a}`)}
    />
  );
}

const criarEstilos = (c: CoresTema) =>
  StyleSheet.create({
    topo: { alignItems: 'center', gap: Espacamento.sm, padding: Espacamento.lg },
    avatar: { width: 88, height: 88, borderRadius: 44 },
    nome: { fontFamily: FamiliaFonte.semibold, fontSize: Tipografia.titulo2, color: c.texto },
    usuario: { fontSize: Tipografia.subtitulo, color: c.textoSecundario },
    bio: { fontSize: Tipografia.corpo, color: c.texto, textAlign: 'center' },
    numeros: { flexDirection: 'row', gap: Espacamento.xxl },
    numero: { alignItems: 'center' },
    valor: {
      fontFamily: FamiliaFonte.semibold,
      fontSize: Tipografia.titulo3,
      color: c.texto,
      fontVariant: ['tabular-nums'],
    },
    rotulo: { fontSize: Tipografia.rodape, color: c.textoSecundario },
  });
