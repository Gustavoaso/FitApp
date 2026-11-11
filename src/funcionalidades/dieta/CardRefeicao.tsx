// ============================================================
// COMPONENTE: CardRefeicao
// ============================================================
// Card de refeição inspirado no design do MyFitnessPal com estética Liquid Glass.
// Suporta modo colapsado (Screen 1) e modo detalhado/expandido (Screen 2).
// ============================================================

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { CardVidro } from '@/compartilhado/ui/CardVidro';
import { GraficoDonutMacros } from './GraficoDonutMacros';
import {
  CoresMacros,
  CoresTema,
  Espacamento,
  FamiliaFonte,
  Fonte,
  PesoFonte,
  Raio,
  Tipografia,
} from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import { formatarCalorias } from '@/compartilhado/utilidades';

export interface ItemRefeicaoResumo {
  id: string;
  nome: string;
  porcao: string;
  calorias: number;
  proteinas: number;
  carbos: number;
  gorduras: number;
}

interface PropsCardRefeicao {
  nome: string;
  horario: string;
  alimentos: ItemRefeicaoResumo[];
  expandido?: boolean;
  onAdicionar: () => void;
  onAlternarExpandir?: () => void;
  onCopiarDe?: () => void;
  onEditar?: () => void;
}

export function CardRefeicao({
  nome,
  horario,
  alimentos,
  expandido = false,
  onAdicionar,
  onAlternarExpandir,
  onCopiarDe,
  onEditar,
}: PropsCardRefeicao) {
  const { cores } = useTema();
  const estilos = useMemo(() => criarEstilos(cores), [cores]);
  const totais = alimentos.reduce(
    (acc, item) => ({
      calorias: acc.calorias + item.calorias,
      proteinas: acc.proteinas + item.proteinas,
      carbos: acc.carbos + item.carbos,
      gorduras: acc.gorduras + item.gorduras,
    }),
    { calorias: 0, proteinas: 0, carbos: 0, gorduras: 0 },
  );

  const totalGramas = totais.carbos + totais.gorduras + totais.proteinas || 1;
  const pctC = Math.round((totais.carbos / totalGramas) * 100);
  const pctF = Math.round((totais.gorduras / totalGramas) * 100);
  const pctP = Math.round((totais.proteinas / totalGramas) * 100);

  const textoSubtituloColapsado =
    alimentos.length > 0
      ? `${Math.round(totais.calorias)} kcal`
      : `Nenhum alimento registrado • ${horario}`;

  return (
    <CardVidro semBorda estilo={estilos.card}>
      {/* ── Top Bar do Card da Refeição ────────────────────────── */}
      <TouchableOpacity style={estilos.topoClick} onPress={onAlternarExpandir} activeOpacity={0.7}>
        <View style={estilos.colunaTitulo}>
          <Text style={estilos.nome}>{nome}</Text>
          <Text style={estilos.subtituloColapsado}>
            {expandido && alimentos.length > 0
              ? `C ${pctC}%  F ${pctF}%  P ${pctP}%`
              : textoSubtituloColapsado}
          </Text>
        </View>

        {/* Calorias totais da refeição à direita no modo expandido */}
        {expandido && alimentos.length > 0 ? (
          <Text style={estilos.kcalExpandidaHeader}>{Math.round(totais.calorias)} kcal</Text>
        ) : null}

        {/* Ações do modo colapsado */}
        {!expandido ? (
          <View style={estilos.acoesDireitaColapsado}>
            {onAlternarExpandir ? (
              <TouchableOpacity onPress={onAlternarExpandir} style={estilos.btnMaisOpcoes}>
                <SymbolView name="ellipsis" size={16} tintColor={cores.textoSecundario} />
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={estilos.btnLogPilula}
              onPress={onAdicionar}
              activeOpacity={0.8}
            >
              <Text style={estilos.txtLogPilula}>Log</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </TouchableOpacity>

      {/* ── Alimentos: nome, gramas e kcal por item (sempre visíveis) ── */}
      {alimentos.length > 0 ? (
        <View style={estilos.listaAlimentos}>
          {alimentos.map((item) => (
            <View key={item.id} style={estilos.itemLinha}>
              <View style={estilos.colInfoItem}>
                <Text style={estilos.itemNomeBold}>{item.nome}</Text>
                <Text style={estilos.itemSubCinza}>{item.porcao}</Text>
              </View>
              <Text style={estilos.itemKcalDireita}>{Math.round(item.calorias)} kcal</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* ── Conteúdo Expandido (MyFitnessPal Screen 2) ────────────────── */}
      {expandido ? (
        <View style={estilos.conteudoExpandido}>
          {/* Gráfico Donut de Macros da Refeição (Se houver alimentos) */}
          {alimentos.length > 0 ? (
            <View style={estilos.cardDonutInterno}>
              <GraficoDonutMacros
                calorias={totais.calorias}
                carbosGramas={totais.carbos}
                gordurasGramas={totais.gorduras}
                proteinasGramas={totais.proteinas}
                tamanho={80}
                espessura={6}
              />
              <View style={estilos.colLegendaDonut}>
                <View style={estilos.linhaLegendaDonut}>
                  <View style={[estilos.dotCor, { backgroundColor: CoresMacros.carboidrato }]} />
                  <Text style={estilos.txtLegendaPct}>{pctC}%</Text>
                  <Text style={estilos.txtLegendaGramas}>{totais.carbos}g Carbos</Text>
                </View>
                <View style={estilos.linhaLegendaDonut}>
                  <View style={[estilos.dotCor, { backgroundColor: CoresMacros.gordura }]} />
                  <Text style={estilos.txtLegendaPct}>{pctF}%</Text>
                  <Text style={estilos.txtLegendaGramas}>{totais.gorduras}g Gorduras</Text>
                </View>
                <View style={estilos.linhaLegendaDonut}>
                  <View style={[estilos.dotCor, { backgroundColor: CoresMacros.proteina }]} />
                  <Text style={estilos.txtLegendaPct}>{pctP}%</Text>
                  <Text style={estilos.txtLegendaGramas}>{totais.proteinas}g Proteína</Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* Linha de Ações Rápidas: Copiar de... e Editar */}
          <View style={estilos.rowAcoesRapidas}>
            {onCopiarDe ? (
              <TouchableOpacity style={estilos.btnAcaoQuadrado} onPress={onCopiarDe}>
                <SymbolView name="doc.on.doc" size={14} tintColor={cores.destaqueTexto} />
                <Text style={estilos.txtAcaoQuadrado}>Copiar de...</Text>
              </TouchableOpacity>
            ) : null}
            {onEditar ? (
              <TouchableOpacity style={estilos.btnAcaoQuadrado} onPress={onEditar}>
                <SymbolView name="pencil" size={14} tintColor={cores.texto} />
                <Text style={estilos.txtAcaoQuadrado}>Editar</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Botão Inferior "Log mais" / Adicionar */}
          <TouchableOpacity style={estilos.btnLogMais} onPress={onAdicionar} activeOpacity={0.8}>
            <SymbolView name="plus" size={14} tintColor={cores.destaqueTexto} weight="bold" />
            <Text style={estilos.txtLogMais}>
              {alimentos.length > 0 ? 'Log mais alimentos' : 'Adicionar alimento'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </CardVidro>
  );
}

const criarEstilos = (cores: CoresTema) =>
  StyleSheet.create({
    card: {
      marginBottom: 0,
      paddingVertical: Espacamento.md,
      paddingHorizontal: Espacamento.lg,
    },
    topoClick: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    colunaTitulo: {
      flex: 1,
    },
    nome: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.corpo,
      color: cores.texto,
      fontWeight: PesoFonte.bold,
    },
    subtituloColapsado: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Fonte.micro,
      color: cores.textoSecundario,
      marginTop: 2,
    },
    kcalExpandidaHeader: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Tipografia.subtitulo,
      color: cores.texto,
      marginRight: 6,
    },
    acoesDireitaColapsado: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    btnMaisOpcoes: {
      width: 44,
      height: 44,
      borderRadius: Raio.full,
      backgroundColor: cores.elevada,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnLogPilula: {
      backgroundColor: cores.destaque,
      borderRadius: Raio.full,
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    txtLogPilula: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.label,
      color: cores.textoSobreDestaque,
    },

    // Expandido
    conteudoExpandido: {
      marginTop: 16,
      paddingTop: 14,
      borderTopWidth: 1,
      borderColor: cores.separador,
    },
    cardDonutInterno: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: cores.destaqueSuave,
      borderRadius: Raio.md,
      padding: 12,
      gap: 16,
      marginBottom: 12,
    },
    colLegendaDonut: {
      flex: 1,
      gap: 6,
    },
    linhaLegendaDonut: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    dotCor: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    txtLegendaPct: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Fonte.micro,
      color: cores.texto,
      width: 32,
    },
    txtLegendaGramas: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Fonte.micro,
      color: cores.textoSecundario,
    },

    rowAcoesRapidas: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 14,
    },
    btnAcaoQuadrado: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: cores.elevada,
      minHeight: 44,
      borderRadius: Raio.sm,
    },
    txtAcaoQuadrado: {
      fontFamily: FamiliaFonte.semibold,
      fontSize: Fonte.micro,
      color: cores.texto,
    },

    listaAlimentos: {
      marginTop: 10,
    },
    itemLinha: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: cores.separador,
    },
    colInfoItem: {
      flex: 1,
      paddingRight: 12,
    },
    itemNomeBold: {
      fontFamily: FamiliaFonte.medio,
      fontSize: Fonte.label,
      color: cores.texto,
    },
    itemSubCinza: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Fonte.micro,
      color: cores.textoSecundario,
      marginTop: 2,
    },
    itemKcalDireita: {
      fontFamily: FamiliaFonte.regular,
      fontSize: Fonte.label,
      color: cores.textoSecundario,
      fontVariant: ['tabular-nums'],
    },

    btnLogMais: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: cores.destaqueSuave,
      borderWidth: 1,
      borderColor: cores.separador,
      minHeight: 44,
      borderRadius: Raio.md,
    },
    txtLogMais: {
      fontFamily: FamiliaFonte.bold,
      fontSize: Tipografia.rodape,
      color: cores.destaqueTexto,
    },
  });
