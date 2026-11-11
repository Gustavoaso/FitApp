import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import TelaQuestionario from './TelaQuestionario';
import { RESPOSTAS_VAZIAS, montarPayload } from './respostas';

const mockReplace = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    back: jest.fn(),
    canGoBack: () => true,
    dismissTo: jest.fn(),
  }),
  useLocalSearchParams: () => mockParams,
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));
jest.mock('@/compartilhado/supabase', () => ({
  supabase: { auth: { getUser: async () => ({ data: { user: null } }) } },
}));
jest.mock('@/compartilhado/servicos/consentimento-servico', () => ({
  possuiConsentimentoSaude: async () => true,
}));
const mockArmazem = new Map<string, string>();
jest.mock('@/compartilhado/servicos/armazenamento-usuario', () => ({
  armazenamentoUsuario: {
    getItem: async (c: string) => mockArmazem.get(c) ?? null,
    setItem: async (c: string, v: string) => void mockArmazem.set(c, v),
    removeItem: async (c: string) => void mockArmazem.delete(c),
  },
}));

const CHAVE = '@fitapp_rascunho_questionario';
const COMPLETAS = {
  objetivo: 'Hipertrofia',
  sexo: 'Masculino',
  idade: '28',
  altura: '178',
  peso: '76',
  experiencia: '6 meses a 2 anos',
  dias: '4',
  local: 'Academia',
  restricaoFisica: ['Ombro'],
  restricaoAlimentar: ['Lactose'],
  atividade: 'Leve',
  refeicoes: '5',
};

function rascunho(passo: number, respostas = {}) {
  mockArmazem.set(
    CHAVE,
    JSON.stringify({ passo, respostas: { ...RESPOSTAS_VAZIAS, ...respostas } }),
  );
}
const rascunhoSalvo = () => JSON.parse(mockArmazem.get(CHAVE) ?? 'null');

beforeEach(() => {
  mockArmazem.clear();
  mockParams = {};
  mockReplace.mockClear();
});

it('começa no passo 1 e escolha única avança ao tocar, salvando o rascunho', async () => {
  await render(<TelaQuestionario />);
  expect(await screen.findByText('1 de 10')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Voltar' })).toBeNull();

  await fireEvent.press(screen.getByRole('radio', { name: 'Hipertrofia' }));
  expect(await screen.findByText('2 de 10')).toBeTruthy();
  await waitFor(() => expect(screen.getByText('Rascunho salvo')).toBeTruthy());
  expect(rascunhoSalvo()).toMatchObject({ passo: 2, respostas: { objetivo: 'Hipertrofia' } });
});

it('Continuar fica desligado até responder e Voltar retorna', async () => {
  rascunho(2, { objetivo: 'Hipertrofia' });
  await render(<TelaQuestionario />);
  expect(await screen.findByText('Sexo biológico e idade')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();
  expect(screen.getByText(/Falta escolher: sexo biológico/)).toBeTruthy();

  await fireEvent.press(screen.getByRole('radio', { name: 'Feminino' }));
  expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
  expect(await screen.findByText('3 de 10')).toBeTruthy();
  // A idade que estava na roda (padrão 30) virou resposta.
  expect(rascunhoSalvo().respostas).toMatchObject({ sexo: 'Feminino', idade: '30' });

  await fireEvent.press(screen.getByRole('button', { name: 'Voltar' }));
  expect(await screen.findByText('2 de 10')).toBeTruthy();
});

it('peso fora do limite mostra o erro e bloqueia o Continuar', async () => {
  rascunho(3, { altura: '178', peso: '24' });
  await render(<TelaQuestionario />);
  expect(await screen.findByText(/Peso mínimo: 30 kg/)).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();
});

it('multiescolha: "Nenhuma" é exclusiva', async () => {
  rascunho(7);
  await render(<TelaQuestionario />);
  await fireEvent.press(await screen.findByRole('checkbox', { name: 'Joelho' }));
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Nenhuma' }));
  expect(screen.getByRole('checkbox', { name: 'Joelho' })).not.toBeChecked();
  expect(screen.getByRole('checkbox', { name: 'Nenhuma' })).toBeChecked();
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Ombro' }));
  expect(screen.getByRole('checkbox', { name: 'Nenhuma' })).not.toBeChecked();
});

it('resumo: editar um bloco volta ao resumo e gerar leva ao resultado', async () => {
  rascunho(11, COMPLETAS);
  await render(<TelaQuestionario />);
  expect(await screen.findByText('Confira suas respostas')).toBeTruthy();
  expect(screen.getByText('Nível calculado: intermediário')).toBeTruthy();

  await fireEvent.press(screen.getByRole('button', { name: 'Editar Objetivo' }));
  expect(await screen.findByText('1 de 10')).toBeTruthy();
  await fireEvent.press(screen.getByRole('radio', { name: 'Emagrecimento' }));
  expect(await screen.findByText('Confira suas respostas')).toBeTruthy();
  expect(screen.getByText('Emagrecimento')).toBeTruthy();

  await fireEvent.press(screen.getByRole('button', { name: 'Gerar meu plano' }));
  await waitFor(() => expect(mockReplace).toHaveBeenCalled());
  const chamada = mockReplace.mock.calls[0][0];
  expect(chamada.pathname).toBe('/questionario/resultado');
  expect(JSON.parse(chamada.params.respostas)).toEqual(
    montarPayload({ ...COMPLETAS, objetivo: 'Emagrecimento' }, 'Atleta'),
  );
  expect(mockArmazem.has(CHAVE)).toBe(false);
});

it('resumo: editar o perfil percorre os passos 2 e 3 e volta', async () => {
  rascunho(11, COMPLETAS);
  await render(<TelaQuestionario />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Editar Perfil' }));
  expect(await screen.findByText('2 de 10')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
  expect(await screen.findByText('3 de 10')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
  expect(await screen.findByText('Confira suas respostas')).toBeTruthy();
});

it('refazer: vem preenchido, com aviso e "Manter e continuar"', async () => {
  mockParams = { dadosFormulario: JSON.stringify(montarPayload(COMPLETAS, 'Atleta')) };
  await render(<TelaQuestionario />);
  expect(await screen.findByText(/Preenchido com as suas respostas anteriores/)).toBeTruthy();
  expect(screen.getByRole('radio', { name: 'Hipertrofia' })).toBeChecked();
  await fireEvent.press(screen.getByRole('button', { name: 'Manter e continuar' }));
  expect(await screen.findByText('2 de 10')).toBeTruthy();
});
