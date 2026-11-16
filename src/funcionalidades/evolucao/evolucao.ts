// Regras puras das fotos de evolução (RN29): frequência, lembrete, peso e ângulos.
export type Frequencia = 'semanal' | 'mensal';
export const ANGULOS = ['frente', 'lado', 'costas'] as const;
export type Angulo = (typeof ANGULOS)[number];

export interface Registro {
  id: string;
  data: string; // AAAA-MM-DD
  pesoKg: number | null;
  mostrarPeso: boolean;
  fotos: Record<Angulo, string | null>;
  grupos: string[]; // grupos com que foi compartilhado; vazio = só eu
}

const DIAS_DO_CICLO: Record<Frequencia, number> = { semanal: 7, mensal: 30 };

/** Aceita só 'semanal' ou 'mensal'; qualquer outra coisa vira mensal (o padrão do banco). */
export function frequenciaValida(valor: unknown): Frequencia {
  return valor === 'semanal' ? 'semanal' : 'mensal';
}

function diasEntre(de: string, ate: Date): number {
  const a = new Date(`${de}T00:00:00`);
  return Math.floor((ate.getTime() - a.getTime()) / 86_400_000);
}

/** Lembrete dentro do app: true se nunca registrou ou se o ciclo já passou. */
export function lembreteVencido(
  frequencia: Frequencia,
  ultimaData: string | null,
  hoje: Date = new Date(),
): boolean {
  if (!ultimaData) return true;
  return diasEntre(ultimaData, hoje) >= DIAS_DO_CICLO[frequencia];
}

/** Peso opcional: vazio = sem peso; senão número de 20 a 400. 'invalido' se fora disso. */
export function validarPeso(texto: unknown): number | null | 'invalido' {
  if (typeof texto !== 'string' || texto.trim() === '') return null;
  const n = Number(texto.trim().replace(',', '.'));
  return Number.isFinite(n) && n >= 20 && n <= 400 ? n : 'invalido';
}

/** Pelo menos 1 ângulo com foto. */
export function temFoto(fotos: Partial<Record<Angulo, unknown>>): boolean {
  return ANGULOS.some((a) => typeof fotos[a] === 'string' && fotos[a] !== '');
}

/** Primeiro ângulo que os dois registros têm em comum, para a comparação lado a lado. */
export function anguloComum(a: Registro, b: Registro): Angulo | null {
  return ANGULOS.find((x) => a.fotos[x] && b.fotos[x]) ?? null;
}

export function formatarData(data: string): string {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}
