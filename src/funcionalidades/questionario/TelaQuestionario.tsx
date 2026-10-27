// ============================================================
// TELA: Questionário Onboarding / Recálculo IA (app/questionario/index.tsx)
// ============================================================
// Questionário atualizado e simplificado em execução única (One-Shot)
// Todas as 14 perguntas são obrigatórias e sem condicionais.
// ============================================================

import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { CardVidro, BotaoPrimario } from '@/compartilhado/ui';
import { CoresTema, Espacamento, FamiliaFonte, Fonte, PesoFonte, Raio } from '@/compartilhado/tema';
import { useTema } from '@/compartilhado/useTema';
import { supabase } from '@/compartilhado/supabase';
import type { DadosQuestionario } from '@/compartilhado/tipos';
import {
  validarIdade,
  validarPeso,
  validarAltura,
  validarFrequenciaSemanal,
} from '@/compartilhado/utilidades';

export default function TelaQuestionario() {
  const { cores } = useTema();
  const estilos = useMemo(() => criarEstilos(cores), [cores]);
  const router = useRouter();
  const { dadosFormulario, origem } = useLocalSearchParams<{ dadosFormulario?: string; origem?: string }>();

  const [etapa, setEtapa] = useState(1);
  const [nomeUsuario, setNomeUsuario] = useState('Atleta');

  // ETAPA 1
  const [sexoBiologico, setSexoBiologico] = useState('Masculino');
  const [idade, setIdade] = useState('25');
  const [pesoAtual, setPesoAtual] = useState('75');
  const [altura, setAltura] = useState('175');

  // ETAPA 2
  const [objetivoPrincipal, setObjetivoPrincipal] = useState('Hipertrofia');
  const [atividadeForaTreino, setAtividadeForaTreino] = useState('Moderado');
  const [nivelExperiencia, setNivelExperiencia] = useState('Intermediário');

  // ETAPA 3
  const [diasDisponiveis, setDiasDisponiveis] = useState('4');
  const [localTreino, setLocalTreino] = useState('Academia');
  const [tempoSessao, setTempoSessao] = useState('45 min');
  const [divisaoPreferida, setDivisaoPreferida] = useState('Deixar a IA decidir');

  // ETAPA 4
  const [restricaoFisica, setRestricaoFisica] = useState<string[]>(['Nenhuma']);
  const [restricaoAlimentar, setRestricaoAlimentar] = useState<string[]>(['Nenhuma']);
  const [refeicoesPorDia, setRefeicoesPorDia] = useState('4');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.user_metadata?.nome) {
        setNomeUsuario(data.user.user_metadata.nome);
      }
    });
  }, []);

  useEffect(() => {
    if (dadosFormulario) {
      try {
        const parsed = JSON.parse(dadosFormulario);
        
        if (parsed.perfil) {
          if (parsed.perfil.sexo_biologico) setSexoBiologico(parsed.perfil.sexo_biologico);
          if (parsed.perfil.idade) setIdade(String(parsed.perfil.idade));
          if (parsed.perfil.peso_atual) setPesoAtual(String(parsed.perfil.peso_atual));
          if (parsed.perfil.altura) setAltura(String(parsed.perfil.altura));
        }

        if (parsed.objetivo) {
          if (parsed.objetivo.objetivo_principal) setObjetivoPrincipal(parsed.objetivo.objetivo_principal);
          if (parsed.objetivo.atividade_fora_treino) setAtividadeForaTreino(parsed.objetivo.atividade_fora_treino);
          if (parsed.objetivo.nivel_experiencia) setNivelExperiencia(parsed.objetivo.nivel_experiencia);
        }

        if (parsed.treino) {
          if (parsed.treino.dias_disponiveis_semana) setDiasDisponiveis(String(parsed.treino.dias_disponiveis_semana));
          if (parsed.treino.local_treino) setLocalTreino(parsed.treino.local_treino);
          if (parsed.treino.tempo_sessao) setTempoSessao(parsed.treino.tempo_sessao);
          if (parsed.treino.divisao_preferida) setDivisaoPreferida(parsed.treino.divisao_preferida);
          if (parsed.treino.restricao_fisica) setRestricaoFisica(parsed.treino.restricao_fisica);
        }

        if (parsed.dieta) {
          if (parsed.dieta.restricao_alimentar) setRestricaoAlimentar(parsed.dieta.restricao_alimentar);
          if (parsed.dieta.refeicoes_por_dia) setRefeicoesPorDia(String(parsed.dieta.refeicoes_por_dia));
        }
      } catch (e) {
        console.error('Erro ao fazer parse dos dadosFormulario:', e);
      }
    }
  }, [dadosFormulario]);

  const totalEtapas = 4;

  const alternarRestricao = (
    item: string,
    lista: string[],
    setLista: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (item === 'Nenhuma') {
      setLista(['Nenhuma']);
      return;
    }
    
    let novaLista = lista.filter(r => r !== 'Nenhuma');
    
    if (novaLista.includes(item)) {
      novaLista = novaLista.filter((r) => r !== item);
    } else {
      novaLista = [...novaLista, item];
    }
    
    if (novaLista.length === 0) {
      novaLista = ['Nenhuma'];
    }
    
    setLista(novaLista);
  };

  const sairDoQuestionario = () => {
    if (origem === 'perfil') {
      router.dismissTo('/(tabs)/perfil');
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  };

  const safeParseNumber = (val: string) => Number(val.replace(',', '.'));

  const proximaEtapa = () => {
    if (etapa === 1) {
      const v = validarIdade(safeParseNumber(idade));
      if (!v.valido) return Alert.alert('Aviso', v.mensagem);
      const vp = validarPeso(safeParseNumber(pesoAtual));
      if (!vp.valido) return Alert.alert('Aviso', vp.mensagem);
      const va = validarAltura(safeParseNumber(altura));
      if (!va.valido) return Alert.alert('Aviso', va.mensagem);
    }
    if (etapa === 3) {
      const vf = validarFrequenciaSemanal(safeParseNumber(diasDisponiveis));
      if (!vf.valido) return Alert.alert('Aviso', vf.mensagem);
    }

    if (etapa < totalEtapas) {
      setEtapa(etapa + 1);
    } else {
      finalizarQuestionario();
    }
  };

  // A geração acontece no Resultado (funcionalidade plano): aqui só vão as respostas.
  const finalizarQuestionario = () => {
    const payload: DadosQuestionario = {
      perfil: {
        nome: nomeUsuario,
        sexo_biologico: sexoBiologico,
        idade: safeParseNumber(idade),
        peso_atual: safeParseNumber(pesoAtual),
        altura: safeParseNumber(altura)
      },
      objetivo: {
        objetivo_principal: objetivoPrincipal,
        atividade_fora_treino: atividadeForaTreino,
        nivel_experiencia: nivelExperiencia
      },
      treino: {
        dias_disponiveis_semana: safeParseNumber(diasDisponiveis),
        local_treino: localTreino,
        tempo_sessao: tempoSessao,
        divisao_preferida: divisaoPreferida,
        restricao_fisica: restricaoFisica
      },
      dieta: {
        restricao_alimentar: restricaoAlimentar,
        refeicoes_por_dia: safeParseNumber(refeicoesPorDia)
      }
    };
    router.replace({
      pathname: '/questionario/resultado',
      params: { respostas: JSON.stringify(payload) },
    });
  };

  return (
    <View style={estilos.container}>
      <View style={estilos.topoHeader}>
        <TouchableOpacity style={estilos.btnSairQuestionario} onPress={sairDoQuestionario} activeOpacity={0.8}>
          <SymbolView name="xmark" size={14} tintColor={cores.texto} weight="bold" />
          <Text style={estilos.txtSairQuestionario}>Sair</Text>
        </TouchableOpacity>
      </View>

      <View style={estilos.barraProgressoContainer}>
        <View style={[estilos.barraProgresso, { width: `${(etapa / totalEtapas) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={estilos.scrollContent}>
        <Text style={estilos.contadorEtapa}>Etapa {etapa} de {totalEtapas}</Text>

        {/* ETAPA 1 */}
        {etapa === 1 && (
          <View>
            <Text style={estilos.tituloEtapa}>Seu perfil básico</Text>
            <CardVidro semBorda estilo={estilos.cardStep}>
              <Text style={estilos.label}>Qual seu sexo biológico?</Text>
              <View style={estilos.opcoesRow}>
                {['Masculino', 'Feminino'].map((item) => (
                  <TouchableOpacity key={item} style={[estilos.opcaoChip, sexoBiologico === item && estilos.opcaoChipSelecionada]} onPress={() => setSexoBiologico(item)}>
                    <Text style={estilos.opcaoTexto}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[estilos.label, { marginTop: Espacamento.lg }]}>Qual sua idade? (anos)</Text>
              <TextInput style={estilos.input} keyboardType="numeric" value={idade} onChangeText={setIdade} />

              <Text style={[estilos.label, { marginTop: Espacamento.lg }]}>Qual seu peso atual? (kg)</Text>
              <TextInput style={estilos.input} keyboardType="numeric" value={pesoAtual} onChangeText={setPesoAtual} />

              <Text style={[estilos.label, { marginTop: Espacamento.lg }]}>Qual sua altura? (cm)</Text>
              <TextInput style={estilos.input} keyboardType="numeric" value={altura} onChangeText={setAltura} />
            </CardVidro>
          </View>
        )}

        {/* ETAPA 2 */}
        {etapa === 2 && (
          <View>
            <Text style={estilos.tituloEtapa}>Objetivos e Experiência</Text>
            <CardVidro semBorda estilo={estilos.cardStep}>
              <Text style={estilos.label}>Qual seu objetivo principal?</Text>
              <View style={estilos.opcoesRowCol}>
                {['Hipertrofia', 'Emagrecimento', 'Definição', 'Ganho de força', 'Condicionamento geral'].map((item) => (
                  <TouchableOpacity key={item} style={[estilos.opcaoCard, objetivoPrincipal === item && estilos.opcaoCardSelecionada]} onPress={() => setObjetivoPrincipal(item)}>
                    <Text style={estilos.opcaoCardTitulo}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[estilos.label, { marginTop: Espacamento.lg }]}>Fora dos treinos, como é sua rotina no dia a dia?</Text>
              <View style={estilos.opcoesRow}>
                {['Sedentário', 'Leve', 'Moderado'].map((item) => (
                  <TouchableOpacity key={item} style={[estilos.opcaoChip, atividadeForaTreino === item && estilos.opcaoChipSelecionada]} onPress={() => setAtividadeForaTreino(item)}>
                    <Text style={estilos.opcaoTexto}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[estilos.label, { marginTop: Espacamento.lg }]}>Qual seu nível de experiência com musculação?</Text>
              <View style={estilos.opcoesRow}>
                {['Iniciante', 'Intermediário', 'Avançado'].map((item) => (
                  <TouchableOpacity key={item} style={[estilos.opcaoChip, nivelExperiencia === item && estilos.opcaoChipSelecionada]} onPress={() => setNivelExperiencia(item)}>
                    <Text style={estilos.opcaoTexto}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </CardVidro>
          </View>
        )}

        {/* ETAPA 3 */}
        {etapa === 3 && (
          <View>
            <Text style={estilos.tituloEtapa}>Rotina de Treino</Text>
            <CardVidro semBorda estilo={estilos.cardStep}>
              <Text style={estilos.label}>Quantos dias por semana você pode treinar? (1 a 7)</Text>
              <TextInput style={estilos.input} keyboardType="numeric" value={diasDisponiveis} onChangeText={setDiasDisponiveis} />

              <Text style={[estilos.label, { marginTop: Espacamento.lg }]}>Onde você vai treinar?</Text>
              <View style={estilos.opcoesRow}>
                {['Academia', 'Casa', 'Peso do corpo'].map((item) => (
                  <TouchableOpacity key={item} style={[estilos.opcaoChip, localTreino === item && estilos.opcaoChipSelecionada]} onPress={() => setLocalTreino(item)}>
                    <Text style={estilos.opcaoTexto}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[estilos.label, { marginTop: Espacamento.lg }]}>Quanto tempo você tem por sessão de treino?</Text>
              <View style={estilos.opcoesRow}>
                {['30 min', '45 min', '1h', '1h30 ou mais'].map((item) => (
                  <TouchableOpacity key={item} style={[estilos.opcaoChip, tempoSessao === item && estilos.opcaoChipSelecionada]} onPress={() => setTempoSessao(item)}>
                    <Text style={estilos.opcaoTexto}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>

            </CardVidro>
          </View>
        )}

        {/* ETAPA 4 */}
        {etapa === 4 && (
          <View>
            <Text style={estilos.tituloEtapa}>Saúde e Alimentação</Text>
            <CardVidro semBorda estilo={estilos.cardStep}>
              <Text style={estilos.label}>Você tem alguma lesão ou restrição física?</Text>
              {[
                'Nenhuma',
                'Joelho',
                'Ombro',
                'Coluna-lombar',
                'Punho',
                'Outra',
              ].map((item) => {
                const sel = restricaoFisica.includes(item);
                return (
                  <TouchableOpacity key={item} style={[estilos.checkboxRow, sel && estilos.checkboxRowSelecionada]} onPress={() => alternarRestricao(item, restricaoFisica, setRestricaoFisica)}>
                    <SymbolView name={sel ? 'checkmark.square.fill' : 'square'} size={20} tintColor={sel ? cores.destaque : cores.textoSecundario} />
                    <Text style={estilos.checkboxLabel}>{item}</Text>
                  </TouchableOpacity>
                );
              })}

              <Text style={[estilos.label, { marginTop: Espacamento.lg }]}>Você tem alguma restrição alimentar?</Text>
              {[
                'Nenhuma',
                'Lactose',
                'Glúten',
                'Vegano',
                'Vegetariano',
                'Outra',
              ].map((item) => {
                const sel = restricaoAlimentar.includes(item);
                return (
                  <TouchableOpacity key={item} style={[estilos.checkboxRow, sel && estilos.checkboxRowSelecionada]} onPress={() => alternarRestricao(item, restricaoAlimentar, setRestricaoAlimentar)}>
                    <SymbolView name={sel ? 'checkmark.square.fill' : 'square'} size={20} tintColor={sel ? cores.destaque : cores.textoSecundario} />
                    <Text style={estilos.checkboxLabel}>{item}</Text>
                  </TouchableOpacity>
                );
              })}

              <Text style={[estilos.label, { marginTop: Espacamento.lg }]}>Quantas refeições por dia você prefere fazer? (2 a 5)</Text>
              <TextInput style={estilos.input} keyboardType="numeric" value={refeicoesPorDia} onChangeText={setRefeicoesPorDia} />
            </CardVidro>
          </View>
        )}

        {/* Botões de Navegação */}
        <View style={estilos.acoesRow}>
          {etapa > 1 && (
            <TouchableOpacity style={estilos.btnVoltar} onPress={() => setEtapa(etapa - 1)}>
              <Text style={estilos.txtVoltar}>Voltar</Text>
            </TouchableOpacity>
          )}

          <BotaoPrimario
            texto={etapa === totalEtapas ? 'Gerar Plano' : 'Próximo'}
            aoPresionar={proximaEtapa}
            estilo={{ flex: 1 }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const criarEstilos = (cores: CoresTema) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  topoHeader: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 10 },
  btnSairQuestionario: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: cores.elevada, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: Raio.full, borderWidth: 1, borderColor: cores.separador,
  },
  txtSairQuestionario: { fontFamily: FamiliaFonte.bold, fontSize: 13, color: cores.texto },
  barraProgressoContainer: { height: 4, backgroundColor: cores.destaqueSuave, width: '100%' },
  barraProgresso: { height: '100%', backgroundColor: cores.destaque },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 60 },
  contadorEtapa: { fontFamily: FamiliaFonte.bold, fontSize: Fonte.micro, color: cores.destaque, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  tituloEtapa: { fontFamily: FamiliaFonte.bold, fontSize: Fonte.subtitulo, fontWeight: PesoFonte.bold, color: cores.texto, marginBottom: Espacamento.lg },
  cardStep: { padding: Espacamento.lg, marginBottom: Espacamento.xl, marginHorizontal: -20 },
  label: { fontFamily: FamiliaFonte.semibold, fontSize: Fonte.corpo, color: cores.texto, marginBottom: 8 },
  input: { backgroundColor: cores.elevada, borderWidth: 1, borderColor: cores.separador, borderRadius: Raio.md, padding: 12, fontSize: Fonte.corpo, color: cores.texto, fontFamily: FamiliaFonte.regular },
  opcoesRow: { flexDirection: 'row', gap: Espacamento.sm, flexWrap: 'wrap' },
  opcoesRowCol: { flexDirection: 'column', gap: Espacamento.sm },
  opcaoChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: Raio.md, backgroundColor: cores.elevada, borderWidth: 1, borderColor: cores.separador },
  opcaoChipSelecionada: { borderColor: cores.destaque, backgroundColor: cores.destaqueSuave },
  opcaoTexto: { fontFamily: FamiliaFonte.regular, fontSize: Fonte.corpo, color: cores.texto },
  opcaoCard: { padding: Espacamento.md, borderRadius: Raio.md, backgroundColor: cores.elevada, borderWidth: 1, borderColor: cores.separador, marginBottom: Espacamento.sm },
  opcaoCardSelecionada: { borderColor: cores.destaque, backgroundColor: cores.destaqueSuave },
  opcaoCardTitulo: { fontFamily: FamiliaFonte.bold, fontSize: Fonte.corpo, color: cores.texto },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: cores.separador },
  checkboxRowSelecionada: { backgroundColor: cores.destaqueSuave, borderRadius: Raio.sm, paddingHorizontal: 8 },
  checkboxLabel: { fontFamily: FamiliaFonte.regular, fontSize: Fonte.corpo, color: cores.texto },
  acoesRow: { flexDirection: 'row', gap: Espacamento.md, alignItems: 'center' },
  btnVoltar: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: Raio.md, borderWidth: 1, borderColor: cores.separador },
  txtVoltar: { fontFamily: FamiliaFonte.semibold, fontSize: Fonte.corpo, color: cores.textoSecundario },
});
