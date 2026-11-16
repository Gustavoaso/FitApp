// Aba "Evolução" do grupo (RN29): só o que cada membro escolheu compartilhar com este grupo.
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CardVidro, EstadoVazio } from '@/compartilhado/ui';
import { FotoStorage } from '@/compartilhado/ui/FotoStorage';
import { Espacamento, FamiliaFonte, Tipografia } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import { buscarEvolucaoGrupo, type RegistroEvolucao } from './grupos-servico';

const ROTULOS = ['frente', 'lado', 'costas'];

export function EvolucaoDoGrupo({ grupoId }: { grupoId: string }) {
  const { cores } = useTema();
  const [lista, setLista] = useState<RegistroEvolucao[] | null>(null);
  useEffect(() => {
    buscarEvolucaoGrupo(grupoId).then((r) => setLista(r.ok ? r.valor : []));
  }, [grupoId]);

  if (!lista) return null;
  if (lista.length === 0) {
    return (
      <EstadoVazio
        simbolo="camera"
        titulo="Nada compartilhado"
        mensagem="Os membros escolhem, em cada registro, se o grupo pode ver."
      />
    );
  }
  return (
    <>
      {lista.map((e) => (
        <CardVidro key={e.id}>
          <Text style={[estilos.titulo, { color: cores.texto }]}>
            {e.apelido}
            {e.ehVoce ? ' (você)' : ''} · {e.data.split('-').reverse().join('/')}
            {e.pesoKg !== null ? ` · ${e.pesoKg} kg` : ''}
          </Text>
          <View style={estilos.fotos}>
            {e.fotos.map((c, i) =>
              c ? (
                <FotoStorage
                  key={ROTULOS[i]}
                  bucket="evolucao"
                  caminho={c}
                  rotulo={`Foto de ${ROTULOS[i]} de ${e.apelido}`}
                  estilo={estilos.foto}
                />
              ) : null,
            )}
          </View>
        </CardVidro>
      ))}
    </>
  );
}

const estilos = StyleSheet.create({
  titulo: { fontFamily: FamiliaFonte.semibold, fontSize: Tipografia.corpo },
  fotos: { flexDirection: 'row', gap: Espacamento.sm, marginTop: Espacamento.sm },
  foto: { flex: 1, aspectRatio: 3 / 4, borderRadius: 12 },
});
