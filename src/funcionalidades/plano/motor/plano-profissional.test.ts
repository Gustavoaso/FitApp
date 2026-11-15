// Testes da RN19: cada regra do plano "com cara de profissional", feita por código.
import type { GrupoMuscular } from '@/compartilhado/tipos';
import { focoDoDia, montarDivisaoSemanal, montarSlotsDia, nomearDias } from './divisao-semanal';
import { escolherSubstituicao, medidaCaseira, nomearRefeicoes } from './dieta-rotina';
import { conferirTolerancia } from './gramas';
import { montarPorQue, type ContextoPorQue } from './por-que';
import {
  montarAquecimento,
  montarProgressao,
  ordenarSessao,
  prescreverPorPapel,
} from './prescricao';
import { refeicoesDoDia } from './schema-prompt';
import type { AlimentoCandidato, EscolhaLLM, ExercicioCandidato } from './tipos';
import { montarPlano, validarEscolha } from './validador';

const alimento = (
  id: string,
  slot: AlimentoCandidato['slot'],
  [kcal, proteina, carboidrato, gordura]: number[],
  porcao?: [string, number],
): AlimentoCandidato => ({
  id,
  nome: id,
  slot,
  kcal,
  proteina,
  carboidrato,
  gordura,
  restricoesAtendidas: ['sem_lactose', 'sem_gluten'],
  ...(porcao ? { porcaoDescricao: porcao[0], porcaoGramas: porcao[1] } : {}),
});

const FRANGO = alimento('frango', 'proteina', [159, 32, 0, 3.2], ['1 filé', 100]);
const PATINHO = alimento('patinho', 'proteina', [219, 35.9, 0, 7.3], ['1 bife', 100]);
const OVO = alimento('ovo', 'proteina', [146, 13.3, 0.6, 9.5]);
const ARROZ = alimento('arroz', 'carboidrato', [128, 2.5, 28.1, 0.2], ['4 colheres de sopa', 100]);
const BATATA = alimento('batata', 'carboidrato', [52, 1.2, 11.9, 0], ['1 unidade', 130]);
const AZEITE = alimento('azeite', 'complemento', [884, 0, 0, 100], ['1 colher de sopa', 13]);
const CASTANHA = alimento('castanha', 'complemento', [643, 14.5, 15.1, 63.5]);
const ALIMENTOS = [FRANGO, PATINHO, OVO, ARROZ, BATATA, AZEITE, CASTANHA];

const ex = (grupo: GrupoMuscular, composto: boolean, n = 1): ExercicioCandidato => ({
  id: `${grupo}-${n}`,
  nome: `${grupo} ${n}`,
  grupo,
  composto,
  equipamento: 'academia_completa',
});

describe('prescrição por objetivo, nível e papel (RN19)', () => {
  it('força: principal pesado e longo descanso; isolado mais leve', () => {
    expect(prescreverPorPapel('forca', 'avancado', 'principal')).toEqual({
      series: 4,
      repeticoes: '3-5',
      descansoSegundos: 180,
      repeticoesReserva: 2,
    });
    expect(prescreverPorPapel('forca', 'avancado', 'isolado').repeticoes).toBe('8-12');
  });

  it('o nível muda séries e repetições na reserva', () => {
    const iniciante = prescreverPorPapel('hipertrofia', 'iniciante', 'isolado');
    const avancado = prescreverPorPapel('hipertrofia', 'avancado', 'isolado');
    expect(iniciante).toMatchObject({ series: 2, repeticoesReserva: 3 });
    expect(avancado).toMatchObject({ series: 3, repeticoesReserva: 1 });
  });

  it('o objetivo muda a faixa e o descanso do mesmo papel', () => {
    const hipertrofia = prescreverPorPapel('hipertrofia', 'intermediario', 'principal');
    const condicionamento = prescreverPorPapel('condicionamento', 'intermediario', 'principal');
    expect(hipertrofia.repeticoes).not.toBe(condicionamento.repeticoes);
    expect(hipertrofia.descansoSegundos).toBeGreaterThan(condicionamento.descansoSegundos);
  });

  it.each([
    ['forca', 'mestre', 'principal'],
    [undefined, 'iniciante', 'principal'],
    ['forca', 'iniciante', 'aquecimento'],
  ])('recusa %p / %p / %p', (objetivo, nivel, papel) => {
    expect(() => prescreverPorPapel(objetivo as never, nivel as never, papel as never)).toThrow();
  });
});

