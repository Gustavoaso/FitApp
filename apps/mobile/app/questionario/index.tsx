// ============================================================
// TELA: Questionário Onboarding / Recálculo IA (app/questionario/index.tsx)
// ============================================================
// Rodada 2 — Ajuste 5:
// Botão de saída no topo (botão 'Cancelar Recálculo' / 'Sair') que permite
// ao usuário desistir e retornar ao perfil sem aplicar mudanças.
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { CardVidro, BotaoPrimario } from '../../componentes/ui';
import { Cores, Espacamento, FamiliaFonte, Fonte, PesoFonte, Raio } from '../../constantes/Cores';
import { OBJETIVOS } from '@fitapp/constantes';
import {
  validarIdade,
  validarPeso,
  validarAltura,
  validarFrequenciaSemanal,
} from '@fitapp/utilidades';
import { gerarPlanoComIA, DadosQuestionario } from '../../servicos/geminiServico';

export default function TelaQuestionario() {
  const router = useRouter();
  const { dadosFormulario } = useLocalSearchParams<{ dadosFormulario?: string }>();

  const [etapa, setEtapa] = useState(1);
  const [carregando, setCarregando] = useState(false);

  // Estado do formulário
  const [sexo, setSexo] = useState<'masculino' | 'feminino'>('masculino');
  const [idade, setIdade] = useState('25');
  const [peso, setPeso] = useState('75');
  const [altura, setAltura] = useState('175');
  const [objetivo, setObjetivo] = useState('hipertrofia');
  const [nivelExperiencia, setNivelExperiencia] = useState('iniciante');
  const [frequencia, setFrequencia] = useState('4');
  const [equipamentos, setEquipamentos] = useState('academia_completa');
  const [restricoes, setRestricoes] = useState<string[]>([]);

  // Carrega respostas salvas se o usuário veio de "Ajustar respostas"
  React.useEffect(() => {
    if (dadosFormulario) {
      try {
        const parsed = JSON.parse(dadosFormulario);
        if (parsed.sexo) setSexo(parsed.sexo);
        if (parsed.idade) setIdade(String(parsed.idade));
        if (parsed.pesoKg) setPeso(String(parsed.pesoKg));
        if (parsed.alturaCm) setAltura(String(parsed.alturaCm));
        if (parsed.objetivo) setObjetivo(parsed.objetivo);
        if (parsed.nivelExperiencia) setNivelExperiencia(parsed.nivelExperiencia);
        if (parsed.frequenciaSemanal) setFrequencia(String(parsed.frequenciaSemanal));
        if (parsed.equipamentos) setEquipamentos(parsed.equipamentos);
        if (parsed.restricoesAlimentares) setRestricoes(parsed.restricoesAlimentares);
      } catch (err) {
        console.warn('Erro ao carregar formulário salvo:', err);
      }
    }
  }, [dadosFormulario]);

  const totalEtapas = 6;

  const alternarRestricao = (item: string) => {
    if (restricoes.includes(item)) {
      setRestricoes(restricoes.filter((r) => r !== item));
    } else {
      setRestricoes([...restricoes, item]);
    }
  };

  const proximaEtapa = () => {
    if (etapa === 1) {
      const v = validarIdade(Number(idade));
      if (!v.valido) return Alert.alert('Aviso', v.mensagem);
    }
    if (etapa === 2) {
      const vp = validarPeso(Number(peso));
      if (!vp.valido) return Alert.alert('Aviso', vp.mensagem);
      const va = validarAltura(Number(altura));
      if (!va.valido) return Alert.alert('Aviso', va.mensagem);
    }
    if (etapa === 4) {
      const vf = validarFrequenciaSemanal(Number(frequencia));
      if (!vf.valido) return Alert.alert('Aviso', vf.mensagem);
    }

    if (etapa < totalEtapas) {
      setEtapa(etapa + 1);
    } else {
      finalizarQuestionario();
    }
  };

  const finalizarQuestionario = async () => {
    setCarregando(true);
    try {
      const payload: DadosQuestionario = {
        nome: 'Atleta',
        idade: Number(idade),
        sexo,
        pesoKg: Number(peso),
        alturaCm: Number(altura),
        objetivo: objetivo as any,
        nivelExperiencia,
        nivelAtividade: 'moderado',
        frequenciaSemanal: Number(frequencia),
        equipamentos,
        restricoesAlimentares: restricoes,
      };

      // Gera o plano utilizando o serviço do Gemini
      const planoGerado = await gerarPlanoComIA(payload);

      setCarregando(false);
      router.replace({
        pathname: '/questionario/resultado',
        params: {
          plano: JSON.stringify(planoGerado),
          respostas: JSON.stringify(payload),
        },
      });
    } catch (err: unknown) {
      setCarregando(false);
      const msg = err instanceof Error ? err.message : 'Erro ao gerar o plano';
      Alert.alert('Erro', msg);
    }
  };

  if (carregando) {
    return (
      <View style={[estilos.container, estilos.centralizado]}>
        <ActivityIndicator size="large" color={Cores.accent} />
        <Text style={estilos.textoCarregando}>Criando seu plano personalizado com IA...</Text>
        <Text style={estilos.subTextoCarregando}>Calculando TMB, calorias e estruturando treinos</Text>
      </View>
    );
  }

  return (
    <View style={estilos.container}>
      {/* Rodada 2 — Ajuste 5: Botão de Sair do Recálculo no Topo */}
      <View style={estilos.topoHeader}>
        <TouchableOpacity
          style={estilos.btnSairQuestionario}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <SymbolView name="xmark" size={14} tintColor="#FFFFFF" weight="bold" />
          <Text style={estilos.txtSairQuestionario}>Cancelar Recálculo</Text>
        </TouchableOpacity>
      </View>

      {/* Barra de Progresso no Topo */}
      <View style={estilos.barraProgressoContainer}>
        <View
          style={[
            estilos.barraProgresso,
            { width: `${(etapa / totalEtapas) * 100}%` },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={estilos.scrollContent}>
        <Text style={estilos.contadorEtapa}>Etapa {etapa} de {totalEtapas}</Text>

        {/* ETAPA 1: Sexo e Idade */}
        {etapa === 1 && (
          <View>
            <Text style={estilos.tituloEtapa}>Seus dados básicos</Text>
            <CardVidro semBorda estilo={estilos.cardStep}>
              <Text style={estilos.label}>Sexo Biológico</Text>
              <View style={estilos.opcoesRow}>
                <TouchableOpacity
                  style={[estilos.opcaoChip, sexo === 'masculino' && estilos.opcaoChipSelecionada]}
                  onPress={() => setSexo('masculino')}
                >
                  <Text style={estilos.opcaoTexto}>Masculino</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[estilos.opcaoChip, sexo === 'feminino' && estilos.opcaoChipSelecionada]}
                  onPress={() => setSexo('feminino')}
                >
                  <Text style={estilos.opcaoTexto}>Feminino</Text>
                </TouchableOpacity>
              </View>

              <Text style={[estilos.label, { marginTop: Espacamento.lg }]}>Idade (anos)</Text>
              <TextInput
                style={estilos.input}
                keyboardType="numeric"
                value={idade}
                onChangeText={setIdade}
              />
            </CardVidro>
          </View>
        )}

        {/* ETAPA 2: Peso e Altura */}
        {etapa === 2 && (
          <View>
            <Text style={estilos.tituloEtapa}>Suas medidas corporais</Text>
            <CardVidro semBorda estilo={estilos.cardStep}>
              <Text style={estilos.label}>Peso Atual (kg)</Text>
              <TextInput
                style={estilos.input}
                keyboardType="numeric"
                value={peso}
                onChangeText={setPeso}
              />

              <Text style={[estilos.label, { marginTop: Espacamento.lg }]}>Altura (cm)</Text>
              <TextInput
                style={estilos.input}
                keyboardType="numeric"
                value={altura}
                onChangeText={setAltura}
              />
            </CardVidro>
          </View>
        )}

        {/* ETAPA 3: Objetivo */}
        {etapa === 3 && (
          <View>
            <Text style={estilos.tituloEtapa}>Qual é o seu objetivo principal?</Text>
            <CardVidro semBorda estilo={estilos.cardStep}>
              {OBJETIVOS.map((obj) => (
                <TouchableOpacity
                  key={obj.valor}
                  style={[
                    estilos.opcaoCard,
                    objetivo === obj.valor && estilos.opcaoCardSelecionada,
                  ]}
                  onPress={() => setObjetivo(obj.valor)}
                >
                  <Text style={estilos.opcaoCardTitulo}>{obj.label}</Text>
                  <Text style={estilos.opcaoCardSub}>{obj.descricao}</Text>
                </TouchableOpacity>
              ))}
            </CardVidro>
          </View>
        )}

        {/* ETAPA 4: Nível e Frequência */}
        {etapa === 4 && (
          <View>
            <Text style={estilos.tituloEtapa}>Seu histórico de treino</Text>
            <CardVidro semBorda estilo={estilos.cardStep}>
              <Text style={estilos.label}>Nível de Experiência</Text>
              <View style={estilos.opcoesRow}>
                {[
                  { id: 'iniciante', label: 'Iniciante' },
                  { id: 'intermediario', label: 'Intermediário' },
                  { id: 'avancado', label: 'Avançado' },
                ].map((n) => (
                  <TouchableOpacity
                    key={n.id}
                    style={[
                      estilos.opcaoChip,
                      nivelExperiencia === n.id && estilos.opcaoChipSelecionada,
                    ]}
                    onPress={() => setNivelExperiencia(n.id)}
                  >
                    <Text style={estilos.opcaoTexto}>{n.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[estilos.label, { marginTop: Espacamento.lg }]}>
                Dias disponíveis por semana (1 a 7)
              </Text>
              <TextInput
                style={estilos.input}
                keyboardType="numeric"
                value={frequencia}
                onChangeText={setFrequencia}
              />
            </CardVidro>
          </View>
        )}

        {/* ETAPA 5: Equipamentos */}
        {etapa === 5 && (
          <View>
            <Text style={estilos.tituloEtapa}>Onde você vai treinar?</Text>
            <CardVidro semBorda estilo={estilos.cardStep}>
              {[
                { id: 'academia_completa', label: 'Academia Completa', desc: 'Acesso a barras, halteres e máquinas' },
                { id: 'halteres_home', label: 'Em Casa (com Halteres)', desc: 'Halteres, elásticos e peso do corpo' },
                { id: 'peso_corpo', label: 'Apenas Peso do Corpo', desc: 'Calistenia e exercícios sem equipamento' },
              ].map((eq) => (
                <TouchableOpacity
                  key={eq.id}
                  style={[
                    estilos.opcaoCard,
                    equipamentos === eq.id && estilos.opcaoCardSelecionada,
                  ]}
                  onPress={() => setEquipamentos(eq.id)}
                >
                  <Text style={estilos.opcaoCardTitulo}>{eq.label}</Text>
                  <Text style={estilos.opcaoCardSub}>{eq.desc}</Text>
                </TouchableOpacity>
              ))}
            </CardVidro>
          </View>
        )}

        {/* ETAPA 6: Restrições Alimentares */}
        {etapa === 6 && (
          <View>
            <Text style={estilos.tituloEtapa}>Restrições Alimentares</Text>
            <CardVidro semBorda estilo={estilos.cardStep}>
              <Text style={estilos.subLabel}>Selecione todas que se aplicam (opcional):</Text>
              {[
                'Sem lactose',
                'Sem glúten',
                'Vegetariano',
                'Vegano',
                'Sem frutos do mar',
                'Diabetes / Low Carb',
              ].map((item) => {
                const sel = restricoes.includes(item);
                return (
                  <TouchableOpacity
                    key={item}
                    style={[estilos.checkboxRow, sel && estilos.checkboxRowSelecionada]}
                    onPress={() => alternarRestricao(item)}
                  >
                    <SymbolView
                      name={sel ? 'checkmark.square.fill' : 'square'}
                      size={20}
                      tintColor={sel ? Cores.accent : Cores.texto.desabilitado}
                    />
                    <Text style={estilos.checkboxLabel}>{item}</Text>
                  </TouchableOpacity>
                );
              })}
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
            texto={etapa === totalEtapas ? 'Gerar Plano com IA' : 'Próximo'}
            aoPresionar={proximaEtapa}
            estilo={{ flex: 1 }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Cores.fundo.principal,
  },
  centralizado: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Espacamento.xl,
  },
  topoHeader: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 10,
  },
  btnSairQuestionario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: Cores.fundo.elevada,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Raio.full,
    borderWidth: 1,
    borderColor: Cores.borda.sutil,
  },
  txtSairQuestionario: {
    fontFamily: FamiliaFonte.bold,
    fontSize: 13,
    color: Cores.texto.principal,
  },

  barraProgressoContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
  },
  barraProgresso: {
    height: '100%',
    backgroundColor: Cores.accent,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 60,
  },
  contadorEtapa: {
    fontFamily: FamiliaFonte.bold,
    fontSize: Fonte.micro,
    color: Cores.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  tituloEtapa: {
    fontFamily: FamiliaFonte.bold,
    fontSize: Fonte.subtitulo,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
    marginBottom: Espacamento.lg,
  },
  cardStep: {
    padding: Espacamento.lg,
    marginBottom: Espacamento.xl,
    marginHorizontal: -20,
  },
  label: {
    fontFamily: FamiliaFonte.semibold,
    fontSize: Fonte.corpo,
    color: Cores.texto.principal,
    marginBottom: 8,
  },
  subLabel: {
    fontFamily: FamiliaFonte.regular,
    fontSize: Fonte.label,
    color: Cores.texto.secundario,
    marginBottom: Espacamento.md,
  },
  input: {
    backgroundColor: Cores.fundo.elevada,
    borderWidth: 1,
    borderColor: Cores.borda.media,
    borderRadius: Raio.md,
    padding: 12,
    fontSize: Fonte.corpo,
    color: Cores.texto.principal,
    fontFamily: FamiliaFonte.regular,
  },
  opcoesRow: {
    flexDirection: 'row',
    gap: Espacamento.sm,
    flexWrap: 'wrap',
  },
  opcaoChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Raio.md,
    backgroundColor: Cores.fundo.elevada,
    borderWidth: 1,
    borderColor: Cores.borda.sutil,
  },
  opcaoChipSelecionada: {
    borderColor: Cores.accent,
    backgroundColor: Cores.accentSuave,
  },
  opcaoTexto: {
    fontFamily: FamiliaFonte.regular,
    fontSize: Fonte.corpo,
    color: Cores.texto.principal,
  },
  opcaoCard: {
    padding: Espacamento.md,
    borderRadius: Raio.md,
    backgroundColor: Cores.fundo.elevada,
    borderWidth: 1,
    borderColor: Cores.borda.sutil,
    marginBottom: Espacamento.sm,
  },
  opcaoCardSelecionada: {
    borderColor: Cores.accent,
    backgroundColor: Cores.accentSuave,
  },
  opcaoCardTitulo: {
    fontFamily: FamiliaFonte.bold,
    fontSize: Fonte.corpo,
    color: Cores.texto.principal,
  },
  opcaoCardSub: {
    fontFamily: FamiliaFonte.regular,
    fontSize: Fonte.label,
    color: Cores.texto.secundario,
    marginTop: 2,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Cores.borda.sutil,
  },
  checkboxRowSelecionada: {
    backgroundColor: Cores.accentSuave,
    borderRadius: Raio.sm,
    paddingHorizontal: 8,
  },
  checkboxLabel: {
    fontFamily: FamiliaFonte.regular,
    fontSize: Fonte.corpo,
    color: Cores.texto.principal,
  },
  acoesRow: {
    flexDirection: 'row',
    gap: Espacamento.md,
    alignItems: 'center',
  },
  btnVoltar: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: Raio.md,
    borderWidth: 1,
    borderColor: Cores.borda.sutil,
  },
  txtVoltar: {
    fontFamily: FamiliaFonte.semibold,
    fontSize: Fonte.corpo,
    color: Cores.texto.secundario,
  },
  textoCarregando: {
    fontFamily: FamiliaFonte.bold,
    fontSize: Fonte.subtitulo,
    color: Cores.texto.principal,
    marginTop: 20,
    textAlign: 'center',
  },
  subTextoCarregando: {
    fontFamily: FamiliaFonte.regular,
    fontSize: Fonte.label,
    color: Cores.texto.secundario,
    marginTop: 8,
    textAlign: 'center',
  },
});
