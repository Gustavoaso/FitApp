-- Etapa 28: embeddings gte-small (384 dimensões), gerados dentro do Supabase pela
-- IA embutida das Edge Functions (RN14 atualizada em 2026-11-15). Aditiva: as colunas
-- `embedding` (mxbai, 1024) ficam até a troca ser confirmada no remoto; as RPCs de busca
-- passam a usar `embedding_384`. Linha sem vetor novo vai para o fim da fila (nulls last)
-- até a function reprocessar-embeddings rodar.

alter table public.base_exercicios add column embedding_384 extensions.vector(384);
alter table public.base_alimentos add column embedding_384 extensions.vector(384);
alter table public.base_conhecimento add column embedding_384 extensions.vector(384);

-- A dimensão do parâmetro muda: não dá para `create or replace`.
drop function public.buscar_exercicios_rag(extensions.vector, text[], int);
drop function public.buscar_alimentos_rag(extensions.vector, text[], text[], int);
drop function public.buscar_conhecimento_rag(extensions.vector, text, text, int);

-- Nível e restrição física ficam no app, que amplia em degraus (etapa 13b).
create or replace function public.buscar_exercicios_rag(
  query_embedding extensions.vector(384),
  filtro_equipamento text[] default null,
  limite_por_grupo int default 30
)
returns table (
  id uuid,
  nome text,
  grupo_primario text,
  grupo_secundario text,
  equipamento text,
  tipo_movimento text,
  nivel text,
  similaridade float
)
language sql stable
security invoker
set search_path = public, extensions
as $$
  select id, nome, grupo_primario, grupo_secundario, equipamento, tipo_movimento, nivel,
         similaridade
  from (
    select e.*,
           1 - (e.embedding_384 <=> query_embedding) as similaridade,
           row_number() over (
             partition by texto_sem_acento(split_part(e.grupo_primario, ',', 1)), e.tipo_movimento = 'funcional'
             order by e.embedding_384 <=> query_embedding nulls last, e.id
           ) as posicao
    from base_exercicios e
    where e.is_curado
      and (filtro_equipamento is null
           or texto_sem_acento(e.equipamento) = any (filtro_equipamento))
  ) ranqueados
  where posicao <= least(greatest(limite_por_grupo, 1), 50)
  order by similaridade desc nulls last, id;
$$;

create or replace function public.buscar_alimentos_rag(
  query_embedding extensions.vector(384),
  termos_excluidos text[] default null,
  termos_proteina text[] default null,
  limite_por_slot int default 20
)
returns table (
  id bigint,
  nome text,
  categoria text,
  calorias_100g numeric,
  proteinas_100g numeric,
  carboidratos_100g numeric,
  gorduras_100g numeric,
  slot text,
  similaridade float
)
language sql stable
security invoker
set search_path = public, extensions
as $$
  select id, nome, categoria, calorias_100g, proteinas_100g, carboidratos_100g,
         gorduras_100g, slot, similaridade
  from (
    select c.*,
           row_number() over (
             partition by c.slot order by c.distancia nulls last, c.id
           ) as posicao
    from (
      select a.id, a.nome, a.categoria, a.calorias_100g, a.proteinas_100g,
             a.carboidratos_100g, a.gorduras_100g,
             a.embedding_384 <=> query_embedding as distancia,
             1 - (a.embedding_384 <=> query_embedding) as similaridade,
             case
               when a.proteinas_100g * 4 / a.calorias_100g >= 0.4 then 'proteina'
               when exists (select 1 from unnest(termos_proteina) t
                            where texto_sem_acento(a.nome || ' ' || a.categoria) like '%' || t || '%')
                 then 'proteina'
               when a.gorduras_100g * 9 / a.calorias_100g >= 0.6 then 'complemento'
               when a.carboidratos_100g * 4 / a.calorias_100g >= 0.5
                and a.carboidratos_100g >= 12 then 'carboidrato'
             end as slot
      from base_alimentos a
      where a.e_basico
        and a.calorias_100g > 0
        and a.proteinas_100g >= 0
        and a.carboidratos_100g >= 0
        and a.gorduras_100g >= 0
        and not exists (select 1 from unnest(termos_excluidos) t
                        where texto_sem_acento(a.nome || ' ' || a.categoria) like '%' || t || '%')
    ) c
    where c.slot is not null
  ) ranqueados
  where posicao <= least(greatest(limite_por_slot, 1), 50)
  order by similaridade desc nulls last, id;
$$;


create function public.buscar_conhecimento_rag(
  query_embedding extensions.vector(384),
  filtro_objetivo text default null,
  filtro_nivel text default null,
  limite int default 3
)
returns table (
  id bigint,
  tipo text,
  tema text,
  titulo text,
  fonte text,
  conteudo text,
  similaridade float
)
language sql stable
set search_path = public, extensions
as $$
  select id, tipo, tema, titulo, fonte, conteudo,
         1 - (embedding_384 <=> query_embedding) as similaridade
  from base_conhecimento
  where embedding_384 is not null
    and (filtro_objetivo is null or objetivos = '{}' or filtro_objetivo = any (objetivos))
    and (filtro_nivel is null or niveis = '{}' or filtro_nivel = any (niveis))
  order by embedding_384 <=> query_embedding
  limit least(greatest(limite, 1), 10);
$$;

revoke execute on function
  public.buscar_exercicios_rag(extensions.vector, text[], int),
  public.buscar_alimentos_rag(extensions.vector, text[], text[], int),
  public.buscar_conhecimento_rag(extensions.vector, text, text, int)
from public, anon;
grant execute on function
  public.buscar_exercicios_rag(extensions.vector, text[], int),
  public.buscar_alimentos_rag(extensions.vector, text[], text[], int),
  public.buscar_conhecimento_rag(extensions.vector, text, text, int)
to authenticated, service_role;

-- RN13 para a Edge Function gerar-plano: quantas gerações a pessoa já gravou hoje
-- (mesma conta da RPC salvar_plano_gerado). Só conta as linhas do próprio usuário (RLS).
create function public.geracoes_hoje()
returns int
language sql stable
security invoker
set search_path = public
as $$
  select count(*)::int from planos_ia_gerados
  where usuario_id = (select auth.uid())
    and (criado_em at time zone 'America/Sao_Paulo')::date
        = (now() at time zone 'America/Sao_Paulo')::date;
$$;
revoke execute on function public.geracoes_hoje() from public, anon;
grant execute on function public.geracoes_hoje() to authenticated;
