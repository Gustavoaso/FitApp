-- Grupos (RN23 revista, RN31): sem modo de pontuação (só check-in, 1 ponto por dia), banner,
-- descrição, check-in manual, curtidas e comentários, limites 50 membros / 10 grupos.

-- 1) Grupos: remove o modo; descrição e banner ('capa:1'..'capa:8' ou caminho no bucket banners).
alter table public.grupos
  drop column modo,
  add column descricao text check (char_length(descricao) <= 280),
  add column banner text;

-- 2) Check-ins: o ponto é derivado do dia (ranking), a coluna pontos some. Manual não tem sessão.
alter table public.grupo_checkins
  drop column pontos,
  alter column sessao_id drop not null,
  add column atividade text not null default 'musculação'
    check (atividade in ('musculação','corrida','caminhada','bike','natação','esporte','outro')),
  add column descricao text check (char_length(descricao) <= 280),
  add column foto_caminho text,
  add column manual boolean not null default false;
create index idx_grupo_checkins_data on public.grupo_checkins (grupo_id, usuario_id, data);

create table public.grupo_curtidas (
  checkin_id uuid not null references public.grupo_checkins on delete cascade,
  usuario_id uuid not null references auth.users on delete cascade,
  grupo_id uuid not null references public.grupos on delete cascade,
  primary key (checkin_id, usuario_id)
);
create table public.grupo_comentarios (
  id uuid primary key default gen_random_uuid(),
  checkin_id uuid not null references public.grupo_checkins on delete cascade,
  usuario_id uuid not null references auth.users on delete cascade,
  grupo_id uuid not null references public.grupos on delete cascade,
  texto text not null check (char_length(texto) between 1 and 280),
  criado_em timestamptz not null default now()
);
create index idx_grupo_comentarios_checkin on public.grupo_comentarios (checkin_id, criado_em);
create index idx_grupo_curtidas_usuario on public.grupo_curtidas (grupo_id, usuario_id);
alter table public.grupo_curtidas enable row level security;
alter table public.grupo_comentarios enable row level security;
revoke all on public.grupo_curtidas, public.grupo_comentarios from anon, authenticated;

-- 3) Funções que mudam de assinatura ou de retorno.
drop function public.criar_grupo(text, text, integer);
drop function public.meus_grupos();
drop function public.ranking_grupo(uuid);
drop function public.feed_grupo(uuid, integer);

