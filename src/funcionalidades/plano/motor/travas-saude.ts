// ============================================================
// MOTOR: travas de saúde (RN16)
// ============================================================
// Antes de gerar: menor de 18, IMC fora de 16–45 ou calorias
// abaixo do piso por sexo bloqueiam o plano e a tela recomenda
// um profissional. Valores fixados no PROJETO.md (RN16).
// ============================================================

import type { DadosSaude } from './tipos';

// PREMISSA (P1, revisável antes da App Store): pisos da RN16.
export const IDADE_MINIMA = 18;
export const IMC_MINIMO = 16;
export const IMC_MAXIMO = 45;
export const PISO_CALORIAS = { feminino: 1200, masculino: 1500 } as const;

export const MENSAGEM_PROFISSIONAL =
  'Para o seu perfil, o plano precisa ser feito com um profissional de saúde (médico ou nutricionista).';

function numeroValido(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0;
}

/** Lista de motivos de bloqueio. Vazia = pode gerar. Dado inválido também bloqueia. */
export function verificarTravasSaude(dados: Partial<DadosSaude> | null | undefined): string[] {
  const { idade, sexo, pesoKg, alturaCm, caloriasAlvo } = dados ?? {};
  if (
    !numeroValido(idade) ||
    !numeroValido(pesoKg) ||
    !numeroValido(alturaCm) ||
    !numeroValido(caloriasAlvo) ||
    (sexo !== 'feminino' && sexo !== 'masculino')
  ) {
    return ['Dados de saúde inválidos.'];
  }
  const motivos: string[] = [];
  if (idade < IDADE_MINIMA) motivos.push('Menor de 18 anos.');
  const imc = pesoKg / (alturaCm / 100) ** 2;
  if (imc < IMC_MINIMO || imc > IMC_MAXIMO) motivos.push('IMC fora da faixa de 16 a 45.');
  if (caloriasAlvo < PISO_CALORIAS[sexo]) motivos.push('Calorias abaixo do piso seguro.');
  return motivos;
}
