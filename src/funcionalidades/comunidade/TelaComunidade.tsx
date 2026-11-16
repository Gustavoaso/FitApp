// Aba Comunidade (RN30): feed com abas Seguindo / Para você e botão + flutuante (mockup A).
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Espacamento, FamiliaFonte, Tipografia, type CoresTema } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import { ListaPosts } from './ListaPosts';
import type { Aba } from './comunidade-servico';

const ABAS: { id: Aba; rotulo: string; vazio: string }[] = [
  { id: 'seguindo', rotulo: 'Seguindo', vazio: 'Siga pessoas ou publique o seu primeiro post.' },
  { id: 'para_voce', rotulo: 'Para você', vazio: 'Ainda não há posts nas últimas 72 horas.' },
];

export default function TelaComunidade() {
  const { cores } = useTema();
  const e = useMemo(() => criarEstilos(cores), [cores]);
  const router = useRouter();
  const [aba, setAba] = useState<Aba>('seguindo');
  const [versao, setVersao] = useState(0);
  // Recarrega ao voltar da tela de novo post.
  useFocusEffect(() => setVersao((v) => v + 1));
  const atual = ABAS.find((a) => a.id === aba) ?? ABAS[0];
  return (
    <View style={e.tela}>
      <View style={e.abas} accessibilityRole="tablist">
        {ABAS.map((a) => (
          <Pressable
            key={a.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: a.id === aba }}
            onPress={() => setAba(a.id)}
            style={[e.aba, a.id === aba && e.abaAtiva]}
          >
            <Text style={[e.abaTexto, a.id === aba && e.abaTextoAtivo]}>{a.rotulo}</Text>
          </Pressable>
        ))}
      </View>
      <ListaPosts
        key={aba}
        aba={aba}
        versao={versao}
        textoVazio={atual.vazio}
        aoAbrirPerfil={(id) => router.push(`/comunidade/usuario/${id}`)}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Novo post"
        onPress={() => router.push('/comunidade/novo')}
        style={e.fab}
      >
        <SymbolView name="plus" size={24} tintColor={cores.textoSobreDestaque} />
      </Pressable>
    </View>
  );
}

const criarEstilos = (c: CoresTema) =>
  StyleSheet.create({
    tela: { flex: 1 },
    abas: {
      flexDirection: 'row',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.separador,
    },
    aba: {
      flex: 1,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    abaAtiva: { borderBottomColor: c.destaque },
    abaTexto: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Tipografia.chamada,
      color: c.textoSecundario,
    },
    abaTextoAtivo: { fontFamily: FamiliaFonte.semibold, color: c.texto },
    fab: {
      position: 'absolute',
      right: Espacamento.lg,
      bottom: Espacamento.xxxl * 2,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: c.destaque,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