create function public.criar_grupo(
  p_nome text, p_semanas integer default null, p_descricao text default null,
  p_banner text default null, p_inicio date default null
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_usuario uuid := (select auth.uid());
  v_alfabeto constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_codigo text;
  v_id uuid;
  v_nome text := btrim(coalesce(p_nome, ''));
  v_descricao text := nullif(btrim(coalesce(p_descricao, '')), '');
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  v_inicio date := coalesce(p_inicio, v_hoje);
begin
  if v_usuario is null then raise exception 'sem_sessao' using errcode = '42501'; end if;
  if not exists (select 1 from public.apelidos_usuario where usuario_id = v_usuario) then
    raise exception 'apelido_obrigatorio';
  end if;
  if char_length(v_nome) not between 3 and 40 then raise exception 'nome_invalido'; end if;
  if char_length(v_descricao) > 280 then raise exception 'descricao_invalida'; end if;
  if p_semanas is not null and p_semanas not between 1 and 52 then raise exception 'duracao_invalida'; end if;
  if v_inicio < v_hoje - 1 or v_inicio > v_hoje + 365 then raise exception 'inicio_invalido'; end if;
  if p_banner is not null and p_banner !~ '^capa:[1-8]$' and p_banner not like v_usuario::text || '/%' then
    raise exception 'banner_invalido';
  end if;
  if public.grupo_contar_ativos(v_usuario) >= 10 then raise exception 'limite_grupos'; end if;

  loop
    select string_agg(substr(v_alfabeto, 1 + floor(random() * 32)::int, 1), '')
    into v_codigo from generate_series(1, 6);
    exit when not exists (select 1 from public.grupos where codigo = v_codigo);
  end loop;

  insert into public.grupos (criador_id, nome, codigo, duracao_semanas, inicio, fim, descricao, banner)
  values (v_usuario, v_nome, v_codigo, p_semanas, v_inicio,
          case when p_semanas is null then null else v_inicio + p_semanas * 7 - 1 end,
          v_descricao, p_banner)
  returning id into v_id;
  insert into public.grupo_membros (grupo_id, usuario_id) values (v_id, v_usuario);
  return jsonb_build_object('id', v_id, 'codigo', v_codigo);
end;
$$;

-- Criador edita nome, descrição, banner e data de fim (null = contínuo).
create function public.editar_grupo(
  p_grupo uuid, p_nome text, p_descricao text default null, p_banner text default null,
  p_fim date default null
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_nome text := btrim(coalesce(p_nome, ''));
  v_descricao text := nullif(btrim(coalesce(p_descricao, '')), '');
begin
  perform public.grupo_exigir_criador(p_grupo);
  if char_length(v_nome) not between 3 and 40 then raise exception 'nome_invalido'; end if;
  if char_length(v_descricao) > 280 then raise exception 'descricao_invalida'; end if;
  if p_banner is not null and p_banner !~ '^capa:[1-8]$'
     and p_banner not like (select auth.uid())::text || '/%' then
    raise exception 'banner_invalido';
  end if;
  if p_fim is not null and p_fim < (select inicio from public.grupos where id = p_grupo) then
    raise exception 'fim_invalido';
  end if;
  update public.grupos
  set nome = v_nome, descricao = v_descricao, banner = p_banner, fim = p_fim
  where id = p_grupo;
end;
$$;

create or replace function public.entrar_grupo(p_codigo text)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_usuario uuid := (select auth.uid());
  v_grupo public.grupos;
begin
  if v_usuario is null then raise exception 'sem_sessao' using errcode = '42501'; end if;
  if not exists (select 1 from public.apelidos_usuario where usuario_id = v_usuario) then
    raise exception 'apelido_obrigatorio';
  end if;
  if (select count(*) from public.tentativas_entrar_grupo
      where usuario_id = v_usuario and criado_em > now() - interval '15 minutes') >= 5 then
    raise exception 'muitas_tentativas';
  end if;
  select * into v_grupo from public.grupos
  where codigo = upper(btrim(coalesce(p_codigo, '')))
    and encerrado_em is null and (fim is null or fim >= current_date);
  if v_grupo.id is null then
    delete from public.tentativas_entrar_grupo where criado_em < now() - interval '1 day';
    insert into public.tentativas_entrar_grupo (usuario_id) values (v_usuario);
    return null;
  end if;
  if exists (select 1 from public.grupo_membros where grupo_id = v_grupo.id and usuario_id = v_usuario) then
    return v_grupo.id;
  end if;
  if exists (select 1 from public.grupo_removidos where grupo_id = v_grupo.id and usuario_id = v_usuario) then
    raise exception 'removido_do_grupo';
  end if;
  perform 1 from public.grupos where id = v_grupo.id for update;
  if (select count(*) from public.grupo_membros where grupo_id = v_grupo.id) >= 50 then
    raise exception 'grupo_cheio';
  end if;
  if public.grupo_contar_ativos(v_usuario) >= 10 then raise exception 'limite_grupos'; end if;
  insert into public.grupo_membros (grupo_id, usuario_id) values (v_grupo.id, v_usuario);
  return v_grupo.id;
end;
$$;

-- Sair/remover apagam também curtidas e comentários da pessoa no grupo.
create or replace function public.sair_grupo(p_grupo uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare v_usuario uuid := (select auth.uid());
begin
  perform public.grupo_exigir_membro(p_grupo);
  if exists (select 1 from public.grupos where id = p_grupo and criador_id = v_usuario) then
    raise exception 'criador_nao_sai';
  end if;
  delete from public.grupo_checkins where grupo_id = p_grupo and usuario_id = v_usuario;
  delete from public.grupo_curtidas where grupo_id = p_grupo and usuario_id = v_usuario;
  delete from public.grupo_comentarios where grupo_id = p_grupo and usuario_id = v_usuario;
  delete from public.grupo_membros where grupo_id = p_grupo and usuario_id = v_usuario;
end;
$$;

create or replace function public.remover_membro(p_grupo uuid, p_membro uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare v_alvo uuid;
begin
  perform public.grupo_exigir_criador(p_grupo);
  select usuario_id into v_alvo from public.grupo_membros where id = p_membro and grupo_id = p_grupo;
  if v_alvo is null then raise exception 'membro_inexistente'; end if;
  if v_alvo = (select auth.uid()) then raise exception 'criador_nao_sai'; end if;
  delete from public.grupo_checkins where grupo_id = p_grupo and usuario_id = v_alvo;
  delete from public.grupo_curtidas where grupo_id = p_grupo and usuario_id = v_alvo;
  delete from public.grupo_comentarios where grupo_id = p_grupo and usuario_id = v_alvo;
  delete from public.grupo_membros where id = p_membro;
  insert into public.grupo_removidos (grupo_id, usuario_id) values (p_grupo, v_alvo)
  on conflict do nothing;
end;
$$;

-- Check-in manual: só hoje ou ontem (fuso do Brasil), dentro do período, foto na própria pasta.
create function public.registrar_checkin_manual(
  p_grupo uuid, p_atividade text, p_minutos integer, p_data date,
  p_descricao text default null, p_foto text default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_usuario uuid := (select auth.uid());
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  v_grupo public.grupos;
  v_descricao text := nullif(btrim(coalesce(p_descricao, '')), '');
  v_id uuid;
begin
  perform public.grupo_exigir_membro(p_grupo);
  select * into v_grupo from public.grupos where id = p_grupo;
  if v_grupo.encerrado_em is not null then raise exception 'grupo_encerrado'; end if;
  if p_data is null or p_data < v_hoje - 1 or p_data > v_hoje then raise exception 'data_invalida'; end if;
  if p_data < v_grupo.inicio or (v_grupo.fim is not null and p_data > v_grupo.fim) then
    raise exception 'fora_do_periodo';
  end if;
  if p_atividade is null or p_atividade not in
     ('musculação','corrida','caminhada','bike','natação','esporte','outro') then
    raise exception 'atividade_invalida';
  end if;
  if p_minutos is null or p_minutos not between 1 and 240 then raise exception 'duracao_invalida'; end if;
  if char_length(v_descricao) > 280 then raise exception 'descricao_invalida'; end if;
  if p_foto is not null and p_foto not like v_usuario::text || '/%' then raise exception 'foto_invalida'; end if;
  insert into public.grupo_checkins (grupo_id, usuario_id, data, nome_treino, atividade, minutos,
                                     descricao, foto_caminho, manual)
  values (p_grupo, v_usuario, p_data, p_atividade, p_atividade, p_minutos, v_descricao, p_foto, true)
  returning id into v_id;
  return v_id;
end;
$$;

create function public.alternar_curtida_checkin(p_checkin uuid)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  v_usuario uuid := (select auth.uid());
  v_grupo uuid;
begin
  select grupo_id into v_grupo from public.grupo_checkins where id = p_checkin;
  if v_grupo is null then raise exception 'nao_membro' using errcode = '42501'; end if;
  perform public.grupo_exigir_membro(v_grupo);
  if exists (select 1 from public.grupo_curtidas where checkin_id = p_checkin and usuario_id = v_usuario) then
    delete from public.grupo_curtidas where checkin_id = p_checkin and usuario_id = v_usuario;
    return false;
  end if;
  insert into public.grupo_curtidas (checkin_id, usuario_id, grupo_id) values (p_checkin, v_usuario, v_grupo);
  return true;
end;
$$;

create function public.comentar_checkin(p_checkin uuid, p_texto text)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_grupo uuid;
  v_texto text := btrim(coalesce(p_texto, ''));
  v_id uuid;
begin
  select grupo_id into v_grupo from public.grupo_checkins where id = p_checkin;
  if v_grupo is null then raise exception 'nao_membro' using errcode = '42501'; end if;
  perform public.grupo_exigir_membro(v_grupo);
  if char_length(v_texto) not between 1 and 280 then raise exception 'comentario_invalido'; end if;
  insert into public.grupo_comentarios (checkin_id, usuario_id, grupo_id, texto)
  values (p_checkin, (select auth.uid()), v_grupo, v_texto) returning id into v_id;
  return v_id;
end;
$$;

create function public.comentarios_checkin(p_checkin uuid)
returns table (id uuid, apelido text, texto text, criado_em timestamptz, eh_voce boolean)
language plpgsql stable security definer
set search_path = ''
as $$
declare v_grupo uuid;
begin
  select grupo_id into v_grupo from public.grupo_checkins where grupo_checkins.id = p_checkin;
  if v_grupo is null then raise exception 'nao_membro' using errcode = '42501'; end if;
  perform public.grupo_exigir_membro(v_grupo);
  return query
  select c.id, coalesce(a.apelido, 'Membro'), c.texto, c.criado_em, c.usuario_id = (select auth.uid())
  from public.grupo_comentarios c
  left join public.apelidos_usuario a on a.usuario_id = c.usuario_id
  where c.checkin_id = p_checkin
  order by c.criado_em;
end;
$$;

create function public.meus_grupos()
returns table (
  id uuid, nome text, descricao text, banner text, duracao_semanas integer, inicio date, fim date,
  encerrado boolean, eh_criador boolean, codigo text, membros integer, checkin_automatico boolean
)
language sql stable security definer
set search_path = ''
as $$
  select g.id, g.nome, g.descricao, g.banner, g.duracao_semanas, g.inicio, g.fim,
         g.encerrado_em is not null,
         g.criador_id = (select auth.uid()),
         case when g.criador_id = (select auth.uid()) and g.encerrado_em is null then g.codigo end,
         (select count(*)::int from public.grupo_membros x where x.grupo_id = g.id),
         m.checkin_automatico
  from public.grupo_membros m
  join public.grupos g on g.id = m.grupo_id
  where m.usuario_id = (select auth.uid())
  order by g.encerrado_em is not null, g.criado_em desc;
$$;

-- 1 ponto por dia com check-in; desempate por quem chegou ao total primeiro.
create function public.ranking_grupo(p_grupo uuid)
returns table (membro_id uuid, apelido text, pontos integer, posicao integer, eh_voce boolean)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform public.grupo_exigir_membro(p_grupo);
  return query
  select r.membro_id, r.apelido, r.pontos,
         (rank() over (order by r.pontos desc, r.ultimo asc nulls last))::int, r.eh_voce
  from (
    select m.id as membro_id, coalesce(a.apelido, 'Membro') as apelido,
           (select count(distinct c.data)::int from public.grupo_checkins c
             where c.grupo_id = m.grupo_id and c.usuario_id = m.usuario_id) as pontos,
           (select max(c.criado_em) from public.grupo_checkins c
             where c.grupo_id = m.grupo_id and c.usuario_id = m.usuario_id) as ultimo,
           m.usuario_id = (select auth.uid()) as eh_voce
    from public.grupo_membros m
    left join public.apelidos_usuario a on a.usuario_id = m.usuario_id
    where m.grupo_id = p_grupo
  ) r
  order by 4, r.apelido;
end;
$$;

create function public.feed_grupo(p_grupo uuid, p_limite integer default 50)
returns table (
  id uuid, membro_id uuid, apelido text, atividade text, nome_treino text, descricao text,
  foto_caminho text, minutos integer, kcal integer, data date, criado_em timestamptz,
  curtidas integer, curtiu boolean, comentarios integer, eh_voce boolean
)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform public.grupo_exigir_membro(p_grupo);
  return query
  select c.id, m.id, coalesce(a.apelido, 'Membro'), c.atividade, c.nome_treino, c.descricao,
         c.foto_caminho, c.minutos, c.kcal, c.data, c.criado_em,
         (select count(*)::int from public.grupo_curtidas l where l.checkin_id = c.id),
         exists (select 1 from public.grupo_curtidas l
                 where l.checkin_id = c.id and l.usuario_id = (select auth.uid())),
         (select count(*)::int from public.grupo_comentarios k where k.checkin_id = c.id),
         c.usuario_id = (select auth.uid())
  from public.grupo_checkins c
  join public.grupo_membros m on m.grupo_id = c.grupo_id and m.usuario_id = c.usuario_id
  left join public.apelidos_usuario a on a.usuario_id = c.usuario_id
  where c.grupo_id = p_grupo
  order by c.criado_em desc
  limit least(greatest(coalesce(p_limite, 50), 1), 100);
end;
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'criar_grupo(text, integer, text, text, date)', 'editar_grupo(uuid, text, text, text, date)',
    'registrar_checkin_manual(uuid, text, integer, date, text, text)',
    'alternar_curtida_checkin(uuid)', 'comentar_checkin(uuid, text)', 'comentarios_checkin(uuid)',
    'meus_grupos()', 'ranking_grupo(uuid)', 'feed_grupo(uuid, integer)'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end;
$$;

-- 4) Storage: membros leem a foto de check-in e o banner de grupos em comum (RN31).
create function public.pode_ler_foto_de_grupo(p_bucket text, p_caminho text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select case p_bucket
    when 'checkins' then exists (
      select 1 from public.grupo_checkins c
      join public.grupo_membros m on m.grupo_id = c.grupo_id
      where c.foto_caminho = p_caminho and m.usuario_id = (select auth.uid()))
    when 'banners' then exists (
      select 1 from public.grupos g
      join public.grupo_membros m on m.grupo_id = g.id
      where g.banner = p_caminho and m.usuario_id = (select auth.uid()))
    else false end;
$$;
revoke execute on function public.pode_ler_foto_de_grupo(text, text) from public, anon;
grant execute on function public.pode_ler_foto_de_grupo(text, text) to authenticated;
create policy fotos_grupo_ler on storage.objects for select to authenticated
  using (bucket_id in ('checkins', 'banners') and public.pode_ler_foto_de_grupo(bucket_id, name));
