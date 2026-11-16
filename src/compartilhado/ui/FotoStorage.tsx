// Foto de bucket privado: pede a URL assinada ao montar; sem permissão ou sem foto, mostra o fundo.
import React, { useEffect, useState } from 'react';
import { Image, View, type ViewStyle } from 'react-native';
import { urlDaFoto, type BucketFoto } from '@/compartilhado/servicos/foto-servico';
import { useTema } from '@/compartilhado/useTema';

export function FotoStorage({
  bucket,
  caminho,
  rotulo,
  estilo,
}: {
  bucket: BucketFoto;
  caminho: string | null;
  rotulo: string;
  estilo?: ViewStyle;
}) {
  const { cores } = useTema();
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let ativo = true;
    urlDaFoto(bucket, caminho).then((u) => ativo && setUrl(u));
    return () => {
      ativo = false;
    };
  }, [bucket, caminho]);
  return (
    <View style={[{ backgroundColor: cores.superficie, overflow: 'hidden' }, estilo]}>
      {url ? (
        <Image
          source={{ uri: url }}
          accessibilityLabel={rotulo}
          accessibilityIgnoresInvertColors
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      ) : null}
    </View>
  );
}
