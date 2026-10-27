import { useColorScheme } from 'react-native';
import { renderHook } from '@testing-library/react-native';
import { useTema } from './useTema';
import { CoresClaro, CoresEscuro } from './tema';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: jest.fn(),
}));
const mockEsquema = useColorScheme as jest.Mock;

it.each([
  ['dark', true, CoresEscuro],
  ['light', false, CoresClaro],
  [null, true, CoresEscuro],
])('esquema %s → escuro=%s', (esquema, escuro, cores) => {
  mockEsquema.mockReturnValue(esquema);
  const { result } = renderHook(() => useTema());
  expect(result.current).toEqual({ escuro, cores });
});