describe('ordem da sessão (RN19)', () => {
  it('compostos principais → acessórios → isolados; abdômen no fim do grupo', () => {
    const sessao = ordenarSessao([
      ex('biceps', false),
      ex('abdomen', false),
      ex('peito', true),
      ex('peito', true, 2),
      ex('triceps', false),
      ex('costas', true),
      ex('ombros', true),
    ]);
    expect(sessao.map((e) => [e.id, e.papel])).toEqual([
      ['peito-1', 'principal'],
      ['costas-1', 'principal'],
      ['peito-2', 'acessorio'],
      ['ombros-1', 'acessorio'],
      ['biceps-1', 'isolado'],
      ['triceps-1', 'isolado'],
      ['abdomen-1', 'isolado'],
    ]);
  });

  it('sem composto não há principal; lista vazia fica vazia', () => {
    expect(ordenarSessao([ex('biceps', false)])[0].papel).toBe('isolado');
    expect(ordenarSessao([])).toEqual([]);
  });
});

describe('aquecimento (RN19)', () => {
  it('academia, dia de pernas: bicicleta, mobilidade de perna e séries de preparação', () => {
    const passos = montarAquecimento(
      ['quadriceps', 'posterior'],
      { nome: 'Leg press', equipamento: 'academia_completa' },
      'academia_completa',
    );
    expect(passos[0]).toContain('bicicleta');
    expect(passos.some((p) => p.includes('agachamentos sem peso'))).toBe(true);
    expect(passos.some((p) => p.includes('círculos de braço'))).toBe(false);
    expect(passos[passos.length - 1]).toContain('séries de preparação em Leg press');
  });

  it('joelho: sem salto nem agachamento no aquecimento e com aviso', () => {
    const passos = montarAquecimento(['quadriceps'], undefined, 'peso_corporal', ['joelho']);
    expect(passos.join(' ')).not.toMatch(/agachamento|polichinelo/);
    expect(passos[passos.length - 1]).toContain('Você marcou joelho');
  });

  it('não avisa do ombro num dia só de pernas', () => {
    const passos = montarAquecimento(['quadriceps'], undefined, 'home_gym', ['ombro']);
    expect(passos.join(' ')).not.toContain('ombro:');
  });
});

describe('progressão de 4 semanas (RN19)', () => {
  it('dupla progressão: repetição até o teto, depois carga', () => {
    const ciclo = montarProgressao('intermediario', 'academia_completa');
    expect(ciclo.map((s) => s.semana)).toEqual([1, 2, 3, 4]);
    expect(ciclo[1].orientacao).toContain('Some 1 repetição');
    expect(ciclo[2].orientacao).toContain('Suba a carga');
    expect(ciclo[3].titulo).toBe('Consolidação');
  });

  it('iniciante tem semana 4 mais leve', () => {
    expect(montarProgressao('iniciante', 'academia_completa')[3]).toMatchObject({
      titulo: 'Semana leve',
    });
  });

  it('peso do corpo sobe a dificuldade, não a carga', () => {
    const ciclo = montarProgressao('avancado', 'peso_corporal');
    expect(ciclo[2].titulo).toBe('Sobe a dificuldade');
    expect(ciclo.map((s) => s.orientacao).join(' ')).not.toContain('Suba a carga');
  });

  it('recusa nível inválido', () => {
    expect(() => montarProgressao('mestre' as never, 'home_gym')).toThrow();
  });
});

describe('nome do dia pelo foco (RN19)', () => {
  it.each([
    [['peito', 'ombros', 'triceps'], 'Peito, ombros e tríceps'],
    [['costas', 'biceps', 'antebraco'], 'Costas e bíceps'],
    [['quadriceps', 'posterior', 'gluteos', 'panturrilha', 'abdomen'], 'Pernas e glúteos'],
    [['peito', 'costas', 'ombros', 'biceps', 'triceps'], 'Peito, costas, ombros e braços'],
    [['corpo_inteiro'], 'Corpo inteiro'],
    [[], 'Treino'],
  ])('%p → %p', (grupos, nome) => {
    expect(focoDoDia(grupos as GrupoMuscular[])).toBe(nome);
  });

  it('nenhum dia se chama "Treino A"; focos repetidos ganham A e B', () => {
    const nomes = nomearDias(montarDivisaoSemanal(6).map((d) => d.grupos));
    expect(nomes[0]).toBe('Peito, ombros e tríceps A');
    expect(nomes[3]).toBe('Peito, ombros e tríceps B');
    nomes.forEach((n) => expect(n).not.toMatch(/^Treino/));
  });
});

