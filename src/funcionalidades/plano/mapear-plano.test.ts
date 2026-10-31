import type { DadosQuestionario } from '@/compartilhado/tipos';
import {
  equipamentosDaBase,
  mapearAlimento,
  mapearExercicio,
  mapearRespostas,
  perfilDoQuestionario,
  respeitaRestricoesFisicas,
  termosExcluidos,
  type LinhaAlimento,
} from './mapear-plano';

const linhaAlimento = (parcial: Partial<LinhaAlimento>): LinhaAlimento => ({
  id: 1,
  nome: 'Alimento',
  categoria: 'outros',
  calorias_100g: 100,
  proteinas_100g: 0,
  carboidratos_100g: 0,
  gorduras_100g: 0,
  ...parcial,
});

describe('mapearRespostas', () => {
  const base: DadosQuestionario = {
    perfil: {
      nome: 'Pessoa Teste',
      sexo_biologico: 'Feminino',
      idade: 28,
      peso_atual: 60,
      altura: 165,
    },
    objetivo: {
      objetivo_principal: 'Ganho de força',
      atividade_fora_treino: 'Sedentário',
      nivel_experiencia: 'Avançado',
    },
    treino: {
      dias_disponiveis_semana: 3,
      local_treino: 'Casa',
      tempo_sessao: '45 min',
      divisao_preferida: '',
      restricao_fisica: [],
    },
    dieta: { restricao_alimentar: ['Lactose', 'Glúten', 'Outra'], refeicoes_por_dia: 4 },
  };

  it('perfilDoQuestionario usa os valores aceitos pela tabela perfis, sem nome', () => {
    expect(perfilDoQuestionario(base)).toEqual({
      idade: 28,
      sexo: 'feminino',
      pesoKg: 60,
      alturaCm: 165,
      nivelExperiencia: 'avancado',
      nivelAtividade: 'sedentario',
      objetivo: 'forca',
      frequenciaSemanal: 3,
    });
    expect(perfilDoQuestionario({ perfil: base.perfil } as unknown as DadosQuestionario)).toEqual(
      {},
    );
  });

  it('traduz os textos da tela e não leva o nome', () => {
    const entrada = mapearRespostas(base);
    expect(entrada).toEqual({
      sexo: 'feminino',
      idade: 28,
      pesoKg: 60,
      alturaCm: 165,
      nivelAtividade: 'sedentario',
      objetivo: 'forca',
      nivel: 'avancado',
      diasPorSemana: 3,
      equipamentos: 'home_gym',
      restricoes: ['sem_lactose', 'sem_gluten'],
      restricoesFisicas: [],
    });
    expect(JSON.stringify(entrada)).not.toContain('Pessoa Teste');
  });

  it('"Nenhuma" não vira restrição e "Peso do corpo" vira peso corporal', () => {
    const entrada = mapearRespostas({
      ...base,
      treino: { ...base.treino, local_treino: 'Peso do corpo' },
      dieta: { ...base.dieta, restricao_alimentar: ['Nenhuma'] },
    });
    expect(entrada.restricoes).toEqual([]);
    expect(entrada.equipamentos).toBe('peso_corporal');
  });
});

describe('mapearExercicio', () => {
  it('traduz grupo e equipamento da base', () => {
    expect(
      mapearExercicio({
        id: 'a',
        nome: 'Stiff',
        grupo_primario: 'isquiotibiais, gluteos',
        equipamento: 'halteres',
        tipo_movimento: 'composto',
      }),
    ).toEqual({
      id: 'a',
      nome: 'Stiff',
      grupo: 'posterior',
      composto: true,
      equipamento: 'home_gym',
    });
  });

  it('funcional vira corpo inteiro; peso do corpo vira peso corporal', () => {
    const e = mapearExercicio({
      id: 'b',
      nome: 'Burpee',
      grupo_primario: 'quadriceps',
      equipamento: 'peso-do-corpo',
      tipo_movimento: 'funcional',
    });
    expect(e?.grupo).toBe('corpo_inteiro');
    expect(e?.equipamento).toBe('peso_corporal');
  });

  it('descarta grupo desconhecido (pescoço)', () => {
    expect(
      mapearExercicio({
        id: 'c',
        nome: 'Pescoço',
        grupo_primario: 'pescoco',
        equipamento: 'maquina',
        tipo_movimento: 'isolado',
      }),
    ).toBeNull();
  });
});

