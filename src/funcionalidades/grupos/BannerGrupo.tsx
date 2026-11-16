// Banner do grupo: capa pronta (cor) ou foto do Storage; texto sempre legível por cima.
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { urlDaFoto } from '@/compartilhado/servicos/foto-servico';
import { corDaCapa } from './grupos';

export function BannerGrupo({
  banner,
  altura,
  children,
}: {
  banner: string | null;
  altura: number;
  children?: React.ReactNode;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const capa = corDaCapa(banner);
  useEffect(() => {
    if (capa || !banner) return;
    let ativo = true;
    urlDaFoto('banners', banner).then((u) => ativo && setUrl(u));
    return () => {
      ativo = false;
    };
  }, [banner, capa]);
  return (
    <View style={[estilos.base, { height: altura, backgroundColor: capa ?? '#3A3F4B' }]}>
      {url ? (
        <Image
          source={{ uri: url }}
          style={StyleSheet.absoluteFill}
          accessibilityIgnoresInvertColors
        />
      ) : null}
      {/* camada escura para o texto branco ter contraste */}
      <View style={[StyleSheet.absoluteFill, estilos.escuro]} />
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  base: { borderRadius: 20, overflow: 'hidden', justifyContent: 'flex-end', padding: 16 },
  escuro: { backgroundColor: 'rgba(0,0,0,0.28)' },
});
