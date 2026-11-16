import {
  anguloComum,
  formatarData,
  frequenciaValida,
  lembreteVencido,
  temFoto,
  validarPeso,
  type Registro,
} from './evolucao';

const reg = (fotos: Partial<Registro['fotos']>): Registro => ({
  id: 'r',
  data: '2026-11-01',
  pesoKg: null,
  mostrarPeso: false,
  fotos: { frente: null, lado: null, costas: null, ...fotos },
  grupos: [],
});

describe('lembreteVencido', () => {
  const hoje = new Date('2026-11-16T12:00:00');
  it('nunca registrou: vencido', () => expect(lembreteVencido('mensal', null, hoje)).toBe(true));
  it('semanal: 6 dias não vence, 7 vence', () => {
    expect(lembreteVencido('semanal', '2026-11-10', hoje)).toBe(false);
    expect(lembreteVencido('semanal', '2026-11-09', hoje)).toBe(true);
  });
  it('mensal: 29 dias não vence, 30 vence', () => {
    expect(lembreteVencido('mensal', '2026-10-18', hoje)).toBe(false);
    expect(lembreteVencido('mensal', '2026-10-17', hoje)).toBe(true);
  });
});

describe('validarPeso', () => {
  it.each([
    ['', null],
    ['  ', null],
    ['80,5', 80.5],
    ['20', 20],
    ['400', 400],
  ])('%p -> %p', (e, s) => expect(validarPeso(e)).toBe(s));
  it.each(['19', '401', 'abc', null, undefined, 80])('recusa %p', (v) => {
    // null, undefined e número não são texto: contam como vazio (sem peso)
    const r = validarPeso(v);
    if (typeof v === 'string') expect(r).toBe('invalido');
    else expect(r).toBeNull();
  });
});

describe('frequenciaValida', () => {
  it('semanal fica; o resto vira mensal', () => {
    expect(frequenciaValida('semanal')).toBe('semanal');
    expect(frequenciaValida('diaria')).toBe('mensal');
    expect(frequenciaValida(null)).toBe('mensal');
  });
});

describe('temFoto e anguloComum', () => {
  it('exige pelo menos 1 foto', () => {
    expect(temFoto({})).toBe(false);
    expect(temFoto({ frente: '' })).toBe(false);
    expect(temFoto({ lado: 'u/a.jpg' })).toBe(true);
  });
  it('acha o ângulo em comum ou null', () => {
    expect(anguloComum(reg({ lado: 'a', costas: 'b' }), reg({ costas: 'c', frente: 'd' }))).toBe(
      'costas',
    );
    expect(anguloComum(reg({ lado: 'a' }), reg({ frente: 'd' }))).toBeNull();
  });
});

it('formatarData', () => expect(formatarData('2026-11-05')).toBe('05/11/2026'));
