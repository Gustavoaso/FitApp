// Escolha do banner (RN23): uma das 8 capas da marca ou uma foto enviada pelo utilitário único.
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { BotaoPrimario } from '@/compartilhado/ui';
import { enviarFoto } from '@/compartilhado/servicos/foto-servico';
import { Espacamento, Tipografia } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import { CAPAS, corDaCapa } from './grupos';

export function SeletorBanner({
  valor,
  aoMudar,
}: {
  valor: string | null;
  aoMudar: (banner: string | null) => void;
}) {
  const { cores } = useTema();
  const [erro, setErro] = useState<string | null>(null);

  async function enviar() {
    try {
      const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (r.canceled) return;
      aoMudar(await enviarFoto('banners', r.assets[0].uri));
      setErro(null);
    } catch {
      setErro('Não foi possível enviar a foto. Tente de novo.');
    }
  }

  return (
    <View style={estilos.bloco}>
      <Text style={{ color: cores.textoSecundario, fontSize: Tipografia.subtitulo }}>Banner</Text>
      <View style={estilos.capas}>
        {CAPAS.map((c, i) => (
          <Pressable
            key={c}
            accessibilityRole="radio"
            accessibilityLabel={`Capa ${i + 1}`}
            accessibilityState={{ checked: valor === c }}
            onPress={() => aoMudar(c)}
            style={[
              estilos.capa,
              { backgroundColor: corDaCapa(c) ?? cores.superficie },
              valor === c && { borderColor: cores.texto, borderWidth: 3 },
            ]}
          />
        ))}
      </View>
      <BotaoPrimario
        texto={valor && !corDaCapa(valor) ? 'Trocar foto do banner' : 'Enviar foto do banner'}
        variante="outline"
        aoPresionar={enviar}
      />
      {erro ? <Text style={{ color: cores.erro }}>{erro}</Text> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  bloco: { gap: Espacamento.sm },
  capas: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacamento.sm },
  capa: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: 'transparent' },
});
