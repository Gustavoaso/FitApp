// ============================================================
// KNOWLEDGE BASE: TREINO
// ============================================================
// Conhecimento condensado de ciência do treinamento resistido,
// injetado no system prompt da IA pra guiar a montagem de
// planos de treino personalizados.
// ============================================================

export const CONHECIMENTO_TREINO = {
  divisoesPorFrequencia: {
    2: {
      nome: 'Full Body 2x',
      divisao: ['Full Body A', 'Full Body B'],
      regra: 'Todos os grupos por sessão. Compostos prioritários. Alternar variações entre A e B.',
    },
    3: {
      nome: 'Push/Pull/Legs',
      divisao: [
        'Push (Peito/Ombro/Tríceps)',
        'Pull (Costas/Bíceps)',
        'Legs (Pernas/Glúteos)',
      ],
      regra: '4-5 exercícios/sessão. Compostos primeiro, isolados depois.',
    },
    4: {
      nome: 'Upper/Lower 4x',
      divisao: ['Upper A', 'Lower A', 'Upper B', 'Lower B'],
      regra: 'A = força (4-6 reps), B = hipertrofia (8-12 reps). Mesmos grupos, estímulos diferentes.',
    },
    5: {
      nome: 'ABCDE',
      divisao: ['Peito', 'Costas', 'Ombros/Traps', 'Braços', 'Pernas'],
      regra: 'Um grupo/dia. 5-6 exercícios. Volume alto por sessão.',
    },
    6: {
      nome: 'Push/Pull/Legs 2x',
      divisao: ['Push A', 'Pull A', 'Legs A', 'Push B', 'Pull B', 'Legs B'],
      regra: 'Cada grupo 2x/semana. A = pesado/composto, B = leve/isolado. Melhor frequência pra hipertrofia.',
    },
  },

  regrasPeriodizacao: {
    iniciante: {
      seriesPorGrupo: '9-12 séries/semana',
      faixaReps: '8-12',
      descanso: '60-90s isolados, 90-120s compostos',
      progressao: 'Linear: +2.5kg/semana em compostos',
    },
    intermediario: {
      seriesPorGrupo: '12-16 séries/semana',
      faixaReps: '6-12 variando',
      descanso: '60-90s isolados, 120-180s compostos',
      progressao: 'Ondulada: alternar dias pesados/leves',
    },
    avancado: {
      seriesPorGrupo: '16-20 séries/semana',
      faixaReps: '4-20 variando',
      descanso: '90-120s padrão, 180-300s pesados',
      progressao: 'Blocos: acumulação, intensificação, realização',
    },
  },

  principios: [
    'Compostos no início da sessão (maior recrutamento neural)',
    'Volume semanal 10-20 séries/grupo é ótimo pra hipertrofia (Schoenfeld 2017)',
    'Frequência 2x/semana/grupo supera 1x (Schoenfeld 2016)',
    'Descanso: 2-3min força, 1-2min hipertrofia (Grgic 2017)',
    'Toda faixa de reps gera hipertrofia perto da falha (Schoenfeld 2021)',
    'Dias de descanso obrigatórios: síntese proteica dura 48-72h',
  ],

  regrasMontagem: [
    '1-2 compostos pesados primeiro',
    '2-3 acessórios/isolados depois',
    'Mín 1 exercício unilateral por sessão (corrigir assimetrias)',
    'Abdômen 2-3x/semana, não todo dia',
    'Nunca dois exercícios que sobrecarregam mesma articulação em sequência',
    'Posterior de coxa obrigatório em dia de perna (prevenção de lesão)',
  ],
};
