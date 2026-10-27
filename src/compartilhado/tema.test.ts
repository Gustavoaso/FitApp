import { CoresClaro, CoresEscuro, razaoContraste, Tipografia } from './tema';

describe('razaoContraste', () => {
  it('dá 21 entre preto e branco e 1 entre cores iguais', () => {
    expect(razaoContraste('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    expect(razaoContraste('#FFFFFF', '#000000')).toBeCloseTo(21, 1);
    expect(razaoContraste('#777777', '#777777')).toBe(1);
  });

  it('recusa cor fora do formato #RRGGBB', () => {
    expect(() => razaoContraste('rgba(0,0,0,1)', '#FFFFFF')).toThrow();
    expect(() => razaoContraste('#FFF', '#FFFFFF')).toThrow();
    expect(() => razaoContraste(null as unknown as string, '#FFFFFF')).toThrow();
    expect(() => razaoContraste(undefined as unknown as string, '#FFFFFF')).toThrow();
  });
});

describe.each([
  ['escuro', CoresEscuro],
  ['claro', CoresClaro],
])('tema %s', (_nome, cores) => {
  it('texto secundário tem contraste de pelo menos 4,5:1 no fundo e no card', () => {
    expect(razaoContraste(cores.textoSecundario, cores.fundo)).toBeGreaterThanOrEqual(4.5);
    expect(razaoContraste(cores.textoSecundario, cores.superficie)).toBeGreaterThanOrEqual(4.5);
    expect(razaoContraste(cores.textoSecundario, cores.elevada)).toBeGreaterThanOrEqual(4.5);
  });

  it('texto do botão principal tem contraste de pelo menos 4,5:1', () => {
    expect(razaoContraste(cores.textoSobreDestaque, cores.destaque)).toBeGreaterThanOrEqual(4.5);
  });
});

it('a escala tipográfica não tem nada abaixo de 13 pt', () => {
  expect(Math.min(...Object.values(Tipografia))).toBeGreaterThanOrEqual(13);
});
