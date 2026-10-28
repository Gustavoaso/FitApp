import { traduzirErroAuth } from './AuthContexto';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@/compartilhado/supabase', () => ({ supabase: {} }));

it('traduz credenciais inválidas e falha de rede', () => {
  expect(traduzirErroAuth({ message: 'Invalid login credentials' })).toBe(
    'E-mail ou senha incorretos.',
  );
  expect(traduzirErroAuth({ message: 'Network request failed' })).toMatch(/conectar/);
});

it('nunca devolve a mensagem em inglês de um erro desconhecido', () => {
  expect(traduzirErroAuth({ message: 'Something odd happened' })).toBe(
    'Não foi possível concluir a autenticação. Tente de novo.',
  );
  expect(traduzirErroAuth({})).toMatch(/^Não foi possível/);
});

it('sem erro devolve null', () => {
  expect(traduzirErroAuth(null)).toBeNull();
});
