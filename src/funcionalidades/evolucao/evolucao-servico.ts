// Acesso às fotos de evolução (RN29, RN31). Tabelas com RLS: a pessoa só enxerga o que é dela.
import { supabase } from '@/compartilhado/supabase';
import type { Database } from '@/compartilhado/tipos/database';
import { enviarFoto } from '@/compartilhado/servicos/foto-servico';
import { ANGULOS, frequenciaValida, type Angulo, type Frequencia, type Registro } from './evolucao';

const FALHA = 'Não deu certo. Tente de novo.';
export type Resultado<T> = { ok: true; valor: T } | { ok: false; erro: string };

type LinhaRegistro = Database['public']['Tables']['evolucao_registros']['Row'] & {
  evolucao_compartilhamentos: { grupo_id: string }[];
};

export interface GrupoSimples {
  id: string;
  nome: string;
}

export async function buscarFrequencia(): Promise<Frequencia> {
  try {
    const { data } = await supabase
      .from('evolucao_preferencias')
      .select('frequencia')
      .maybeSingle();
    return frequenciaValida(data?.frequencia);
  } catch {
    return 'mensal';
  }
}

export async function salvarFrequencia(frequencia: Frequencia): Promise<Resultado<null>> {
  try {
    const { error } = await supabase.from('evolucao_preferencias').upsert({ frequencia });
    return error ? { ok: false, erro: FALHA } : { ok: true, valor: null };
  } catch {
    return { ok: false, erro: FALHA };
  }
}

/** Só id e nome dos grupos ativos da pessoa (para escolher com quem compartilhar). */
export async function listarMeusGrupos(): Promise<GrupoSimples[]> {
  try {
    const { data } = await supabase.rpc('meus_grupos');
    const lista = (data ?? []) as Database['public']['Functions']['meus_grupos']['Returns'];
    return lista.filter((g) => !g.encerrado).map((g) => ({ id: g.id, nome: g.nome }));
  } catch {
    return [];
  }
}

export async function listarRegistros(): Promise<Resultado<Registro[]>> {
  try {
    const { data, error } = await supabase
      .from('evolucao_registros')
      .select('*, evolucao_compartilhamentos(grupo_id)')
      .order('data', { ascending: false })
      .order('criado_em', { ascending: false });
    if (error) return { ok: false, erro: FALHA };
    return {
      ok: true,
      valor: (data as LinhaRegistro[]).map((r) => ({
        id: r.id,
        data: r.data,
        pesoKg: r.peso_kg,
        mostrarPeso: r.mostrar_peso,
        fotos: { frente: r.foto_frente, lado: r.foto_lado, costas: r.foto_costas },
        grupos: r.evolucao_compartilhamentos.map((c) => c.grupo_id),
      })),
    };
  } catch {
    return { ok: false, erro: 'Sem conexão. Tente de novo.' };
  }
}

export interface NovoRegistro {
  data: string;
  pesoKg: number | null;
  mostrarPeso: boolean;
  uris: Partial<Record<Angulo, string>>;
  grupos: string[];
}

async function gravarGrupos(registro: string, grupos: string[]): Promise<boolean> {
  const { error: e1 } = await supabase
    .from('evolucao_compartilhamentos')
    .delete()
    .eq('registro_id', registro);
  if (e1) return false;
  if (grupos.length === 0) return true;
  const { error } = await supabase
    .from('evolucao_compartilhamentos')
    .insert(grupos.map((g) => ({ registro_id: registro, grupo_id: g })));
  return !error;
}

export async function criarRegistro(novo: NovoRegistro): Promise<Resultado<null>> {
  try {
    const caminhos: Record<Angulo, string | null> = { frente: null, lado: null, costas: null };
    for (const a of ANGULOS) {
      const uri = novo.uris[a];
      if (uri) caminhos[a] = await enviarFoto('evolucao', uri);
    }
    const { data, error } = await supabase
      .from('evolucao_registros')
      .insert({
        data: novo.data,
        peso_kg: novo.pesoKg,
        mostrar_peso: novo.pesoKg !== null && novo.mostrarPeso,
        foto_frente: caminhos.frente,
        foto_lado: caminhos.lado,
        foto_costas: caminhos.costas,
      })
      .select('id')
      .single();
    if (error) return { ok: false, erro: FALHA };
    return (await gravarGrupos(data.id, novo.grupos))
      ? { ok: true, valor: null }
      : { ok: false, erro: 'Registro salvo, mas a visibilidade não. Ajuste no card.' };
  } catch {
    return { ok: false, erro: FALHA };
  }
}

export async function mudarVisibilidade(
  registro: string,
  mostrarPeso: boolean,
  grupos: string[],
): Promise<Resultado<null>> {
  try {
    const { error } = await supabase
      .from('evolucao_registros')
      .update({ mostrar_peso: mostrarPeso })
      .eq('id', registro);
    if (error || !(await gravarGrupos(registro, grupos))) return { ok: false, erro: FALHA };
    return { ok: true, valor: null };
  } catch {
    return { ok: false, erro: FALHA };
  }
}

export async function apagarRegistro(r: Registro): Promise<Resultado<null>> {
  try {
    const { error } = await supabase.from('evolucao_registros').delete().eq('id', r.id);
    if (error) return { ok: false, erro: FALHA };
    const caminhos = ANGULOS.map((a) => r.fotos[a]).filter((c): c is string => !!c);
    // Foto órfã não é lida por ninguém (a política depende do registro); limpar é melhor-esforço.
    await supabase.storage.from('evolucao').remove(caminhos);
    return { ok: true, valor: null };
  } catch {
    return { ok: false, erro: FALHA };
  }
}
