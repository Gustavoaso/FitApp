-- Comunidade etapa 37 (RN30): respostas, reposts, denúncia, bloqueio, filtro de palavras e limites diários.

-- Repost simples tem texto vazio; resposta e repost são excludentes.
alter table public.posts drop constraint posts_texto_check;
alter table public.posts add constraint posts_texto_check check (
  char_length(btrim(texto)) <= 280 and (repost_de is not null or char_length(btrim(texto)) >= 1));
alter table public.posts add constraint posts_pai_ou_repost check (pai_id is null or repost_de is null);
create unique index idx_posts_repost_simples on public.posts (autor_id, repost_de)
  where repost_de is not null and btrim(texto) = '';
alter table public.posts add column oculto boolean not null default false;

create table public.bloqueios (
  bloqueador_id uuid not null references auth.users on delete cascade default auth.uid(),
  bloqueado_id uuid not null references auth.users on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (bloqueador_id, bloqueado_id),
  check (bloqueador_id <> bloqueado_id)
);
create index idx_bloqueios_bloqueado on public.bloqueios (bloqueado_id);
alter table public.bloqueios enable row level security;
create policy bloqueios_ler on public.bloqueios for select to authenticated
  using (bloqueador_id = (select auth.uid()));
create policy bloqueios_criar on public.bloqueios for insert to authenticated
  with check (bloqueador_id = (select auth.uid()));
create policy bloqueios_apagar on public.bloqueios for delete to authenticated
  using (bloqueador_id = (select auth.uid()));
revoke all on public.bloqueios from anon;

-- Bloqueio vale nos dois sentidos; a pessoa só enxerga as próprias linhas, então a checagem é definer.
create function public.bloqueio_entre(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from bloqueios
    where (bloqueador_id = a and bloqueado_id = b) or (bloqueador_id = b and bloqueado_id = a))
$$;
revoke all on function public.bloqueio_entre(uuid, uuid) from public, anon;
grant execute on function public.bloqueio_entre(uuid, uuid) to authenticated;

create table public.denuncias (
  id uuid primary key default gen_random_uuid(),
  denunciante_id uuid not null references auth.users on delete cascade default auth.uid(),
  post_id uuid references public.posts on delete cascade,
  usuario_denunciado_id uuid references auth.users on delete cascade,
  motivo text not null check (motivo in ('spam', 'ofensivo', 'assedio', 'improprio', 'outro')),
  criado_em timestamptz not null default now(),
  check ((post_id is null) <> (usuario_denunciado_id is null)),
  check (usuario_denunciado_id is null or usuario_denunciado_id <> denunciante_id)
);
create unique index idx_denuncias_post on public.denuncias (denunciante_id, post_id) where post_id is not null;
create unique index idx_denuncias_usuario on public.denuncias (denunciante_id, usuario_denunciado_id)
  where usuario_denunciado_id is not null;
create index idx_denuncias_post_id on public.denuncias (post_id);
alter table public.denuncias enable row level security;
create policy denuncias_criar on public.denuncias for insert to authenticated
  with check (denunciante_id = (select auth.uid()));
revoke all on public.denuncias from anon;
revoke select, update, delete on public.denuncias from authenticated;

-- 3 denúncias de pessoas diferentes ocultam o post até o dono do app revisar (zera `oculto` no painel).
create function public.ocultar_post_denunciado() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.post_id is not null
     and (select count(distinct denunciante_id) from denuncias where post_id = new.post_id) >= 3 then
    update posts set oculto = true where id = new.post_id;
  end if;
  return new;
end $$;
create trigger trg_ocultar_post after insert on public.denuncias
  for each row execute function public.ocultar_post_denunciado();

-- Lista inicial curta; o dono edita a tabela (insert/delete) sem mexer em código.
create table public.palavras_proibidas (palavra text primary key check (palavra = lower(btrim(palavra))));
alter table public.palavras_proibidas enable row level security;
revoke all on public.palavras_proibidas from anon, authenticated;
insert into public.palavras_proibidas (palavra) values
  ('idiota'), ('imbecil'), ('retardado'), ('vagabundo'), ('vagabunda'), ('otario'), ('arrombado'),
  ('filho da puta'), ('desgraçado'), ('lixo humano');

-- Limite por dia (fuso de Brasília). O contador nunca desce: curtir e descurtir em laço não burla.
create table public.uso_diario (
  usuario_id uuid not null references auth.users on delete cascade,
  dia date not null,
  tipo text not null,
  n integer not null default 0,
  primary key (usuario_id, dia, tipo)
);
alter table public.uso_diario enable row level security;
revoke all on public.uso_diario from anon, authenticated;

create function public.consumir_limite(p_usuario uuid, p_tipo text, p_max int) returns void
language plpgsql security definer set search_path = public as $$
declare v_n int;
begin
  insert into uso_diario (usuario_id, dia, tipo, n)
  values (p_usuario, (now() at time zone 'America/Sao_Paulo')::date, p_tipo, 1)
  on conflict (usuario_id, dia, tipo) do update set n = uso_diario.n + 1
  returning n into v_n;
  if v_n > p_max then raise exception 'limite_diario' using errcode = 'P0001'; end if;
end $$;
revoke all on function public.consumir_limite(uuid, text, int) from public, anon, authenticated;

