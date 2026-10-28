// Sequência de dias seguidos com treino registrado. Conta até hoje; se hoje ainda
// não teve treino, a sequência que terminou ontem continua valendo (o dia não acabou).
// Sem nenhum treino, é 0.

function diaAnterior(dia: string): string {
  const data = new Date(`${dia}T12:00:00Z`);
  data.setUTCDate(data.getUTCDate() - 1);
  return data.toISOString().slice(0, 10);
}

/** `datasTreino` e `hoje` no formato YYYY-MM-DD. */
export function calcularSequenciaDias(datasTreino: readonly string[], hoje: string): number {
  const dias = new Set(datasTreino.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)));
  if (dias.size === 0 || !/^\d{4}-\d{2}-\d{2}$/.test(hoje)) return 0;

  let dia = dias.has(hoje) ? hoje : diaAnterior(hoje);
  let sequencia = 0;
  while (dias.has(dia)) {
    sequencia += 1;
    dia = diaAnterior(dia);
  }
  return sequencia;
}
