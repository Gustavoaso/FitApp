import { tempoRelativo, validarTextoPost } from './comunidade';

describe('validarTextoPost', () => {
  it('aceita e apara', () => expect(validarTextoPost('  oi  ')).toEqual({ texto: 'oi' }));
  it('aceita 280', () =>
    expect(validarTextoPost('a'.repeat(280))).toEqual({ texto: 'a'.repeat(280) }));
  it('recusa 281', () => expect(validarTextoPost('a'.repeat(281))).toHaveProperty('erro'));
  it.each([['   '], [''], [null], [undefined], [5]])('recusa %p', (v) =>
    expect(validarTextoPost(v)).toHaveProperty('erro'),
  );
});

describe('tempoRelativo', () => {
  const agora = new Date('2026-11-16T12:00:00Z');
  it('formata', () => {
    expect(tempoRelativo('2026-11-16T11:59:30Z', agora)).toBe('agora');
    expect(tempoRelativo('2026-11-16T11:55:00Z', agora)).toBe('5 min');
    expect(tempoRelativo('2026-11-16T09:00:00Z', agora)).toBe('3 h');
    expect(tempoRelativo('2026-11-14T12:00:00Z', agora)).toBe('2 d');
  });
  it('data inválida vira agora', () => expect(tempoRelativo('x', agora)).toBe('agora'));
});
