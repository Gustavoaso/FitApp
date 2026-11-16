// Post com as respostas em sequência (RN30). O botão "Responder" abre o sheet de novo post ligado ao pai.
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Espacamento, FamiliaFonte, Tipografia, type CoresTema } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import { ListaPosts } from './ListaPosts';

export default function TelaPost() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cores } = useTema();
  const e = useMemo(() => criarEstilos(cores), [cores]);
  const router = useRouter();
  const [versao, setVersao] = useState(0);
  // Recarrega ao voltar do sheet de resposta.
  useFocusEffect(() => setVersao((v) => v + 1));
  return (
    <View style={e.tela}>
      <ListaPosts
        aba="respostas"
        alvo={id}
        versao={versao}
        textoVazio="Post indisponível."
        aoAbrirPerfil={(a) => router.push(`/comunidade/usuario/${a}`)}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Responder ao post"
        onPress={() => router.push(`/comunidade/novo?pai=${id}`)}
        style={e.responder}
      >
        <Text style={e.texto}>Responder</Text>
      </Pressable>
    </View>
  );
}

const criarEstilos = (c: CoresTema) =>
  StyleSheet.create({
    tela: { flex: 1 },
    responder: {
      minHeight: 50,
      margin: Espacamento.lg,
      borderRadius: 25,
      backgroundColor: c.destaque,
      alignItems: 'center',
      justifyContent: 'center',
    },
    texto: {
      fontFamily: FamiliaFonte.semibold,
      fontSize: Tipografia.corpo,
      color: c.textoSobreDestaque,
    },
  });
