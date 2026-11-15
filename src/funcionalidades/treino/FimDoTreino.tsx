// Fim do treino (RN21): resumo da sessão e "Registrar com foto". A foto só existe no
// aparelho: vira imagem com o selo aqui e sai pela galeria ou pela folha de compartilhar.
import React, { useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View, type HostInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { BotaoPrimario, ChipOpcao } from '@/compartilhado/ui';
import { Espacamento, FamiliaFonte, Tipografia } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import { SeloTreino } from './SeloTreino';
import {
  DIMENSOES_FORMATO,
  montarNumerosSelo,
  type FormatoSelo,
  type ModeloSelo,
  type ResumoSessao,
} from './selo-treino';

interface PropsFimDoTreino {
  resumo: ResumoSessao;
  aoConcluir: () => void;
}

const OPCOES_FOTO: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.9 };

export function FimDoTreino({ resumo, aoConcluir }: PropsFimDoTreino) {
  const { cores } = useTema();
  const [editando, setEditando] = useState(false);
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [modelo, setModelo] = useState<ModeloSelo>('coluna');
  const [formato, setFormato] = useState<FormatoSelo>('9:16');
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const refSelo = useRef<HostInstance>(null);

  const abrirEditor = (uri: string | null) => {
    setFotoUri(uri);
    setAviso(null);
    setEditando(true);
  };

  const tirarFoto = async () => {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      setAviso('Sem acesso à câmera. Escolha uma foto da galeria ou use o cartão sem foto.');
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync(OPCOES_FOTO);
    if (!resultado.canceled && resultado.assets[0]) abrirEditor(resultado.assets[0].uri);
  };

  const escolherDaGaleria = async () => {
    // O seletor do iOS não pede permissão: a pessoa só entrega a foto que escolher.
    const resultado = await ImagePicker.launchImageLibraryAsync(OPCOES_FOTO);
    if (!resultado.canceled && resultado.assets[0]) abrirEditor(resultado.assets[0].uri);
  };

  const gerarImagem = () => {
    const { largura, altura } = DIMENSOES_FORMATO[formato];
    return captureRef(refSelo, {
      format: 'jpg',
      quality: 0.95,
      width: largura,
      height: altura,
      result: 'tmpfile',
    });
  };

  const salvarNaGaleria = async () => {
    setOcupado(true);
    try {
      // Só escrita: o app não lê a galeria da pessoa.
      const permissao = await MediaLibrary.requestPermissionsAsync(true);
      if (!permissao.granted) {
        setAviso('Sem acesso para salvar. Libere as Fotos nos Ajustes ou use Compartilhar.');
        return;
      }
      await MediaLibrary.Asset.create(await gerarImagem());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAviso('Imagem salva nas Fotos.');
    } catch {
      setAviso('Não deu para salvar a imagem. Tente de novo.');
    } finally {
      setOcupado(false);
    }
  };

  const compartilhar = async () => {
    setOcupado(true);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        setAviso('Compartilhar não está disponível neste aparelho.');
        return;
      }
      await Sharing.shareAsync(await gerarImagem(), {
        mimeType: 'image/jpeg',
        UTI: 'public.jpeg',
        dialogTitle: 'Compartilhar treino',
      });
    } catch {
      setAviso('Não deu para compartilhar a imagem. Tente de novo.');
    } finally {
      setOcupado(false);
    }
  };

  const numeros = montarNumerosSelo(resumo);
  const corTexto = { color: cores.texto };
  const corSecundaria = { color: cores.textoSecundario };

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={aoConcluir}>
      <SafeAreaView style={[estilos.tela, { backgroundColor: cores.fundo }]}>
        {editando ? (
          <ScrollView contentContainerStyle={estilos.conteudo}>
            <View style={formato === '9:16' ? estilos.previaStories : estilos.previaFeed}>
              <SeloTreino
                ref={refSelo}
                resumo={resumo}
                modelo={modelo}
                formato={formato}
                fotoUri={fotoUri}
              />
            </View>

            <Text style={[estilos.rotulo, corSecundaria]}>Modelo</Text>
            <View accessibilityRole="radiogroup" style={estilos.linha}>
              <View style={estilos.celula}>
                <ChipOpcao
                  rotulo="Coluna"
                  selecionado={modelo === 'coluna'}
                  aoPressionar={() => setModelo('coluna')}
                />
              </View>
              <View style={estilos.celula}>
                <ChipOpcao
                  rotulo="Faixa"
                  selecionado={modelo === 'faixa'}
                  aoPressionar={() => setModelo('faixa')}
                />
              </View>
            </View>

            <Text style={[estilos.rotulo, corSecundaria]}>Formato</Text>
            <View accessibilityRole="radiogroup" style={estilos.linha}>
              <View style={estilos.celula}>
                <ChipOpcao
                  rotulo="Stories"
                  legenda="9:16"
                  selecionado={formato === '9:16'}
                  aoPressionar={() => setFormato('9:16')}
                />
              </View>
              <View style={estilos.celula}>
                <ChipOpcao
                  rotulo="Feed"
                  legenda="4:5"
                  selecionado={formato === '4:5'}
                  aoPressionar={() => setFormato('4:5')}
                />
              </View>
            </View>

            {aviso ? <Text style={[estilos.aviso, corTexto]}>{aviso}</Text> : null}

            <BotaoPrimario texto="Compartilhar" aoPresionar={compartilhar} carregando={ocupado} />
            <BotaoPrimario
              texto="Salvar na galeria"
              variante="ghost"
              aoPresionar={salvarNaGaleria}
              desabilitado={ocupado}
            />
            <BotaoPrimario texto="Concluir" variante="outline" aoPresionar={aoConcluir} />
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={estilos.conteudo}>
            <Text style={[estilos.titulo, corTexto]}>Treino concluído</Text>
            <Text style={[estilos.subtitulo, corSecundaria]}>{resumo.nomeTreino}</Text>
            <View style={estilos.numeros}>
              {numeros.map((n) => (
                <View key={n.rotulo} accessible style={estilos.numero}>
                  <Text style={[estilos.valor, corTexto]}>{n.valor}</Text>
                  <Text style={[estilos.rotulo, corSecundaria]}>{n.rotulo}</Text>
                </View>
              ))}
            </View>

            <Text style={[estilos.chamada, corSecundaria]}>
              Tire uma foto e poste com os números do treino. A foto fica só no seu celular.
            </Text>
            {aviso ? <Text style={[estilos.aviso, corTexto]}>{aviso}</Text> : null}

            <BotaoPrimario texto="Registrar com foto" aoPresionar={tirarFoto} />
            <BotaoPrimario
              texto="Escolher da galeria"
              variante="ghost"
              aoPresionar={escolherDaGaleria}
            />
            <BotaoPrimario
              texto="Usar cartão sem foto"
              variante="ghost"
              aoPresionar={() => abrirEditor(null)}
            />
            <BotaoPrimario texto="Concluir" variante="outline" aoPresionar={aoConcluir} />
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: { padding: Espacamento.md, gap: Espacamento.md },
  // Prévia limitada em altura para os controles caberem na tela.
  previaStories: { width: '62%', alignSelf: 'center' },
  previaFeed: { width: '84%', alignSelf: 'center' },
  titulo: {
    fontFamily: FamiliaFonte.bold,
    fontSize: Tipografia.tituloGrande,
    marginTop: Espacamento.lg,
  },
  subtitulo: { fontFamily: FamiliaFonte.medio, fontSize: Tipografia.titulo3 },
  numeros: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacamento.lg },
  numero: { minWidth: 96 },
  valor: {
    fontFamily: FamiliaFonte.bold,
    fontSize: Tipografia.titulo1,
    fontVariant: ['tabular-nums'],
  },
  rotulo: { fontFamily: FamiliaFonte.regular, fontSize: Tipografia.rodape },
  chamada: { fontFamily: FamiliaFonte.regular, fontSize: Tipografia.subtitulo },
  aviso: { fontFamily: FamiliaFonte.medio, fontSize: Tipografia.subtitulo },
  linha: { flexDirection: 'row', gap: Espacamento.sm },
  celula: { flex: 1 },
});
