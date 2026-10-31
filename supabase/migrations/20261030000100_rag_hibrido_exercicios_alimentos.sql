-- Etapa 17: RAG híbrido (RN14 revista). O vetor ordena os candidatos pela
-- consulta (objetivo, nível, restrições); os filtros SQL tiram o que não pode
-- entrar. Idempotente: pode rodar de novo (e em produção) sem efeito colateral.
-- Linha sem embedding não some: vai para o fim da fila (nulls last).

drop function if exists public.buscar_exercicios_rag(extensions.vector, text[], text[], int);
drop function if exists public.buscar_exercicios_rag(extensions.vector, text[], int);
drop function if exists public.buscar_alimentos_rag(extensions.vector, text[], int);
drop function if exists public.buscar_alimentos_rag(extensions.vector, text[], text[], int);

-- Sem acento e em minúsculas (sem depender da extensão unaccent).
create or replace function public.texto_sem_acento(texto text)
returns text
language sql immutable
set search_path = ''
as $$
  select lower(translate(texto,
    'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç',
    'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc'));
$$;

-- Exercício: só curado; equipamento na lista (null = academia, tudo);
-- os mais parecidos com a consulta, até `limite_por_grupo` por grupo primário.
-- Nível e restrição física ficam no app, que amplia em degraus (etapa 13b).
create or replace function public.buscar_exercicios_rag(
  query_embedding extensions.vector(1024),
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
           1 - (e.embedding <=> query_embedding) as similaridade,
           row_number() over (
             partition by texto_sem_acento(split_part(e.grupo_primario, ',', 1)), e.tipo_movimento = 'funcional'
             order by e.embedding <=> query_embedding nulls last, e.id
           ) as posicao
    from base_exercicios e
    where e.is_curado
      and (filtro_equipamento is null
           or texto_sem_acento(e.equipamento) = any (filtro_equipamento))
  ) ranqueados
  where posicao <= least(greatest(limite_por_grupo, 1), 50)
  order by similaridade desc nulls last, id;
$$;

-- Alimento: macros válidos e kcal > 0; nome/categoria sem nenhum termo
-- proibido pelas restrições; slot pelo macro dominante (mesmos limiares do
-- app; carboidrato com ao menos 12 g/100 g); `termos_proteina` põe leguminosas no slot de proteína (vegano).
-- `is_curado` deixa de ser exigido (RN14 revista).
create or replace function public.buscar_alimentos_rag(
  query_embedding extensions.vector(1024),
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
             a.embedding <=> query_embedding as distancia,
             1 - (a.embedding <=> query_embedding) as similaridade,
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
      where a.calorias_100g > 0
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

-- Só quem está logado (e o service_role do script de avaliação) chama.
revoke execute on function
  public.texto_sem_acento(text),
  public.buscar_exercicios_rag(extensions.vector, text[], int),
  public.buscar_alimentos_rag(extensions.vector, text[], text[], int)
from public, anon;
grant execute on function
  public.texto_sem_acento(text),
  public.buscar_exercicios_rag(extensions.vector, text[], int),
  public.buscar_alimentos_rag(extensions.vector, text[], text[], int)
to authenticated, service_role;
