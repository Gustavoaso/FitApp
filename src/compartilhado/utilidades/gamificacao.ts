// Gamificação (RN22): as contas (XP, nível, sequência, conquistas) são feitas no banco
// (função resumo_gamificacao). Aqui só ficam os textos e a comparação de dois resumos.

export interface ResumoGamificacao {
  xp: number;
  nivel: number;
  nomeNivel: string;
  xpNivelAtual: number;
  /** null no último nível. */
  xpProximoNivel: number | null;
  semanasSeguidas: number;
  melhorSequencia: number;
  treinos: number;
  conquistas: string[];
}

export const CONQUISTAS: Record<string, { titulo: string; descricao: string; simbolo: string }> = {
  primeiro_treino: {
    titulo: 'Primeiro treino',
    descricao: 'Concluiu o primeiro treino',
    simbolo: 'figure.strengthtraining.traditional',
  },
  treinos_10: { titulo: '10 treinos', descricao: '10 dias de treino', simbolo: 'flame' },
  treinos_50: { titulo: '50 treinos', descricao: '50 dias de treino', simbolo: 'flame.fill' },
  treinos_100: { titulo: '100 treinos', descricao: '100 dias de treino', simbolo: 'crown' },
  semanas_4: {
    titulo: '4 semanas seguidas',
    descricao: 'Cumpriu o plano 4 semanas seguidas',
    simbolo: 'calendar',
  },
  semanas_12: {
    titulo: '12 semanas seguidas',
    descricao: 'Cumpriu o plano 12 semanas seguidas',
    simbolo: 'calendar.badge.checkmark',
  },
  recorde_carga: {
    titulo: 'Recorde de carga',
    descricao: 'Bateu a própria marca de carga',
    simbolo: 'dumbbell',
  },
};

/** Converte o JSON do banco; recusa o que não tem o formato esperado. */
export function lerResumoGamificacao(bruto: unknown): ResumoGamificacao | null {
  if (!bruto || typeof bruto !== 'object') return null;
  const r = bruto as Record<string, unknown>;
  if (typeof r.xp !== 'number' || typeof r.nivel !== 'number') return null;
  return {
    xp: r.xp,
    nivel: r.nivel,
    nomeNivel: typeof r.nome_nivel === 'string' ? r.nome_nivel : '',
    xpNivelAtual: typeof r.xp_nivel_atual === 'number' ? r.xp_nivel_atual : 0,
    xpProximoNivel: typeof r.xp_proximo_nivel === 'number' ? r.xp_proximo_nivel : null,
    semanasSeguidas: typeof r.semanas_seguidas === 'number' ? r.semanas_seguidas : 0,
    melhorSequencia: typeof r.melhor_sequencia === 'number' ? r.melhor_sequencia : 0,
    treinos: typeof r.treinos === 'number' ? r.treinos : 0,
    conquistas: Array.isArray(r.conquistas)
      ? r.conquistas.filter((c): c is string => typeof c === 'string')
      : [],
  };
}

/** Quanto da barra do nível está cheio (0 a 100). Último nível: cheia. */
export function progressoNivel(resumo: ResumoGamificacao): number {
  if (resumo.xpProximoNivel === null) return 100;
  const faixa = resumo.xpProximoNivel - resumo.xpNivelAtual;
  if (faixa <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round(((resumo.xp - resumo.xpNivelAtual) / faixa) * 100)));
}

/** "1 semana" / "3 semanas". */
export function formatarSemanas(n: number): string {
  return `${n} ${n === 1 ? 'semana' : 'semanas'}`;
}

/** Títulos dos momentos a comemorar depois de um treino: nível novo e medalhas novas. */
export function novidadesDoTreino(
  antes: ResumoGamificacao | null,
  depois: ResumoGamificacao | null,
): { titulo: string; subtitulo?: string }[] {
  // Sem os dois resumos (offline) não dá para saber o que mudou: não comemora às cegas.
  if (!antes || !depois) return [];
  const novidades: { titulo: string; subtitulo?: string }[] = [];
  if (depois.nivel > antes.nivel) {
    novidades.push({ titulo: `Nível ${depois.nivel}`, subtitulo: depois.nomeNivel });
  }
  for (const codigo of depois.conquistas) {
    if (!antes.conquistas.includes(codigo) && CONQUISTAS[codigo]) {
      novidades.push({ titulo: CONQUISTAS[codigo].titulo, subtitulo: 'Nova medalha' });
    }
  }
  return novidades;
}
