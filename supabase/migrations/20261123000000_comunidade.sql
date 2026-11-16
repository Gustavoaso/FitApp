-- Comunidade (RN30), etapa 36: posts, curtidas e seguidores.
-- O modelo já prevê a etapa 37: pai_id (resposta) e repost_de (repost/citação) ficam nulos por ora.

-- Perfil público (RN24) é visível para quem está logado; termos da Comunidade aceitos antes do 1º post.
alter table public.apelidos_usuario add column termos_comunidade_em timestamptz;
create policy apelidos_ler_publico on public.apelidos_usuario for select to authenticated using (true);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid not null references auth.users on delete cascade default auth.uid(),
  texto text not null check (char_length(btrim(texto)) between 1 and 280),
  foto_caminho text check (foto_caminho is null or foto_caminho like autor_id::text || '/%'),
  pai_id uuid references public.posts on delete cascade,
  repost_de uuid references public.posts on delete cascade,
  criado_em timestamptz not null default now()
);
create index idx_posts_autor on public.posts (autor_id, criado_em desc);
create index idx_posts_criado on public.posts (criado_em desc);
create index idx_posts_pai on public.posts (pai_id);
create index idx_posts_repost on public.posts (repost_de);
alter table public.posts enable row level security;
create policy posts_ler on public.posts for select to authenticated using (true);
-- Só posta quem tem @usuario e aceitou os termos.
create policy posts_criar on public.posts for insert to authenticated
  with check (autor_id = (select auth.uid()) and exists (
    select 1 from public.apelidos_usuario a
    where a.usuario_id = (select auth.uid()) and a.usuario is not null and a.termos_comunidade_em is not null));
create policy posts_apagar on public.posts for delete to authenticated
  using (autor_id = (select auth.uid()));
revoke all on public.posts from anon;
revoke update on public.posts from authenticated;

create table public.post_curtidas (
  post_id uuid not null references public.posts on delete cascade,
  usuario_id uuid not null references auth.users on delete cascade default auth.uid(),
  primary key (post_id, usuario_id)
);
create index idx_post_curtidas_usuario on public.post_curtidas (usuario_id);
alter table public.post_curtidas enable row level security;
create policy curtidas_ler on public.post_curtidas for select to authenticated using (true);
create policy curtidas_criar on public.post_curtidas for insert to authenticated
  with check (usuario_id = (select auth.uid()));
create policy curtidas_apagar on public.post_curtidas for delete to authenticated
  using (usuario_id = (select auth.uid()));
revoke all on public.post_curtidas from anon;

create table public.seguidores (
  seguidor_id uuid not null references auth.users on delete cascade default auth.uid(),
  seguido_id uuid not null references auth.users on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (seguidor_id, seguido_id),
  check (seguidor_id <> seguido_id)
);
create index idx_seguidores_seguido on public.seguidores (seguido_id);
alter table public.seguidores enable row level security;
create policy seguidores_ler on public.seguidores for select to authenticated using (true);
create policy seguidores_criar on public.seguidores for insert to authenticated
  with check (seguidor_id = (select auth.uid()));
create policy seguidores_apagar on public.seguidores for delete to authenticated
  using (seguidor_id = (select auth.uid()));
revoke all on public.seguidores from anon;

-- Fotos de post: qualquer pessoa logada vê (o post em si é público para logados).
create policy posts_fotos_ler on storage.objects for select to authenticated
  using (bucket_id = 'posts');

-- Feed. p_aba: 'seguindo' (de quem sigo e meus, cronológico), 'para_voce' (72 h, por interação com
-- penalidade de idade) ou 'usuario' (posts de p_autor). Respeita RLS (security invoker).
create function public.feed_posts(
  p_aba text, p_autor uuid default null, p_antes timestamptz default null, p_limite int default 30
) returns table (
  id uuid, autor_id uuid, apelido text, usuario text, avatar_caminho text, texto text,
  foto_caminho text, criado_em timestamptz, curtidas bigint, respostas bigint, reposts bigint, curtiu boolean
) language sql stable security invoker set search_path = public as $$
  with base as (
    select p.*, a.apelido, a.usuario, a.avatar_caminho,
      (select count(*) from post_curtidas c where c.post_id = p.id) as n_curtidas,
      (select count(*) from posts r where r.pai_id = p.id) as n_respostas,
      (select count(*) from posts r where r.repost_de = p.id) as n_reposts
    from posts p join apelidos_usuario a on a.usuario_id = p.autor_id
    where p.pai_id is null
      and (p_antes is null or p.criado_em < p_antes)
      and case p_aba
        when 'seguindo' then p.autor_id = (select auth.uid())
          or p.autor_id in (select seguido_id from seguidores where seguidor_id = (select auth.uid()))
        when 'para_voce' then p.criado_em > now() - interval '72 hours'
        when 'usuario' then p.autor_id = p_autor
        else false end
  )
  select b.id, b.autor_id, b.apelido, b.usuario, b.avatar_caminho, b.texto, b.foto_caminho,
    b.criado_em, b.n_curtidas, b.n_respostas, b.n_reposts,
    exists (select 1 from post_curtidas c where c.post_id = b.id and c.usuario_id = (select auth.uid()))
  from base b
  order by case when p_aba = 'para_voce'
      then (b.n_curtidas + b.n_respostas + b.n_reposts + 1)
           / power(extract(epoch from now() - b.criado_em) / 3600 + 2, 1.5)
      else 0 end desc,
    b.criado_em desc
  limit least(greatest(p_limite, 1), 50)
$$;

create function public.perfil_comunidade(p_usuario uuid)
returns table (
  apelido text, usuario text, bio text, avatar_caminho text,
  seguidores bigint, seguindo bigint, posts bigint, eu_sigo boolean
) language sql stable security invoker set search_path = public as $$
  select a.apelido, a.usuario, a.bio, a.avatar_caminho,
    (select count(*) from seguidores s where s.seguido_id = a.usuario_id),
    (select count(*) from seguidores s where s.seguidor_id = a.usuario_id),
    (select count(*) from posts p where p.autor_id = a.usuario_id and p.pai_id is null),
    exists (select 1 from seguidores s where s.seguidor_id = (select auth.uid()) and s.seguido_id = a.usuario_id)
  from apelidos_usuario a where a.usuario_id = p_usuario
$$;
revoke all on function public.feed_posts(text, uuid, timestamptz, int) from public, anon;
revoke all on function public.perfil_comunidade(uuid) from public, anon;
grant execute on function public.feed_posts(text, uuid, timestamptz, int) to authenticated;
grant execute on function public.perfil_comunidade(uuid) to authenticated;