describe('mapearAlimento', () => {
  it('classifica pelo macro dominante', () => {
    expect(
      mapearAlimento(
        linhaAlimento({
          nome: 'Frango',
          calorias_100g: 159,
          proteinas_100g: 32,
          gorduras_100g: 3.2,
        }),
      )?.slot,
    ).toBe('proteina');
    expect(
      mapearAlimento(
        linhaAlimento({
          nome: 'Arroz',
          calorias_100g: 128,
          proteinas_100g: 2.5,
          carboidratos_100g: 28,
        }),
      )?.slot,
    ).toBe('carboidrato');
    expect(
      mapearAlimento(linhaAlimento({ nome: 'Azeite', calorias_100g: 884, gorduras_100g: 100 }))
        ?.slot,
    ).toBe('complemento');
  });

  it('limite: 40% das kcal em proteína já é proteína', () => {
    expect(
      mapearAlimento(
        linhaAlimento({ calorias_100g: 100, proteinas_100g: 10, carboidratos_100g: 15 }),
      )?.slot,
    ).toBe('proteina');
  });

  it('marca as restrições que o alimento respeita, na dúvida exclui', () => {
    const frango = mapearAlimento(
      linhaAlimento({ nome: 'Frango grelhado', calorias_100g: 159, proteinas_100g: 32 }),
    );
    expect(frango?.restricoesAtendidas).toEqual(['sem_lactose', 'sem_gluten']);
    const queijo = mapearAlimento(
      linhaAlimento({ nome: 'Queijo minas', calorias_100g: 264, proteinas_100g: 27 }),
    );
    expect(queijo?.restricoesAtendidas).toEqual(['vegetariano', 'sem_gluten']);
    const tofu = mapearAlimento(
      linhaAlimento({ nome: 'Tofu', calorias_100g: 120, proteinas_100g: 13 }),
    );
    expect(tofu?.restricoesAtendidas).toEqual([
      'vegetariano',
      'vegano',
      'sem_lactose',
      'sem_gluten',
    ]);
  });

  it('recusa macro misto, kcal zero e valores inválidos', () => {
    expect(
      mapearAlimento(
        linhaAlimento({
          calorias_100g: 100,
          proteinas_100g: 5,
          carboidratos_100g: 10,
          gorduras_100g: 4,
        }),
      ),
    ).toBeNull();
    expect(mapearAlimento(linhaAlimento({ calorias_100g: 0 }))).toBeNull();
    expect(mapearAlimento(linhaAlimento({ calorias_100g: NaN }))).toBeNull();
    expect(
      mapearAlimento(linhaAlimento({ proteinas_100g: undefined as unknown as number })),
    ).toBeNull();
  });
});

describe('restrição física', () => {
  const base: DadosQuestionario = {
    perfil: { nome: '', sexo_biologico: 'Masculino', idade: 45, peso_atual: 90, altura: 175 },
    objetivo: {
      objetivo_principal: 'Emagrecimento',
      atividade_fora_treino: 'Sedentário',
      nivel_experiencia: 'Iniciante',
    },
    treino: {
      dias_disponiveis_semana: 3,
      local_treino: 'Academia',
      tempo_sessao: '60 min',
      divisao_preferida: '',
      restricao_fisica: ['Joelho', 'Coluna-lombar', 'Punho'],
    },
    dieta: { restricao_alimentar: ['Nenhuma'], refeicoes_por_dia: 4 },
  };

  it('traduz joelho e coluna; punho ainda não tem regra', () => {
    expect(mapearRespostas(base).restricoesFisicas).toEqual(['joelho', 'coluna']);
  });

  it('recusa "Nenhuma" e campo ausente (dado antigo)', () => {
    expect(
      mapearRespostas({ ...base, treino: { ...base.treino, restricao_fisica: ['Nenhuma'] } })
        .restricoesFisicas,
    ).toEqual([]);
    const semCampo = {
      ...base,
      treino: { ...base.treino, restricao_fisica: undefined as unknown as string[] },
    };
    expect(mapearRespostas(semCampo).restricoesFisicas).toEqual([]);
  });

  it('joelho exclui impacto, salto e flexão profunda, sem acento e sem caixa', () => {
    for (const nome of [
      'Salto Diagonal Alternado com as Pernas',
      'Agachamento Goblet',
      'AFUNDO Caminhando',
      'Leg Press 45',
      'Pulo na Caixa',
      'Avanço com Halteres',
    ]) {
      expect(respeitaRestricoesFisicas(nome, ['joelho'])).toBe(false);
    }
    expect(respeitaRestricoesFisicas('Cadeira Flexora', ['joelho'])).toBe(true);
    expect(respeitaRestricoesFisicas('Supino Reto com Barra', ['joelho'])).toBe(true);
  });

  it('ombro exclui carga acima da cabeça; coluna exclui terra e bom dia', () => {
    expect(respeitaRestricoesFisicas('Desenvolvimento Militar em Pé', ['ombro'])).toBe(false);
    expect(respeitaRestricoesFisicas('Elevação Lateral com Halteres', ['ombro'])).toBe(true);
    expect(respeitaRestricoesFisicas('Levantamento Terra com Barra', ['coluna'])).toBe(false);
    expect(respeitaRestricoesFisicas('Bom Dia Sentado', ['coluna'])).toBe(false);
    expect(respeitaRestricoesFisicas('Puxada Frontal', ['coluna'])).toBe(true);
  });

  it('sem restrição, tudo passa', () => {
    expect(respeitaRestricoesFisicas('Salto na Caixa', [])).toBe(true);
  });
});