create function public.validar_novo_post() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from palavras_proibidas w
             where lower(new.texto) ~ ('\m' || regexp_replace(w.palavra, '([^a-z0-9 ])', '\\\1', 'g') || '\M')) then
    raise exception 'texto_ofensivo' using errcode = 'P0001';
  end if;
  perform consumir_limite(new.autor_id, 'posts', 30);
  return new;
end $$;
create trigger trg_validar_post before insert on public.posts
  for each row execute function public.validar_novo_post();

create function public.limitar_curtida() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform consumir_limite(new.usuario_id, 'curtidas', 300);
  return new;
end $$;
create trigger trg_limitar_curtida before insert on public.post_curtidas
  for each row execute function public.limitar_curtida();

-- Leitura: some post de quem bloqueou/foi bloqueado e post oculto (o autor ainda vê o seu).
drop policy posts_ler on public.posts;
create policy posts_ler on public.posts for select to authenticated
  using (not public.bloqueio_entre(autor_id, (select auth.uid()))
         and (not oculto or autor_id = (select auth.uid())));
drop policy apelidos_ler_publico on public.apelidos_usuario;
create policy apelidos_ler_publico on public.apelidos_usuario for select to authenticated
  using (not public.bloqueio_entre(usuario_id, (select auth.uid())));

-- Definer porque uma política de posts não pode consultar posts (recursão); repete a regra de leitura.
create function public.post_visivel(p_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from posts d where d.id = p_id
    and not bloqueio_entre(d.autor_id, (select auth.uid()))
    and (not d.oculto or d.autor_id = (select auth.uid())))
$$;
revoke all on function public.post_visivel(uuid) from public, anon;
grant execute on function public.post_visivel(uuid) to authenticated;

-- Responder/repostar: o post de destino precisa ser visível (some bloqueado e oculto).
drop policy posts_criar on public.posts;
create policy posts_criar on public.posts for insert to authenticated
  with check (autor_id = (select auth.uid())
    and exists (select 1 from public.apelidos_usuario a
      where a.usuario_id = (select auth.uid()) and a.usuario is not null and a.termos_comunidade_em is not null)
    and (pai_id is null or public.post_visivel(pai_id))
    and (repost_de is null or public.post_visivel(repost_de)));

-- Feed com respostas ('respostas' = o post p_pai e as respostas dele, em ordem) e reposts embutidos.
drop function public.feed_posts(text, uuid, timestamptz, int);
create function public.feed_posts(
  p_aba text, p_autor uuid default null, p_antes timestamptz default null, p_limite int default 30,
  p_pai uuid default null
) returns table (
  id uuid, autor_id uuid, apelido text, usuario text, avatar_caminho text, texto text,
  foto_caminho text, criado_em timestamptz, curtidas bigint, respostas bigint, reposts bigint,
  curtiu boolean, repost_de uuid, original_apelido text, original_usuario text, original_texto text,
  original_foto text, repostei boolean
) language sql stable security invoker set search_path = public as $$
  with base as (
    select p.*, a.apelido, a.usuario, a.avatar_caminho,
      o.texto as o_texto, o.foto_caminho as o_foto, oa.apelido as o_apelido, oa.usuario as o_usuario,
      (select count(*) from post_curtidas c where c.post_id = p.id) as n_curtidas,
      (select count(*) from posts r where r.pai_id = p.id) as n_respostas,
      (select count(*) from posts r where r.repost_de = p.id) as n_reposts
    from posts p join apelidos_usuario a on a.usuario_id = p.autor_id
    left join posts o on o.id = p.repost_de
    left join apelidos_usuario oa on oa.usuario_id = o.autor_id
    where (p_aba = 'respostas' or p.pai_id is null)
      and (p.repost_de is null or o.id is not null)
      and (p_antes is null or p.criado_em < p_antes)
      and case p_aba
        when 'seguindo' then p.autor_id = (select auth.uid())
          or p.autor_id in (select seguido_id from seguidores where seguidor_id = (select auth.uid()))
        when 'para_voce' then p.criado_em > now() - interval '72 hours'
        when 'usuario' then p.autor_id = p_autor
        when 'respostas' then p.id = p_pai or p.pai_id = p_pai
        else false end
  )
  select b.id, b.autor_id, b.apelido, b.usuario, b.avatar_caminho, b.texto, b.foto_caminho,
    b.criado_em, b.n_curtidas, b.n_respostas, b.n_reposts,
    exists (select 1 from post_curtidas c where c.post_id = b.id and c.usuario_id = (select auth.uid())),
    b.repost_de, b.o_apelido, b.o_usuario, b.o_texto, b.o_foto,
    exists (select 1 from posts r where r.repost_de = b.id and r.autor_id = (select auth.uid()) and btrim(r.texto) = '')
  from base b
  order by (p_aba = 'respostas' and b.id = p_pai) desc,
    case when p_aba = 'para_voce'
      then (b.n_curtidas + b.n_respostas + b.n_reposts + 1)
           / power(extract(epoch from now() - b.criado_em) / 3600 + 2, 1.5)
      else 0 end desc,
    case when p_aba = 'respostas' then b.criado_em end asc,
    b.criado_em desc
  limit least(greatest(p_limite, 1), 50)
$$;
revoke all on function public.feed_posts(text, uuid, timestamptz, int, uuid) from public, anon;
grant execute on function public.feed_posts(text, uuid, timestamptz, int, uuid) to authenticated;
