// Card do feed: foto, atividade, curtir e comentários (RN23).
import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { CardVidro } from '@/compartilhado/ui';
import { urlDaFoto } from '@/compartilhado/servicos/foto-servico';
import { Espacamento, FamiliaFonte, Tipografia, type CoresTema } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import type { Checkin } from './grupos';
import {
  comentarCheckin,
  curtirCheckin,
  listarComentarios,
  type Comentario,
} from './grupos-servico';

export function CardCheckin({ checkin, aoMudar }: { checkin: Checkin; aoMudar: () => void }) {
  const { cores } = useTema();
  const estilos = useMemo(() => criarEstilos(cores), [cores]);
  const [foto, setFoto] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    urlDaFoto('checkins', checkin.fotoCaminho).then((u) => ativo && setFoto(u));
    return () => {
      ativo = false;
    };
  }, [checkin.fotoCaminho]);

  async function carregarComentarios() {
    const r = await listarComentarios(checkin.id);
    if (r.ok) setComentarios(r.valor);
  }

  async function curtir() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const r = await curtirCheckin(checkin.id);
    if (r.ok) aoMudar();
    else setErro(r.erro);
  }

  async function alternarComentarios() {
    if (!aberto) await carregarComentarios();
    setAberto(!aberto);
  }

  async function enviar() {
    const r = await comentarCheckin(checkin.id, texto.trim());
    if (!r.ok) return setErro(r.erro);
    setErro(null);
    setTexto('');
    await carregarComentarios();
    aoMudar();
  }

  return (
    <CardVidro padding="md">
      <Text style={estilos.apelido}>{checkin.apelido}</Text>
      <Text style={estilos.rotulo}>
        {checkin.nomeTreino ?? checkin.atividade} · {checkin.minutos} min
        {checkin.kcal ? ` · ${checkin.kcal} kcal` : ''}
      </Text>
      {checkin.descricao ? <Text style={estilos.texto}>{checkin.descricao}</Text> : null}
      {foto ? (
        <Image
          source={{ uri: foto }}
          style={estilos.foto}
          accessibilityLabel={`Foto de ${checkin.apelido}`}
        />
      ) : null}
      <View style={estilos.acoes}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={checkin.curtiu ? 'Descurtir' : 'Curtir'}
          accessibilityState={{ selected: checkin.curtiu }}
          onPress={curtir}
          style={estilos.acao}
        >
          <SymbolView
            name={checkin.curtiu ? 'heart.fill' : 'heart'}
            size={20}
            tintColor={checkin.curtiu ? cores.erro : cores.textoSecundario}
          />
          <Text style={estilos.rotulo}>{checkin.curtidas}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Comentários"
          onPress={alternarComentarios}
          style={estilos.acao}
        >
          <SymbolView name="bubble.right" size={20} tintColor={cores.textoSecundario} />
          <Text style={estilos.rotulo}>{checkin.comentarios}</Text>
        </Pressable>
      </View>
      {aberto ? (
        <View style={estilos.comentarios}>
          {comentarios.map((c) => (
            <Text key={c.id} style={estilos.texto}>
              <Text style={estilos.apelido}>{c.apelido} </Text>
              {c.texto}
            </Text>
          ))}
          <TextInput
            accessibilityLabel="Escrever comentário"
            placeholder="Comente algo"
            placeholderTextColor={cores.textoSecundario}
            value={texto}
            onChangeText={setTexto}
            maxLength={280}
            style={estilos.entrada}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enviar comentário"
            disabled={!texto.trim()}
            onPress={enviar}
            style={[estilos.acao, !texto.trim() && { opacity: 0.4 }]}
          >
            <Text style={estilos.destaque}>Enviar</Text>
          </Pressable>
          {erro ? <Text style={{ color: cores.erro }}>{erro}</Text> : null}
        </View>
      ) : null}
    </CardVidro>
  );
}

function criarEstilos(cores: CoresTema) {
  return StyleSheet.create({
    apelido: { fontFamily: FamiliaFonte.semibold, fontSize: Tipografia.corpo, color: cores.texto },
    rotulo: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Tipografia.subtitulo,
      color: cores.textoSecundario,
    },
    texto: { fontFamily: FamiliaFonte.regular, fontSize: Tipografia.corpo, color: cores.texto },
    destaque: {
      fontFamily: FamiliaFonte.semibold,
      fontSize: Tipografia.corpo,
      color: cores.destaqueTexto,
    },
    foto: { height: 200, borderRadius: 12, marginTop: Espacamento.sm },
    acoes: { flexDirection: 'row', gap: Espacamento.lg, marginTop: Espacamento.sm },
    acao: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.xs, minHeight: 44 },
    comentarios: { gap: Espacamento.sm, marginTop: Espacamento.sm },
    entrada: {
      minHeight: 44,
      borderRadius: 12,
      paddingHorizontal: Espacamento.md,
      color: cores.texto,
      backgroundColor: cores.fundo,
    },
  });
}
