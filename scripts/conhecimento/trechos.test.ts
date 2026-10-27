// Trechos da base de conhecimento (RN15): quantidade, tamanho, fonte e filtros válidos.
import trechos from './trechos.json';

const OBJETIVOS = ['hipertrofia', 'definicao', 'forca', 'emagrecimento', 'condicionamento'];
const NIVEIS = ['iniciante', 'intermediario', 'avancado'];
const TIPOS = ['treino', 'nutricao', 'saude'];

const contarPalavras = (texto: string) => texto.trim().split(/\s+/).length;

describe('trechos da base de conhecimento', () => {
  it('tem de 40 a 60 trechos', () => {
    expect(trechos.length).toBeGreaterThanOrEqual(40);
    expect(trechos.length).toBeLessThanOrEqual(60);
  });

  it.each(trechos.map((t) => [t.titulo, t]))(
    '"%s" tem fonte, tamanho e filtros válidos',
    (_, t) => {
      expect(typeof t.fonte).toBe('string');
      // Fonte com autor/instituição e ano, não só um nome solto.
      expect(t.fonte.trim().length).toBeGreaterThan(30);
      expect(t.fonte).toMatch(/(19|20)\d{2}/);
      expect(contarPalavras(t.conteudo)).toBeGreaterThanOrEqual(100);
      expect(contarPalavras(t.conteudo)).toBeLessThanOrEqual(300);
      expect(TIPOS).toContain(t.tipo);
      expect(t.tema.length).toBeGreaterThan(0);
      t.objetivos.forEach((o) => expect(OBJETIVOS).toContain(o));
      t.niveis.forEach((n) => expect(NIVEIS).toContain(n));
    },
  );

  it('não repete título (chave do upsert)', () => {
    const titulos = trechos.map((t) => t.titulo);
    expect(new Set(titulos).size).toBe(titulos.length);
  });
});
