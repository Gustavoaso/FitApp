import {
  formatarSemanas,
  lerResumoGamificacao,
  novidadesDoTreino,
  progressoNivel,
  type ResumoGamificacao,
} from './gamificacao';

const base: ResumoGamificacao = {
  xp: 275,
  nivel: 2,
  nomeNivel: 'Aprendiz',
  xpNivelAtual: 150,
  xpProximoNivel: 400,
  semanasSeguidas: 1,
  melhorSequencia: 1,
  treinos: 3,
  conquistas: ['primeiro_treino'],
};

describe('lerResumoGamificacao', () => {
  it('converte o JSON do banco', () => {
    expect(
      lerResumoGamificacao({
        xp: 275,
        nivel: 2,
        nome_nivel: 'Aprendiz',
        xp_nivel_atual: 150,
        xp_proximo_nivel: 400,
        semanas_seguidas: 1,
        melhor_sequencia: 1,
        treinos: 3,
        conquistas: ['primeiro_treino'],
      }),
    ).toEqual(base);
  });

  it('recusa null, undefined e tipo errado', () => {
    expect(lerResumoGamificacao(null)).toBeNull();
    expect(lerResumoGamificacao(undefined)).toBeNull();
    expect(lerResumoGamificacao('x')).toBeNull();
    expect(lerResumoGamificacao({ xp: '10', nivel: 1 })).toBeNull();
  });
});

describe('progressoNivel', () => {
  it('percentual dentro da faixa do nível', () => {
    expect(progressoNivel(base)).toBe(50);
  });
  it('limites: início da faixa, último nível e faixa inválida', () => {
    expect(progressoNivel({ ...base, xp: 150 })).toBe(0);
    expect(progressoNivel({ ...base, xpProximoNivel: null })).toBe(100);
    expect(progressoNivel({ ...base, xpProximoNivel: 150 })).toBe(100);
  });
});

describe('novidadesDoTreino', () => {
  it('nível novo e medalha nova, na ordem', () => {
    const depois = {
      ...base,
      nivel: 3,
      nomeNivel: 'Praticante',
      conquistas: ['primeiro_treino', 'treinos_10'],
    };
    expect(novidadesDoTreino(base, depois)).toEqual([
      { titulo: 'Nível 3', subtitulo: 'Praticante' },
      { titulo: '10 treinos', subtitulo: 'Nova medalha' },
    ]);
  });
  it('nada mudou ou sem resumo: nada a comemorar', () => {
    expect(novidadesDoTreino(base, base)).toEqual([]);
    expect(novidadesDoTreino(null, base)).toEqual([]);
    expect(novidadesDoTreino(base, null)).toEqual([]);
  });
  it('ignora medalha desconhecida', () => {
    expect(novidadesDoTreino(base, { ...base, conquistas: ['primeiro_treino', 'x'] })).toEqual([]);
  });
});

describe('formatarSemanas', () => {
  it('singular e plural', () => {
    expect(formatarSemanas(1)).toBe('1 semana');
    expect(formatarSemanas(3)).toBe('3 semanas');
  });
});