describe('refeições pela rotina (RN19)', () => {
  it.each([3, 4, 5, 6])('%i refeições por dia', (n) => {
    expect(refeicoesDoDia(n)).toHaveLength(n);
  });

  it.each([2, 7, NaN])('fora de 3 a 6 (%p) usa as 4 padrão', (n) => {
    expect(refeicoesDoDia(n)).toEqual(['cafe', 'almoco', 'lanche', 'jantar']);
  });

  it('pré-treino é o lanche da tarde e pós-treino o jantar', () => {
    const nomeadas = nomearRefeicoes(refeicoesDoDia(5), 'sedentario');
    expect(nomeadas.find((r) => r.momentoTreino === 'pre')?.nome).toBe('Lanche da tarde');
    expect(nomeadas.find((r) => r.momentoTreino === 'pos')?.nome).toBe('Jantar');
    expect(nomeadas[0].horario).toBe('07:00');
  });

  it('com 3 refeições o pré-treino vira o almoço; quem é ativo toma café mais cedo', () => {
    const nomeadas = nomearRefeicoes(refeicoesDoDia(3), 'moderado');
    expect(nomeadas.map((r) => r.momentoTreino)).toEqual([undefined, 'pre', 'pos']);
    expect(nomeadas[0].horario).toBe('06:30');
  });
});

describe('medida caseira (RN19)', () => {
  it.each([
    [180, '4 colheres de sopa', 100, 'cerca de 7 colheres de sopa'],
    [150, '1 filé', 100, 'cerca de 1,5 filés'],
    [100, '1 filé', 100, 'cerca de 1 filé'],
    [60, '1 unidade', 130, 'cerca de 1/2 unidade'],
    [100, '6 unidades', 100, 'cerca de 6 unidades'],
    [25, '1 fatia', 30, 'cerca de 1 fatia'],
    [150, '1 porção', 100, 'cerca de 1,5 porções'],
  ])('%i g com "%s" (%i g) → %s', (gramas, descricao, porcao, esperado) => {
    expect(medidaCaseira(gramas, descricao, porcao)).toBe(esperado);
  });

  it.each([
    [100, null, 100],
    [100, undefined, undefined],
    [100, 'uma concha', 100],
    [100, '1 concha', 0],
    [0, '1 concha', 100],
    [5, '1 filé', 100],
  ])('sem medida possível (%p, %p, %p) → undefined', (gramas, descricao, porcao) => {
    expect(medidaCaseira(gramas, descricao, porcao)).toBeUndefined();
  });
});

describe('substituição (RN19)', () => {
  it('troca proteína por proteína, com a mesma proteína em gramas', () => {
    const troca = escolherSubstituicao(FRANGO, 150, ALIMENTOS);
    expect(troca?.nome).toBe('patinho');
    // 150 g de frango = 48 g de proteína; 48 / 0,359 ≈ 134 g → 135 g.
    expect(troca?.porcao).toBe('135g');
    expect(troca?.medidaCaseira).toBe('cerca de 1,5 bifes');
  });

  it('não sugere o que já está na refeição nem troca de slot', () => {
    const troca = escolherSubstituicao(FRANGO, 150, ALIMENTOS, ['patinho']);
    expect(troca?.nome).toBe('ovo');
    expect(escolherSubstituicao(AZEITE, 10, ALIMENTOS)?.nome).toBe('castanha');
  });

  it('sem outro candidato do slot, sem troca', () => {
    expect(escolherSubstituicao(ARROZ, 100, [ARROZ, FRANGO])).toBeUndefined();
    expect(escolherSubstituicao(ARROZ, 0, ALIMENTOS)).toBeUndefined();
  });
});

const CONTEXTO: ContextoPorQue = {
  objetivo: 'hipertrofia',
  nivel: 'iniciante',
  diasPorSemana: 3,
  equipamentos: 'home_gym',
  restricoes: [],
  restricoesFisicas: [],
  caloriasAlvo: 2500,
  tdee: 2270,
  proteinasG: 188,
  pesoKg: 78,
  dias: ['peito, ombros e tríceps', 'costas e bíceps', 'pernas e glúteos'],
  repeticoesPrincipal: '6-10',
  repeticoesReserva: 3,
  refeicoes: 4,
  fontes: ['Schoenfeld et al., 2017'],
};

