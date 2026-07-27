// ============================================================
// VALIDADORES DO QUESTIONÁRIO
// ============================================================
// Funções que verificam se os dados inseridos pelo usuário
// estão dentro de ranges válidos e seguros. Usadas tanto no
// frontend (para feedback imediato) quanto no backend (para
// garantir integridade antes de calcular/salvar).
// ============================================================

/** Resultado de uma validação: ok ou erro com mensagem */
export type ResultadoValidacao =
  | { valido: true }
  | { valido: false; mensagem: string };

/**
 * Valida a idade do usuário.
 * Mínimo: 14 anos (menores precisam de acompanhamento médico)
 * Máximo: 100 anos (limite razoável)
 */
export function validarIdade(idade: number): ResultadoValidacao {
  if (!Number.isInteger(idade)) {
    return { valido: false, mensagem: 'A idade deve ser um número inteiro.' };
  }
  if (idade < 14) {
    return { valido: false, mensagem: 'Idade mínima: 14 anos.' };
  }
  if (idade > 100) {
    return { valido: false, mensagem: 'Idade máxima: 100 anos.' };
  }
  return { valido: true };
}

/**
 * Valida o peso do usuário.
 * Mínimo: 30 kg (abaixo disso é preocupante)
 * Máximo: 300 kg (limite razoável)
 */
export function validarPeso(pesoKg: number): ResultadoValidacao {
  if (pesoKg < 30) {
    return { valido: false, mensagem: 'Peso mínimo: 30 kg.' };
  }
  if (pesoKg > 300) {
    return { valido: false, mensagem: 'Peso máximo: 300 kg.' };
  }
  return { valido: true };
}

/**
 * Valida a altura do usuário.
 * Mínimo: 100 cm (1 metro)
 * Máximo: 250 cm (2,5 metros)
 */
export function validarAltura(alturaCm: number): ResultadoValidacao {
  if (alturaCm < 100) {
    return { valido: false, mensagem: 'Altura mínima: 100 cm.' };
  }
  if (alturaCm > 250) {
    return { valido: false, mensagem: 'Altura máxima: 250 cm.' };
  }
  return { valido: true };
}

/**
 * Valida o percentual de gordura corporal (campo opcional).
 * Mínimo: 3% (atleta de elite masculino)
 * Máximo: 60% (obesidade severa)
 */
export function validarGorduraCorporal(percentual: number): ResultadoValidacao {
  if (percentual < 3) {
    return { valido: false, mensagem: 'Gordura corporal mínima: 3%.' };
  }
  if (percentual > 60) {
    return { valido: false, mensagem: 'Gordura corporal máxima: 60%.' };
  }
  return { valido: true };
}

/**
 * Valida a frequência semanal de treino.
 * Mínimo: 2 dias (abaixo disso o progresso é muito lento)
 * Máximo: 6 dias (1 dia de descanso obrigatório)
 */
export function validarFrequenciaSemanal(dias: number): ResultadoValidacao {
  if (!Number.isInteger(dias)) {
    return { valido: false, mensagem: 'A frequência deve ser um número inteiro.' };
  }
  if (dias < 2) {
    return { valido: false, mensagem: 'Mínimo de 2 dias por semana.' };
  }
  if (dias > 6) {
    return { valido: false, mensagem: 'Máximo de 6 dias por semana. Seu corpo precisa descansar!' };
  }
  return { valido: true };
}

/**
 * Valida um nome (não pode ser vazio ou muito curto).
 */
export function validarNome(nome: string): ResultadoValidacao {
  const nomeLimpo = nome.trim();
  if (nomeLimpo.length < 2) {
    return { valido: false, mensagem: 'O nome deve ter pelo menos 2 caracteres.' };
  }
  if (nomeLimpo.length > 100) {
    return { valido: false, mensagem: 'O nome deve ter no máximo 100 caracteres.' };
  }
  return { valido: true };
}

/**
 * Valida um e-mail com uma regex simples.
 * Não é uma validação completa (para isso usaríamos o próprio login),
 * mas suficiente para feedback imediato no formulário.
 */
export function validarEmail(email: string): ResultadoValidacao {
  // Regex simples: algo@algo.algo
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email)) {
    return { valido: false, mensagem: 'E-mail inválido.' };
  }
  return { valido: true };
}
