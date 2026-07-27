// ============================================================
// TELA: Questionário Onboarding (app/questionario/index.tsx)
// ============================================================
// Fluxo em 6 etapas para coletar o perfil do usuário e chamar
// a Edge Function `gerar-plano` via Supabase.
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { CardVidro, BotaoPrimario } from '../../componentes/ui';
import { Cores, Espacamento, Fonte, PesoFonte, Raio } from '../../constantes/Cores';
import { OBJETIVOS } from '@fitapp/constantes';
import { supabase } from '../../servicos/supabase';
import {
  validarIdade,
  validarPeso,
  validarAltura,
  validarFrequenciaSemanal,
} from '@fitapp/utilidades';

export default function TelaQuestionario() {
  const router = useRouter();
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
      // Prepara o payload para a Edge Function
      const payload = {
        nome: 'Atleta',
        idade: Number(idade),
        sexo,
        pesoKg: Number(peso),
        alturaCm: Number(altura),
        objetivo,
        nivelExperiencia,
        nivelAtividade: 'moderado',
        frequenciaSemanal: Number(frequencia),
        equipamentos,
        restricoesAlimentares: restricoes,
      };

      // Chama a Edge Function `gerar-plano` no Supabase
      const { data, error } = await supabase.functions.invoke('gerar-plano', {
        body: payload,
      });

      if (error) {
        throw new Error(error.message);
      }

      setCarregando(false);
      // Navega para a tela de resultado com o plano gerado
      router.replace({
        pathname: '/questionario/resultado',
        params: { plano: JSON.stringify(data) },
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
        <ActivityIndicator size="large" color={Cores.primaria.base} />
        <Text style={estilos.textoCarregando}>Criando seu plano personalizado com IA...</Text>
        <Text style={estilos.subTextoCarregando}>Calculando TMB, calorias e estruturando treinos</Text>
      </View>
    );
  }

  return (
    <View style={estilos.container}>
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
            <CardVidro estilo={estilos.cardStep}>
              <Text style={estilos.label}>Sexo Biológico</Text>
              <View style={estilos.opcoesRow}>
                <TouchableOpacity
                  style={[estilos.opcaoChip, sexo === 'masculino' && estilos.opcaoChipSelecionada]}
                  onPress={() => setSexo('masculino')}
                >
                  <Text style={estilos.opcaoTexto}>👨 Masculino</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[estilos.opcaoChip, sexo === 'feminino' && estilos.opcaoChipSelecionada]}
                  onPress={() => setSexo('feminino')}
                >
                  <Text style={estilos.opcaoTexto}>👩 Feminino</Text>
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
            <CardVidro estilo={estilos.cardStep}>
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
            <View style={{ gap: Espacamento.md }}>
              {OBJETIVOS.map((obj) => (
                <TouchableOpacity
                  key={obj.valor}
                  onPress={() => setObjetivo(obj.valor)}
                >
                  <CardVidro
                    estilo={
                      objetivo === obj.valor
                        ? estilos.cardObjetivoSelecionado
                        : undefined
                    }
                  >
                    <Text style={estilos.objetivoLabel}>{obj.label}</Text>
                    <Text style={estilos.objetivoDesc}>{obj.descricao}</Text>
                  </CardVidro>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ETAPA 4: Experiência e Frequência */}
        {etapa === 4 && (
          <View>
            <Text style={estilos.tituloEtapa}>Rotina de treinos</Text>
            <CardVidro estilo={estilos.cardStep}>
              <Text style={estilos.label}>Nível de Experiência</Text>
              <View style={estilos.opcoesCol}>
                {['iniciante', 'intermediario', 'avancado'].map((niv) => (
                  <TouchableOpacity
                    key={niv}
                    style={[estilos.opcaoChip, nivelExperiencia === niv && estilos.opcaoChipSelecionada]}
                    onPress={() => setNivelExperiencia(niv)}
                  >
                    <Text style={estilos.opcaoTexto}>
                      {niv === 'iniciante' ? '🌱 Iniciante' : niv === 'intermediario' ? '🌿 Intermediário' : '🌳 Avançado'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[estilos.label, { marginTop: Espacamento.lg }]}>Dias disponíveis por semana (2-6)</Text>
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
            <View style={{ gap: Espacamento.md }}>
              {[
                { val: 'academia_completa', title: '🏋️ Academia Completa', desc: 'Acesso a barras, halteres e máquinas' },
                { val: 'home_gym', title: '🏠 Home Gym', desc: 'Alguns halteres e elásticos em casa' },
                { val: 'peso_corporal', title: '🤸 Peso Corporal', desc: 'Calistenia e exercícios sem equipamento' },
              ].map((item) => (
                <TouchableOpacity key={item.val} onPress={() => setEquipamentos(item.val)}>
                  <CardVidro estilo={equipamentos === item.val ? estilos.cardObjetivoSelecionado : undefined}>
                    <Text style={estilos.objetivoLabel}>{item.title}</Text>
                    <Text style={estilos.objetivoDesc}>{item.desc}</Text>
                  </CardVidro>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ETAPA 6: Restrições Alimentares */}
        {etapa === 6 && (
          <View>
            <Text style={estilos.tituloEtapa}>Alguma restrição alimentar?</Text>
            <CardVidro estilo={estilos.cardStep}>
              {[
                { val: 'vegetariano', label: '🥗 Vegetariano' },
                { val: 'vegano', label: '🌱 Vegano' },
                { val: 'sem_lactose', label: '🥛 Intolerante a Lactose' },
                { val: 'sem_gluten', label: '🌾 Sem Glúten' },
              ].map((item) => {
                const checked = restricoes.includes(item.val);
                return (
                  <TouchableOpacity
                    key={item.val}
                    style={[estilos.opcaoChip, checked && estilos.opcaoChipSelecionada, { marginBottom: Espacamento.sm }]}
                    onPress={() => alternarRestricao(item.val)}
                  >
                    <Text style={estilos.opcaoTexto}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </CardVidro>
          </View>
        )}

        {/* Botões de Ação */}
        <View style={estilos.acoes}>
          {etapa > 1 && (
            <TouchableOpacity style={estilos.botaoVoltar} onPress={() => setEtapa(etapa - 1)}>
              <Text style={estilos.textoVoltar}>Voltar</Text>
            </TouchableOpacity>
          )}

          <BotaoPrimario
            texto={etapa === totalEtapas ? 'Gerar Meu Plano' : 'Avançar'}
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
    padding: Espacamento.xxl,
  },
  textoCarregando: {
    color: Cores.texto.principal,
    fontSize: Fonte.subtitulo,
    fontWeight: PesoFonte.bold,
    marginTop: Espacamento.lg,
    textAlign: 'center',
  },
  subTextoCarregando: {
    color: Cores.texto.secundario,
    fontSize: Fonte.corpo,
    marginTop: 4,
    textAlign: 'center',
  },
  barraProgressoContainer: {
    height: 4,
    backgroundColor: Cores.vidro.fundo,
    width: '100%',
  },
  barraProgresso: {
    height: '100%',
    backgroundColor: Cores.primaria.base,
  },
  scrollContent: {
    padding: Espacamento.xxl,
  },
  contadorEtapa: {
    color: Cores.secundaria,
    fontSize: Fonte.label,
    fontWeight: PesoFonte.bold,
    marginBottom: Espacamento.xs,
    textTransform: 'uppercase',
  },
  tituloEtapa: {
    fontSize: Fonte.titulo,
    fontWeight: PesoFonte.extrabold,
    color: Cores.texto.principal,
    marginBottom: Espacamento.xl,
  },
  cardStep: {
    marginBottom: Espacamento.xl,
  },
  label: {
    fontSize: Fonte.label,
    fontWeight: PesoFonte.medio,
    color: Cores.texto.secundario,
    marginBottom: Espacamento.sm,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Cores.vidro.borda,
    borderRadius: Raio.md,
    padding: Espacamento.md,
    fontSize: Fonte.corpo,
    color: Cores.texto.principal,
  },
  opcoesRow: {
    flexDirection: 'row',
    gap: Espacamento.md,
  },
  opcoesCol: {
    gap: Espacamento.sm,
  },
  opcaoChip: {
    flex: 1,
    padding: Espacamento.md,
    borderRadius: Raio.md,
    borderWidth: 1,
    borderColor: Cores.vidro.borda,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
  },
  opcaoChipSelecionada: {
    borderColor: Cores.primaria.base,
    backgroundColor: Cores.primaria.suave,
  },
  opcaoTexto: {
    color: Cores.texto.principal,
    fontWeight: PesoFonte.medio,
  },
  objetivoLabel: {
    fontSize: Fonte.subtitulo,
    fontWeight: PesoFonte.bold,
    color: Cores.texto.principal,
    marginBottom: 4,
  },
  objetivoDesc: {
    fontSize: Fonte.label,
    color: Cores.texto.secundario,
  },
  cardObjetivoSelecionado: {
    borderColor: Cores.primaria.base,
    borderWidth: 1,
  },
  acoes: {
    flexDirection: 'row',
    gap: Espacamento.md,
    marginTop: Espacamento.xl,
  },
  botaoVoltar: {
    justifyContent: 'center',
    paddingHorizontal: Espacamento.lg,
  },
  textoVoltar: {
    color: Cores.texto.secundario,
    fontSize: Fonte.corpo,
    fontWeight: PesoFonte.bold,
  },
});
