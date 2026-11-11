// Semana de domingo a sábado que contém uma data (YYYY-MM-DD).

export interface DiaSemana {
  abrev: string;
  diaNum: string;
  data: string;
}

const ABREVIACOES = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

/** Meio-dia local evita que o fuso desloque o dia ao converter para ISO. */
export function gerarSemana(dataIso: string): DiaSemana[] {
  const base = new Date(`${dataIso}T12:00:00`);
  if (Number.isNaN(base.getTime())) return [];
  const domingo = new Date(base);
  domingo.setDate(base.getDate() - base.getDay());
  return ABREVIACOES.map((abrev, i) => {
    const d = new Date(domingo);
    d.setDate(domingo.getDate() + i);
    return {
      abrev,
      diaNum: String(d.getDate()).padStart(2, '0'),
      data: d.toISOString().split('T')[0],
    };
  });
}
