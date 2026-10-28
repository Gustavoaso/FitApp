import { camposPendentes, type RespostasEmEdicao } from './campos-pendentes';

const VAZIO: RespostasEmEdicao = {
  sexo: '',
  idade: '',
  peso: '',
  altura: '',
  objetivo: '',
  atividade: '',
  nivel: '',
  dias: '',
  local: '',
  tempo: '',
  restricaoFisica: [],
  restricaoAlimentar: [],
  refeicoes: '',
};

it('começando vazio, nenhuma etapa deixa avançar', () => {
  expect(camposPendentes(1, VAZIO)).toEqual(['sexo biológico', 'idade', 'peso', 'altura']);
  expect(camposPendentes(2, VAZIO)).toHaveLength(3);
  expect(camposPendentes(3, VAZIO)).toHaveLength(3);
  expect(camposPendentes(4, VAZIO)).toEqual([
    'restrição física',
    'restrição alimentar',
    'refeições por dia',
  ]);
});

it('etapa preenchida não tem pendência; espaço em branco não conta como resposta', () => {
  const etapa1 = { ...VAZIO, sexo: 'Feminino', idade: '30', peso: '75', altura: '168' };
  expect(camposPendentes(1, etapa1)).toEqual([]);
  expect(camposPendentes(1, { ...etapa1, peso: '  ' })).toEqual(['peso']);
});

it('restrições aceitam "Nenhuma" como resposta', () => {
  const etapa4 = {
    ...VAZIO,
    restricaoFisica: ['Nenhuma'],
    restricaoAlimentar: ['Lactose'],
    refeicoes: '4',
  };
  expect(camposPendentes(4, etapa4)).toEqual([]);
});

it('etapa desconhecida não bloqueia', () => {
  expect(camposPendentes(9, VAZIO)).toEqual([]);
});
