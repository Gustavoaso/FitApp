// Sheet de novo post: termos de uso no primeiro post, depois texto (até 280) e 1 foto.
import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { BotaoPrimario } from '@/compartilhado/ui';
import { FormPerfilBasico } from '@/compartilhado/ui/FormPerfilBasico';
import { Espacamento, FamiliaFonte, Tipografia, type CoresTema } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import { LIMITE_POST, validarTextoPost } from './comunidade';
import { aceitarTermos, publicar, verificarProntidao, type Prontidao } from './comunidade-servico';

// PREMISSA: texto provisório dos termos; o dono revisa o texto legal antes da publicação.
const TERMOS =
  'Seus posts ficam visíveis para quem usa o FitApp. Não publique conteúdo ofensivo, ilegal ou de outras pessoas sem permissão. Você pode apagar seus posts a qualquer momento.';

export default function TelaNovoPost() {
  const { cores } = useTema();
  const e = useMemo(() => criarEstilos(cores), [cores]);
  const router = useRouter();
  // `pai` = respondendo; `repost` = repostando com comentário.
  const { pai, repost } = useLocalSearchParams<{ pai?: string; repost?: string }>();
  const [estado, setEstado] = useState<Prontidao | null>(null);
  const [texto, setTexto] = useState('');
  const [foto, setFoto] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    verificarProntidao().then(setEstado, () => setEstado('sem-perfil'));
  }, []);

  const escolherFoto = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] });
    if (!r.canceled) setFoto(r.assets[0].uri);
  };

  const enviar = async () => {
    const v = validarTextoPost(texto);
    if ('erro' in v) return setErro(v.erro);
    setOcupado(true);
    const falha = await publicar(v.texto, foto, { paiId: pai, repostDe: repost });
    setOcupado(false);
    if (falha) return setErro(falha);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  if (!estado) return <View style={e.tela} />;
  if (estado === 'sem-perfil')
    return (
      <View style={e.tela}>
        <Text style={e.titulo}>Defina seu perfil</Text>
        <Text style={e.texto}>Para postar, escolha um apelido e um @usuario.</Text>
        <FormPerfilBasico aoSalvar={() => verificarProntidao().then(setEstado)} />
      </View>
    );
  if (estado === 'sem-termos')
    return (
      <View style={e.tela}>
        <Text style={e.titulo}>Termos da Comunidade</Text>
        <Text style={e.texto}>{TERMOS}</Text>
        <BotaoPrimario
          texto="Aceitar e continuar"
          aoPresionar={async () =>
            (await aceitarTermos()) ? setEstado('ok') : setErro('Tente de novo.')
          }
        />
        {erro ? <Text style={e.erro}>{erro}</Text> : null}
      </View>
    );
  return (
    <View style={e.tela}>
      <TextInput
        accessibilityLabel="Texto do post"
        placeholder={
          pai
            ? 'Escreva sua resposta'
            : repost
              ? 'Adicione um comentário'
              : 'O que está acontecendo?'
        }
        placeholderTextColor={cores.textoSecundario}
        multiline
        maxLength={LIMITE_POST}
        value={texto}
        onChangeText={(t) => {
          setTexto(t);
          setErro(null);
        }}
        style={e.entrada}
      />
      {foto ? (
        <Image source={{ uri: foto }} style={e.previa} accessibilityLabel="Foto escolhida" />
      ) : null}
      <View style={e.rodape}>
        <Pressable accessibilityRole="button" onPress={escolherFoto} style={e.botaoFoto}>
          <Text style={e.link}>{foto ? 'Trocar foto' : 'Adicionar foto'}</Text>
        </Pressable>
        <Text style={e.contador}>
          {texto.length}/{LIMITE_POST}
        </Text>
      </View>
      {erro ? <Text style={e.erro}>{erro}</Text> : null}
      <BotaoPrimario
        texto={ocupado ? 'Publicando…' : pai ? 'Responder' : 'Publicar'}
        aoPresionar={enviar}
        desabilitado={ocupado}
      />
    </View>
  );
}

const criarEstilos = (c: CoresTema) =>
  StyleSheet.create({
    tela: { flex: 1, padding: Espacamento.lg, gap: Espacamento.md, backgroundColor: c.fundo },
    titulo: { fontFamily: FamiliaFonte.semibold, fontSize: Tipografia.titulo2, color: c.texto },
    texto: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Tipografia.corpo,
      color: c.textoSecundario,
    },
    entrada: {
      minHeight: 120,
      fontSize: Tipografia.corpo,
      color: c.texto,
      textAlignVertical: 'top',
    },
    previa: { height: 160, borderRadius: 16 },
    rodape: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    botaoFoto: { minHeight: 44, justifyContent: 'center' },
    link: { fontSize: Tipografia.chamada, color: c.destaqueTexto },
    contador: {
      fontSize: Tipografia.rodape,
      color: c.textoSecundario,
      fontVariant: ['tabular-nums'],
    },
    erro: { fontSize: Tipografia.rodape, color: c.erro },
  });
