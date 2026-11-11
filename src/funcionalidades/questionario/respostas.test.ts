import {
  RESPOSTAS_VAZIAS,
  alternarOpcao,
  blocosDoResumo,
  erroDoPasso,
  montarPayload,
  nivelDaExperiencia,
  respostasDoPayload,
} from './respostas';
import { mapearRespostas } from '@/funcionalidades/plano/mapear-plano';

const COMPLETAS = {
  objetivo: 'Ganho de força',
  sexo: 'Feminino',
  idade: '28',
  altura: '168',
  peso: '75',
  experiencia: '6 meses a 2 anos',
  dias: '4',
  local: 'Academia',
  restricaoFisica: ['Ombro'],
  restricaoAlimentar: ['Lactose', 'Vegano'],
  atividade: 'Leve',
  refeicoes: '5',
};

describe('nivelDaExperiencia', () => {
  it.each([
    ['Nunca treinei', 'Iniciante'],
    ['Menos de 6 meses', 'Iniciante'],
    ['6 meses a 2 anos', 'Intermediário'],
    ['Mais de 2 anos', 'Avançado'],
    ['', 'Iniciante'],
  ])('%s vira %s', (faixa, nivel) => expect(nivelDaExperiencia(faixa)).toBe(nivel));
});

describe('erroDoPasso', () => {
  it('aceita os limites e recusa fora deles', () => {
    expect(erroDoPasso(2, { ...COMPLETAS, idade: '14' })).toBeNull();
    expect(erroDoPasso(2, { ...COMPLETAS, idade: '13' })).toMatch(/14/);
    expect(erroDoPasso(2, { ...COMPLETAS, idade: '101' })).toMatch(/100/);
    expect(erroDoPasso(3, { ...COMPLETAS, peso: '24' })).toMatch(/30/);
    expect(erroDoPasso(3, { ...COMPLETAS, peso: '300' })).toBeNull();
    expect(erroDoPasso(3, { ...COMPLETAS, altura: '99' })).toMatch(/100/);
    expect(erroDoPasso(3, { ...COMPLETAS, altura: '250' })).toBeNull();
  });
  it('dias de 2 a 7 e refeições de 3 a 6', () => {
    expect(erroDoPasso(5, { ...COMPLETAS, dias: '7' })).toBeNull();
    expect(erroDoPasso(5, { ...COMPLETAS, dias: '1' })).not.toBeNull();
    expect(erroDoPasso(5, { ...COMPLETAS, dias: '8' })).not.toBeNull();
    expect(erroDoPasso(10, { ...COMPLETAS, refeicoes: '3' })).toBeNull();
    expect(erroDoPasso(10, { ...COMPLETAS, refeicoes: '6' })).toBeNull();
    expect(erroDoPasso(10, { ...COMPLETAS, refeicoes: '2' })).not.toBeNull();
    expect(erroDoPasso(10, { ...COMPLETAS, refeicoes: '7' })).not.toBeNull();
    expect(erroDoPasso(10, { ...COMPLETAS, refeicoes: '' })).not.toBeNull();
  });
  it('vazio na idade e no peso não passa', () => {
    expect(erroDoPasso(2, RESPOSTAS_VAZIAS)).not.toBeNull();
    expect(erroDoPasso(3, RESPOSTAS_VAZIAS)).not.toBeNull();
  });
});

describe('alternarOpcao', () => {
  it('"Nenhuma" é exclusiva', () => {
    expect(alternarOpcao(['Joelho', 'Ombro'], 'Nenhuma')).toEqual(['Nenhuma']);
    expect(alternarOpcao(['Nenhuma'], 'Joelho')).toEqual(['Joelho']);
    expect(alternarOpcao(['Nenhuma'], 'Nenhuma')).toEqual([]);
  });
  it('marca e desmarca', () => {
    expect(alternarOpcao([], 'Joelho')).toEqual(['Joelho']);
    expect(alternarOpcao(['Joelho', 'Ombro'], 'Joelho')).toEqual(['Ombro']);
  });
});

describe('payload', () => {
  it('monta o que o motor entende', () => {
    const payload = montarPayload(COMPLETAS, 'Atleta');
    expect(payload.objetivo.nivel_experiencia).toBe('Intermediário');
    expect(payload.perfil.altura).toBe(168);
    const entrada = mapearRespostas(payload);
    expect(entrada).toMatchObject({
      objetivo: 'forca',
      nivel: 'intermediario',
      nivelAtividade: 'leve',
      equipamentos: 'academia_completa',
      diasPorSemana: 4,
      restricoes: ['sem_lactose', 'vegano'],
      restricoesFisicas: ['ombro'],
    });
  });

  it('volta para as respostas (ida e volta)', () => {
    const volta = respostasDoPayload(montarPayload(COMPLETAS, 'Atleta'));
    expect(volta).toEqual({ ...COMPLETAS, experiencia: '6 meses a 2 anos' });
  });

  it('aceita o que o Perfil manda (minúsculas, parcial, lixo)', () => {
    const r = respostasDoPayload({
      perfil: { sexo_biologico: 'masculino', idade: 30 },
      objetivo: { objetivo_principal: 'forca', nivel_experiencia: 'avancado' },
      treino: { restricao_fisica: ['Punho', 'Joelho'] },
    });
    expect(r).toMatchObject({
      sexo: 'Masculino',
      idade: '30',
      objetivo: 'Ganho de força',
      experiencia: 'Mais de 2 anos',
      restricaoFisica: ['Joelho'],
      restricaoAlimentar: [],
      peso: '',
    });
    expect(respostasDoPayload(null)).toEqual(RESPOSTAS_VAZIAS);
  });
});

it('resumo agrupa os passos de cada bloco', () => {
  const blocos = blocosDoResumo(COMPLETAS);
  expect(blocos.map((b) => b.passos)).toEqual([[1], [2, 3], [4], [9], [5, 6, 7], [8, 10]]);
  expect(blocos[1].texto).toBe('Feminino · 28 anos · 168 cm · 75 kg');
  expect(blocos[0].texto).toBe('Força');
});
