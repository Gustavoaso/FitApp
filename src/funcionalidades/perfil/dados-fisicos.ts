// Monta o que a tela de Perfil mostra. O perfil do banco vem primeiro (é o que o
// aceite do plano grava); as respostas do questionário só completam. Sem dado,
// mostra "—" em vez de inventar um valor.

export const SEM_DADO = '—';

const NOMES_OBJETIVO: Record<string, string> = {
  emagrecimento: 'Emagrecimento',
  hipertrofia: 'Hipertrofia',
  definicao: 'Definição Muscular',
  manutencao: 'Manutenção',
  saude: 'Saúde Geral',
};

export interface PerfilParaExibir {
  peso_kg?: number | null;
  altura_cm?: number | null;
  idade?: number | null;
  objetivo?: string | null;
}

export interface DadosFisicos {
  peso: string;
  altura: string;
  idade: string;
  objetivo: string;
}

function numeroValido(...valores: unknown[]): number | null {
  for (const v of valores) {
    const n = typeof v === 'string' ? Number(v.replace(',', '.')) : v;
    if (typeof n === 'number' && Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
}

function textoObjetivo(...valores: unknown[]): string {
  for (const v of valores) {
    if (typeof v !== 'string' || !v.trim()) continue;
    const chave = normalizar(v);
    return NOMES_OBJETIVO[chave] ?? v.trim();
  }
  return SEM_DADO;
}

export function montarDadosFisicos(
  perfil: PerfilParaExibir | null | undefined,
  // Formato livre (JSON salvo no plano): só lemos campos conhecidos.
  respostas: Record<string, unknown> | null | undefined,
  unidades: 'metrico' | 'imperial',
): DadosFisicos {
  const r = respostas && typeof respostas === 'object' ? respostas : {};
  const rPerfil = (r.perfil && typeof r.perfil === 'object' ? r.perfil : {}) as Record<
    string,
    unknown
  >;
  const rObjetivo = r.objetivo;
  const objetivoResposta =
    rObjetivo && typeof rObjetivo === 'object'
      ? (rObjetivo as Record<string, unknown>).objetivo_principal
      : rObjetivo;

  const peso = numeroValido(perfil?.peso_kg, r.pesoKg, rPerfil.peso_atual);
  const altura = numeroValido(perfil?.altura_cm, r.alturaCm, rPerfil.altura);
  const idade = numeroValido(perfil?.idade, r.idade, rPerfil.idade);
  const metrico = unidades === 'metrico';

  return {
    peso: peso === null ? SEM_DADO : metrico ? `${peso} kg` : `${Math.round(peso * 2.20462)} lbs`,
    altura:
      altura === null
        ? SEM_DADO
        : metrico
          ? `${altura} cm`
          : `${Math.floor(altura / 30.48)} ft ${Math.round((altura % 30.48) / 2.54)} in`,
    idade: idade === null ? SEM_DADO : `${idade} anos`,
    objetivo: textoObjetivo(perfil?.objetivo, objetivoResposta),
  };
}