describe('proteína vegetal (vegano)', () => {
  const feijao = linhaAlimento({
    nome: 'Feijão Preto Cozido',
    categoria: 'leguminosas',
    calorias_100g: 77,
    proteinas_100g: 4.5,
    carboidratos_100g: 14,
    gorduras_100g: 0.5,
  });
  const arroz = linhaAlimento({
    nome: 'Arroz Branco Cozido',
    categoria: 'cereais',
    calorias_100g: 128,
    proteinas_100g: 2.5,
    carboidratos_100g: 28,
    gorduras_100g: 0.2,
  });

  it('leguminosa vira proteína só para o vegano', () => {
    expect(mapearAlimento(feijao)?.slot).toBe('carboidrato');
    expect(mapearAlimento(feijao, true)?.slot).toBe('proteina');
    expect(mapearAlimento(feijao, true)?.restricoesAtendidas).toContain('vegano');
  });

  it('tofu vira proteína e cereal continua carboidrato', () => {
    const tofu = linhaAlimento({
      nome: 'Tofu',
      categoria: 'outros',
      calorias_100g: 120,
      proteinas_100g: 8,
      carboidratos_100g: 13,
      gorduras_100g: 4,
    });
    expect(mapearAlimento(tofu, true)?.slot).toBe('proteina');
    expect(mapearAlimento(arroz, true)?.slot).toBe('carboidrato');
  });
});

describe('filtros das RPCs do RAG híbrido', () => {
  it('equipamento: academia sem filtro; casa inclui o corpo; corpo só o corpo, sem acento', () => {
    expect(equipamentosDaBase('academia_completa')).toBeNull();
    const casa = equipamentosDaBase('home_gym');
    expect(casa).toEqual(expect.arrayContaining(['halteres', 'kettlebell', 'peso-do-corpo']));
    expect(casa).not.toContain('barra');
    const corpo = equipamentosDaBase('peso_corporal');
    expect(corpo).toContain('nao especificado');
    expect(corpo).not.toContain('halteres');
  });

  it('termos: nenhuma ou lista vazia não exclui nada; vegano soma os do vegetariano sem repetir', () => {
    expect(termosExcluidos([])).toEqual([]);
    expect(termosExcluidos(['nenhuma'])).toEqual([]);
    const vegano = termosExcluidos(['vegano']);
    expect(vegano).toEqual(expect.arrayContaining(['ovo', 'leite', 'frango', 'carne']));
    const juntos = termosExcluidos(['vegano', 'sem_lactose']);
    expect(juntos.filter((t) => t === 'leite')).toHaveLength(1);
    expect(termosExcluidos(['sem_gluten'])).toContain('pao');
    expect(termosExcluidos(['sem_gluten'])).not.toContain('leite');
  });
});

describe('fonte de carboidrato', () => {
  it('abaixo de 12 g/100 g não vira carboidrato; no limite, vira', () => {
    const leite = linhaAlimento({ calorias_100g: 35, proteinas_100g: 3.4, carboidratos_100g: 5 });
    const limite = linhaAlimento({ calorias_100g: 56, proteinas_100g: 1, carboidratos_100g: 12 });
    expect(mapearAlimento(leite)).toBeNull();
    expect(mapearAlimento(limite)?.slot).toBe('carboidrato');
  });
});