describe('"Por que este plano" (RN19)', () => {
  it('de 3 a 5 frases citando objetivo, dias, local e a fonte', () => {
    const frases = montarPorQue(CONTEXTO);
    expect(frases.length).toBeGreaterThanOrEqual(3);
    expect(frases.length).toBeLessThanOrEqual(5);
    const texto = frases.join(' ');
    expect(texto).toContain('ganhar massa muscular');
    expect(texto).toContain('3 dias por semana');
    expect(texto).toContain('em casa, com halteres');
    expect(texto).toContain('230 kcal acima');
    expect(texto).toContain('2,4 g por kg');
    expect(texto).toContain('Schoenfeld et al., 2017');
  });

  it('lesão e restrição alimentar entram e o texto não passa de 5 frases', () => {
    const frases = montarPorQue({
      ...CONTEXTO,
      restricoesFisicas: ['joelho', 'coluna'],
      restricoes: ['vegano', 'sem_gluten'],
    });
    expect(frases).toHaveLength(5);
    const texto = frases.join(' ');
    expect(texto).toContain('joelho (sem salto');
    expect(texto).toContain('sem nada de origem animal e sem trigo');
    expect(texto).toContain('Schoenfeld et al., 2017');
  });

  it('dois perfis distintos geram textos distintos', () => {
    const outro = montarPorQue({
      ...CONTEXTO,
      objetivo: 'emagrecimento',
      nivel: 'avancado',
      diasPorSemana: 5,
      equipamentos: 'academia_completa',
      caloriasAlvo: 1600,
      tdee: 2000,
      repeticoesReserva: 1,
    });
    const base = montarPorQue(CONTEXTO);
    outro.forEach((frase, i) => expect(frase).not.toBe(base[i]));
    expect(outro.join(' ')).toContain('400 kcal abaixo');
    expect(outro.join(' ')).toContain('1 repetição sobrando');
  });

  it('referência completa que termina em ponto não vira ".."', () => {
    const texto = montarPorQue({ ...CONTEXTO, fontes: ['Kerksick CM, et al. JISSN. 2017;14:33.'] });
    expect(texto.join(' ')).toContain('2017;14:33.');
    expect(texto.join(' ')).not.toContain('..');
  });

  it('sem fonte não inventa uma', () => {
    expect(montarPorQue({ ...CONTEXTO, fontes: [] }).join(' ')).not.toContain('seguem');
  });
});

describe('montagem com prescrição por papel e 6 refeições (RN19)', () => {
  const slots = montarDivisaoSemanal(3).map((d) => montarSlotsDia(d, 'intermediario'));
  const exercicios: ExercicioCandidato[] = slots.flatMap((s) =>
    s.porGrupo.flatMap(({ grupo }) => [1, 2].map((n) => ex(grupo, n === 1, n))),
  );
  const refeicoes = refeicoesDoDia(6);
  const refeicao = { proteina: 'frango', carboidrato: 'arroz', complemento: 'azeite' };
  const escolha: EscolhaLLM = {
    dias: slots.map((s) => ({
      exercicios: Object.fromEntries(
        s.porGrupo.map(({ grupo, quantidade }) => [
          grupo,
          [1, 2].slice(0, quantidade).map((n) => `${grupo}-${n}`),
        ]),
      ),
    })),
    refeicoes: Object.fromEntries(refeicoes.map((r) => [r, refeicao])),
  };
  const meta = { calorias: 2400, proteinas: 180, carboidratos: 270, gorduras: 67 };

  it('cada exercício leva a prescrição do seu papel e o dia fecha ±5%', () => {
    const { plano, erros } = montarPlano(
      escolha,
      slots,
      exercicios,
      ALIMENTOS,
      (papel) => prescreverPorPapel('hipertrofia', 'intermediario', papel),
      meta,
      refeicoes,
    );
    expect(erros).toEqual([]);
    expect(plano!.refeicoes.map((r) => r.refeicao)).toEqual(refeicoes);
    expect(conferirTolerancia(plano!.totalDia, meta)).toEqual([]);
    const [primeiro, ...resto] = plano!.dias[0].exercicios;
    expect(primeiro).toMatchObject({
      papel: 'principal',
      repeticoes: '6-10',
      repeticoesReserva: 2,
    });
    const isolado = resto.find((e) => e.papel === 'isolado');
    expect(isolado).toMatchObject({ repeticoes: '10-15', descansoSegundos: 60 });
  });

  it('o validador cobra todas as refeições pedidas', () => {
    const semCeia = { ...escolha, refeicoes: { ...escolha.refeicoes, ceia: undefined } };
    const { erros } = validarEscolha(semCeia, slots, exercicios, ALIMENTOS, {
      equipamentos: 'academia_completa',
      restricoesAlimentares: [],
      refeicoes,
    });
    expect(erros).toContain('ceia: proteina ausente ou fora da base.');
  });
});
