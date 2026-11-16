// Perfil público (RN24 revista): avatar, @usuario e bio. Só aparece com apelido definido.
import { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { CardVidro, BotaoPrimario } from '@/compartilhado/ui';
import { Espacamento, Tipografia } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import { urlDaFoto } from '@/compartilhado/servicos/foto-servico';
import { validarBio, validarUsuario } from './perfil-publico';
import {
  carregarPerfilPublico,
  salvarPerfilPublico,
  trocarAvatar,
  type PerfilPublico,
} from './perfil-publico-servico';

export function CartaoPerfilPublico() {
  const { cores } = useTema();
  const [perfil, setPerfil] = useState<PerfilPublico | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [usuario, setUsuario] = useState('');
  const [bio, setBio] = useState('');
  const [aviso, setAviso] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      carregarPerfilPublico().then(async (p) => {
        setPerfil(p);
        setUsuario(p?.usuario ?? '');
        setBio(p?.bio ?? '');
        setAvatarUrl(await urlDaFoto('avatares', p?.avatarCaminho));
      });
    }, []),
  );

  const escolherAvatar = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (r.canceled || !perfil) return;
    try {
      const caminho = await trocarAvatar(r.assets[0].uri, perfil.avatarCaminho);
      setPerfil({ ...perfil, avatarCaminho: caminho });
      setAvatarUrl(await urlDaFoto('avatares', caminho));
    } catch {
      setAviso('Não foi possível enviar a foto.');
    }
  };

  const salvar = async () => {
    const u = validarUsuario(usuario);
    const b = validarBio(bio);
    if ('erro' in u) return setAviso(u.erro);
    if ('erro' in b) return setAviso(b.erro);
    setAviso((await salvarPerfilPublico(u.usuario, b.bio)) ?? 'Perfil salvo.');
  };

  if (!perfil) return null;
  return (
    <CardVidro>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Trocar foto"
        onPress={escolherAvatar}
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={estilos.avatar} />
        ) : (
          <Text style={[estilos.texto, { color: cores.destaqueTexto }]}>Adicionar foto</Text>
        )}
      </Pressable>
      <Text style={[estilos.texto, { color: cores.texto }]}>{perfil.apelido}</Text>
      <TextInput
        accessibilityLabel="@usuario"
        style={[estilos.campo, { color: cores.texto, borderBottomColor: cores.separador }]}
        value={usuario}
        onChangeText={setUsuario}
        placeholder="@usuario"
        placeholderTextColor={cores.textoSecundario}
        maxLength={16}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        accessibilityLabel="Bio"
        style={[estilos.campo, { color: cores.texto, borderBottomColor: cores.separador }]}
        value={bio}
        onChangeText={setBio}
        placeholder="Bio (até 160 caracteres)"
        placeholderTextColor={cores.textoSecundario}
        maxLength={160}
        multiline
      />
      {aviso ? (
        <Text style={[estilos.texto, { color: cores.textoSecundario }]}>{aviso}</Text>
      ) : null}
      <BotaoPrimario texto="Salvar perfil" aoPresionar={salvar} />
    </CardVidro>
  );
}

const estilos = StyleSheet.create({
  avatar: { width: 72, height: 72, borderRadius: 36, marginBottom: Espacamento.sm },
  texto: { fontSize: Tipografia.corpo, marginVertical: Espacamento.xs },
  campo: {
    minHeight: 44,
    fontSize: Tipografia.corpo,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginVertical: Espacamento.sm,
  },
});
