// Avatar no topo das abas (RN32): abre o Perfil.
import { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useTema } from '@/compartilhado/useTema';
import { urlDoMeuAvatar } from '@/compartilhado/servicos/foto-servico';

export function BotaoAvatar() {
  const { cores } = useTema();
  const router = useRouter();
  const [url, setUrl] = useState<string | null>(null);
  useFocusEffect(
    useCallback(() => {
      urlDoMeuAvatar().then(setUrl, () => setUrl(null));
    }, []),
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Abrir perfil"
      hitSlop={8}
      onPress={() => router.push('/perfil')}
      style={estilos.botao}
    >
      {url ? (
        <Image source={{ uri: url }} style={estilos.imagem} />
      ) : (
        <SymbolView name="person.crop.circle" size={28} tintColor={cores.destaque} />
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  botao: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  imagem: { width: 32, height: 32, borderRadius: 16 },
});
