-- Etapa 7: base de conhecimento com tema, objetivos e níveis (RN14, RN15).
-- Array vazio em objetivos/niveis = trecho geral, vale para todos.
alter table public.base_conhecimento
  add column tema text not null default 'geral',
  add column objetivos text[] not null default '{}',
  add column niveis text[] not null default '{}',
  add constraint base_conhecimento_titulo_unico unique (titulo),
  add constraint base_conhecimento_fonte_preenchida check (length(trim(fonte)) > 0);

-- A assinatura muda (filtro por objetivo e nível no lugar de tipo).
drop function public.buscar_conhecimento_rag(extensions.vector, text, int);

create function public.buscar_conhecimento_rag(
  query_embedding extensions.vector(1024),
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
         1 - (embedding <=> query_embedding) as similaridade
  from base_conhecimento
  where embedding is not null
    and (filtro_objetivo is null or objetivos = '{}' or filtro_objetivo = any (objetivos))
    and (filtro_nivel is null or niveis = '{}' or filtro_nivel = any (niveis))
  order by embedding <=> query_embedding
  limit least(greatest(limite, 1), 10);
$$;

revoke execute on function public.buscar_conhecimento_rag(extensions.vector, text, text, int)
from public, anon;
grant execute on function public.buscar_conhecimento_rag(extensions.vector, text, text, int)
to authenticated, service_role;
