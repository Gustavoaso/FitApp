import type { DadosQuestionario } from '@/compartilhado/tipos';
import { mapearRespostas, type LinhaExercicio } from './mapear-plano';
import { montarDivisaoSemanal, montarSlotsDia } from './motor/divisao-semanal';
import { selecionarExercicios } from './selecionar-exercicios';

// Dados fictícios.
const linha = (id: string, parcial: Partial<LinhaExercicio>): LinhaExercicio => ({
  id, nome: `Exercício ${id}`, grupo_primario: 'peito', equipamento: 'barra', tipo_movimento: 'composto',
  nivel: 'iniciante', grupo_secundario: null, ...parcial,
});

const respostas = (treino: Partial<DadosQuestionario['treino']>, nivel = 'Iniciante'): DadosQuestionario => ({
  perfil: { nome: '', sexo_biologico: 'Masculino', idade: 40, peso_atual: 80, altura: 178 },
  objetivo: { objetivo_principal: 'Hipertrofia', atividade_fora_treino: 'Leve', nivel_experiencia: nivel },
  treino: { dias_disponiveis_semana: 3, local_treino: 'Academia', tempo_sessao: '60 min', divisao_preferida: '', restricao_fisica: ['Nenhuma'], ...treino },
  dieta: { restricao_alimentar: ['Nenhuma'], refeicoes_por_dia: 4 },
});

const slotsPernas = () => [montarSlotsDia(montarDivisaoSemanal(3)[2], 'iniciante')];

describe('selecionarExercicios', () => {
  it('joelho: exercícios de impacto e agachamento ficam fora dos candidatos', () => {
    const linhas = [
      linha('salto', { nome: 'Salto Diagonal Alternado', grupo_primario: 'quadriceps' }),
      linha('agacha', { nome: 'Agachamento Livre', grupo_primario: 'quadriceps' }),
      linha('flexora', { nome: 'Cadeira Flexora', grupo_primario: 'isquiotibiais', equipamento: 'maquina' }),
      linha('ponte', { nome: 'Ponte de Glúteo', grupo_primario: 'gluteos', equipamento: 'peso-do-corpo' }),
    ];
    const com = selecionarExercicios(linhas, mapearRespostas(respostas({ restricao_fisica: ['Joelho'] })), slotsPernas(), 4);
    expect(com.exercicios.map((e) => e.id)).toEqual(['flexora', 'ponte']);
    const sem = selecionarExercicios(linhas, mapearRespostas(respostas({})), slotsPernas(), 4);
    expect(sem.exercicios.map((e) => e.id)).toEqual(expect.arrayContaining(['salto', 'agacha']));
  });

  it('degraus: amplia o nível e depois usa o grupo secundário', () => {
    const linhas = [
      linha('peito-avancado', { nivel: 'avancado' }),
      linha('remada', { grupo_primario: 'costas', grupo_secundario: 'biceps, antebracos' }),
    ];
    const slots = [{ nome: 'Puxar', porGrupo: [{ grupo: 'peito' as const, quantidade: 1 }, { grupo: 'costas' as const, quantidade: 1 }, { grupo: 'biceps' as const, quantidade: 1 }] }];
    const r = selecionarExercicios(linhas, mapearRespostas(respostas({})), slots, 4);
    expect(r.exercicios).toEqual([
      expect.objectContaining({ id: 'peito-avancado', grupo: 'peito' }),
      expect.objectContaining({ id: 'remada', grupo: 'costas' }),
    ]);
    // A remada já está em costas: não entra duas vezes, então bíceps fica vazio.
    expect(r.slots[0].porGrupo.map((p) => p.grupo)).toEqual(['peito', 'costas']);
    expect(r.avisos).toHaveLength(1);
  });

  it('nunca amplia o equipamento: peso do corpo sem bíceps → grupo sai do dia com aviso', () => {
    const linhas = [
      linha('rosca', { grupo_primario: 'biceps', equipamento: 'barra' }),
      linha('flexao', { nome: 'Flexão de Braço', equipamento: 'peso-do-corpo' }),
    ];
    const slots = [{ nome: 'Superior', porGrupo: [{ grupo: 'peito' as const, quantidade: 2 }, { grupo: 'biceps' as const, quantidade: 1 }] }];
    const r = selecionarExercicios(linhas, mapearRespostas(respostas({ local_treino: 'Peso do corpo' })), slots, 4);
    expect(r.exercicios.map((e) => e.id)).toEqual(['flexao']);
    expect(r.slots[0].porGrupo).toEqual([{ grupo: 'peito', quantidade: 2 }]);
    expect(r.avisos).toEqual([expect.stringContaining('bíceps')]);
  });

  it('corta por grupo com compostos primeiro', () => {
    const linhas = [1, 2, 3].map((n) => linha(`p${n}`, { tipo_movimento: n === 3 ? 'composto' : 'isolado' }));
    const slots = [{ nome: 'Empurrar', porGrupo: [{ grupo: 'peito' as const, quantidade: 2 }] }];
    expect(selecionarExercicios(linhas, mapearRespostas(respostas({})), slots, 2).exercicios.map((e) => e.id)).toEqual(['p3', 'p1']);
  });

  it('base vazia: todos os grupos saem, sem quebrar', () => {
    const r = selecionarExercicios([], mapearRespostas(respostas({})), slotsPernas(), 4);
    expect(r.exercicios).toEqual([]);
    expect(r.slots[0].porGrupo).toEqual([]);
    expect(r.avisos.length).toBe(5);
  });
});
