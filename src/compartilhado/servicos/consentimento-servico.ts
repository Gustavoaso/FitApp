// ============================================================
// SERVIÇO: Consentimento de dados de saúde
// ============================================================
// O aceite fica em perfis.consentimento_saude_em (data do aceite).
// Sem ele o questionário não começa (PROJETO.md, seção 4). Revogar o
// aceite é excluir a conta, por isso não há "desfazer" aqui.
// ============================================================

import { supabase } from '@/compartilhado/supabase';

/** true só quando o banco confirma o aceite; qualquer falha conta como sem aceite. */
export async function possuiConsentimentoSaude(): Promise<boolean> {
  const { data: sessao } = await supabase.auth.getUser();
  const usuarioId = sessao.user?.id;
  if (!usuarioId) return false;

  const { data, error } = await supabase
    .from('perfis')
    .select('consentimento_saude_em')
    .eq('usuario_id', usuarioId)
    .maybeSingle();

  return !error && Boolean(data?.consentimento_saude_em);
}

/** Grava a data do aceite. Lança erro se não conseguir, para a tela avisar. */
export async function registrarConsentimentoSaude(): Promise<void> {
  const { data: sessao } = await supabase.auth.getUser();
  const usuario = sessao.user;
  if (!usuario) throw new Error('Sessão expirada');

  const agora = new Date().toISOString();
  const { data: atualizados, error } = await supabase
    .from('perfis')
    .update({ consentimento_saude_em: agora })
    .eq('usuario_id', usuario.id)
    .select('id');
  if (error) throw error;
  if (atualizados && atualizados.length > 0) return;

  // Cadastro com confirmação de e-mail não cria o perfil (AuthContexto).
  // Mesmos valores iniciais do cadastro; o questionário os substitui.
  const { error: erroInsercao } = await supabase.from('perfis').insert({
    usuario_id: usuario.id,
    nome: (usuario.user_metadata?.nome as string | undefined) ?? 'Atleta',
    idade: 25,
    sexo: 'masculino',
    peso_kg: 70,
    altura_cm: 175,
    nivel_experiencia: 'iniciante',
    nivel_atividade: 'moderado',
    consentimento_saude_em: agora,
  });
  if (erroInsercao) throw erroInsercao;
}
