// Validação do alimento que o usuário cadastra (RN17). Os mesmos limites estão
// no check `base_alimentos_usuario_check`, que é quem garante no banco.

export interface CampoAlimento {
  nome: string;
  kcal: string;
  proteina: string;
  carboidrato: string;
  gordura: string;
  porcaoGramas: string;
}

export interface AlimentoCadastro {
  nome: string;
  calorias_100g: number;
  proteinas_100g: number;
  carboidratos_100g: number;
  gorduras_100g: number;
  porcao_gramas: number;
  porcao_descricao: string;
}

const numero = (t: string): number => Number(t.trim().replace(',', '.'));

/** Devolve o alimento pronto ou a mensagem do primeiro erro. kcal vazia = 4·P + 4·C + 9·G. */
export function validarAlimento(c: CampoAlimento): { alimento?: AlimentoCadastro; erro?: string } {
  const nome = c.nome.trim().replace(/\s+/g, ' ');
  if (nome.length < 2 || nome.length > 80) return { erro: 'O nome precisa ter de 2 a 80 letras.' };
  const [p, ch, g] = [c.proteina, c.carboidrato, c.gordura].map((t) => (t.trim() ? numero(t) : 0));
  if ([p, ch, g].some((v) => !Number.isFinite(v) || v < 0))
    return { erro: 'Proteína, carboidrato e gordura precisam ser números de 0 em diante.' };
  if (p + ch + g > 100)
    return { erro: 'Proteína + carboidrato + gordura passam de 100 g em 100 g.' };
  const kcal = c.kcal.trim() ? numero(c.kcal) : Math.round(4 * p + 4 * ch + 9 * g);
  if (!Number.isFinite(kcal) || kcal < 0 || kcal > 900)
    return { erro: 'As calorias por 100 g ficam entre 0 e 900.' };
  const porcao = c.porcaoGramas.trim() ? numero(c.porcaoGramas) : 100;
  if (!Number.isFinite(porcao) || porcao <= 0 || porcao > 2000)
    return { erro: 'A porção fica entre 1 e 2000 g.' };
  return {
    alimento: {
      nome,
      calorias_100g: kcal,
      proteinas_100g: p,
      carboidratos_100g: ch,
      gorduras_100g: g,
      porcao_gramas: porcao,
      porcao_descricao: `${porcao} g`,
    },
  };
}
