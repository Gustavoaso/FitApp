-- Grupos e competição (RN23, RN24). Migration aditiva.
-- Segurança: as tabelas de grupo têm RLS ligada e NENHUMA política para o cliente, e o acesso
-- direto é revogado. Tudo passa por funções security definer que só devolvem apelido,
-- check-ins e pontos, nunca usuario_id/e-mail/peso/dieta de outra pessoa (o "membro_id" é um
-- identificador opaco do grupo, sem relação com o id de autenticação).

-- Apelido (RN24): único dado pessoal visível a outros usuários. Só o dono lê e escreve a linha.
create table public.apelidos_usuario (
  usuario_id uuid primary key references auth.users on delete cascade default auth.uid(),
  -- Sem arroba (e-mail), de 3 a 20 caracteres, sem espaço nas pontas.
  apelido text not null
    check (char_length(apelido) between 3 and 20 and apelido !~ '@' and apelido = btrim(apelido))
);
create unique index idx_apelidos_unico on public.apelidos_usuario (lower(apelido));
alter table public.apelidos_usuario enable row level security;
create policy apelidos_ler on public.apelidos_usuario for select to authenticated
  using (usuario_id = (select auth.uid()));
create policy apelidos_criar on public.apelidos_usuario for insert to authenticated
  with check (usuario_id = (select auth.uid()));
create policy apelidos_alterar on public.apelidos_usuario for update to authenticated
  using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));
revoke all on public.apelidos_usuario from anon;
revoke delete on public.apelidos_usuario from authenticated;

create table public.grupos (
  id uuid primary key default gen_random_uuid(),
  criador_id uuid not null references auth.users on delete cascade,
  nome text not null check (char_length(nome) between 3 and 40),
  codigo text not null unique check (codigo ~ '^[A-Z0-9]{6}$'),
  modo text not null check (modo in ('treinos', 'minutos', 'xp')),
  duracao_semanas integer check (duracao_semanas between 1 and 52),
  inicio date not null default current_date,
  fim date,
  encerrado_em timestamptz,
  criado_em timestamptz not null default now()
);
create index idx_grupos_criador on public.grupos (criador_id);

create table public.grupo_membros (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos on delete cascade,
  usuario_id uuid not null references auth.users on delete cascade,
  checkin_automatico boolean not null default true,
  entrou_em timestamptz not null default now(),
  unique (grupo_id, usuario_id)
);
create index idx_grupo_membros_usuario on public.grupo_membros (usuario_id);

create table public.grupo_checkins (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos on delete cascade,
  usuario_id uuid not null references auth.users on delete cascade,
  sessao_id uuid not null references public.sessoes_treino on delete cascade,
  data date not null,
  nome_treino text,
  minutos integer not null default 0 check (minutos >= 0),
  kcal integer check (kcal >= 0),
  pontos integer not null default 100,
  criado_em timestamptz not null default now(),
  unique (grupo_id, sessao_id)
);
create index idx_grupo_checkins_grupo on public.grupo_checkins (grupo_id, usuario_id);

alter table public.grupos enable row level security;
alter table public.grupo_membros enable row level security;
alter table public.grupo_checkins enable row level security;
revoke all on public.grupos, public.grupo_membros, public.grupo_checkins from anon, authenticated;

-- Check-in automático: derivado da sessão concluída do próprio usuário (o app não envia pontos).
create function public.gerar_checkins_da_sessao()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if new.finalizado_em is null then
    return new;
  end if;
  insert into public.grupo_checkins (grupo_id, usuario_id, sessao_id, data, nome_treino, minutos, kcal)
  select g.id, new.usuario_id, new.id, new.data, new.nome_treino,
         coalesce(new.duracao_minutos, 0), new.kcal_estimadas
  from public.grupo_membros m
  join public.grupos g on g.id = m.grupo_id
  where m.usuario_id = new.usuario_id
    and m.checkin_automatico
    and g.encerrado_em is null
    and new.data >= g.inicio
    and (g.fim is null or new.data <= g.fim)
    and new.data >= m.entrou_em::date
  on conflict (grupo_id, sessao_id) do nothing;
  return new;
end;
$$;
revoke execute on function public.gerar_checkins_da_sessao() from public, anon, authenticated;
create trigger trigger_sessao_gera_checkins
  after insert or update of finalizado_em on public.sessoes_treino
  for each row execute function public.gerar_checkins_da_sessao();

-- Auxiliares internas (sem acesso do cliente).
create function public.grupo_exigir_membro(p_grupo uuid)
returns uuid
language plpgsql stable security definer
set search_path = ''
as $$
declare v_membro uuid;
begin
  select id into v_membro from public.grupo_membros
  where grupo_id = p_grupo and usuario_id = (select auth.uid());
  if v_membro is null then
    raise exception 'nao_membro' using errcode = '42501';
  end if;
  return v_membro;
end;
$$;
revoke execute on function public.grupo_exigir_membro(uuid) from public, anon, authenticated;

create function public.grupo_exigir_criador(p_grupo uuid)
returns void
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.grupos
    where id = p_grupo and criador_id = (select auth.uid())
  ) then
    raise exception 'nao_criador' using errcode = '42501';
  end if;
end;
$$;
revoke execute on function public.grupo_exigir_criador(uuid) from public, anon, authenticated;

-- Grupos ativos (não encerrados) em que a pessoa está: base do limite de 5.
create function public.grupo_contar_ativos(p_usuario uuid)
returns integer
language sql stable security definer
set search_path = ''
as $$
  select count(*)::int from public.grupo_membros m
  join public.grupos g on g.id = m.grupo_id
  where m.usuario_id = p_usuario and g.encerrado_em is null;
$$;
revoke execute on function public.grupo_contar_ativos(uuid) from public, anon, authenticated;

create function public.criar_grupo(p_nome text, p_modo text, p_semanas integer default null)
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
begin
  if v_usuario is null then raise exception 'sem_sessao' using errcode = '42501'; end if;
  if not exists (select 1 from public.apelidos_usuario where usuario_id = v_usuario) then
    raise exception 'apelido_obrigatorio';
  end if;
  if char_length(v_nome) not between 3 and 40 then raise exception 'nome_invalido'; end if;
  if p_modo is null or p_modo not in ('treinos', 'minutos', 'xp') then raise exception 'modo_invalido'; end if;
  if p_semanas is not null and p_semanas not between 1 and 52 then raise exception 'duracao_invalida'; end if;
  if public.grupo_contar_ativos(v_usuario) >= 5 then raise exception 'limite_grupos'; end if;

  loop
    select string_agg(substr(v_alfabeto, 1 + floor(random() * 32)::int, 1), '')
    into v_codigo from generate_series(1, 6);
    exit when not exists (select 1 from public.grupos where codigo = v_codigo);
  end loop;

  insert into public.grupos (criador_id, nome, codigo, modo, duracao_semanas, fim)
  values (v_usuario, v_nome, v_codigo, p_modo, p_semanas,
          case when p_semanas is null then null else current_date + p_semanas * 7 - 1 end)
  returning id into v_id;
  insert into public.grupo_membros (grupo_id, usuario_id) values (v_id, v_usuario);
  return jsonb_build_object('id', v_id, 'codigo', v_codigo);
end;
$$;

create function public.entrar_grupo(p_codigo text)
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
  -- Mesma resposta para código inexistente, mal formado ou de grupo encerrado/vencido.
  select * into v_grupo from public.grupos
  where codigo = upper(btrim(coalesce(p_codigo, '')))
    and encerrado_em is null and (fim is null or fim >= current_date);
  if v_grupo.id is null then raise exception 'codigo_invalido'; end if;

  if exists (select 1 from public.grupo_membros where grupo_id = v_grupo.id and usuario_id = v_usuario) then
    return v_grupo.id;
  end if;
  -- Trava a linha do grupo para dois convites simultâneos não passarem de 30.
  perform 1 from public.grupos where id = v_grupo.id for update;
  if (select count(*) from public.grupo_membros where grupo_id = v_grupo.id) >= 30 then
    raise exception 'grupo_cheio';
  end if;
  if public.grupo_contar_ativos(v_usuario) >= 5 then raise exception 'limite_grupos'; end if;
  insert into public.grupo_membros (grupo_id, usuario_id) values (v_grupo.id, v_usuario);
  return v_grupo.id;
end;
$$;

create function public.sair_grupo(p_grupo uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare v_usuario uuid := (select auth.uid());
begin
  perform public.grupo_exigir_membro(p_grupo);
  -- O criador encerra o grupo em vez de sair (ninguém fica órfão com o código vivo).
  if exists (select 1 from public.grupos where id = p_grupo and criador_id = v_usuario) then
    raise exception 'criador_nao_sai';
  end if;
  delete from public.grupo_checkins where grupo_id = p_grupo and usuario_id = v_usuario;
  delete from public.grupo_membros where grupo_id = p_grupo and usuario_id = v_usuario;
end;
$$;

create function public.remover_membro(p_grupo uuid, p_membro uuid)
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
  delete from public.grupo_membros where id = p_membro;
end;
$$;

create function public.encerrar_grupo(p_grupo uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  perform public.grupo_exigir_criador(p_grupo);
  update public.grupos set encerrado_em = coalesce(encerrado_em, now()) where id = p_grupo;
end;
$$;

create function public.definir_checkin_automatico(p_grupo uuid, p_ativo boolean)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  perform public.grupo_exigir_membro(p_grupo);
  update public.grupo_membros set checkin_automatico = coalesce(p_ativo, true)
  where grupo_id = p_grupo and usuario_id = (select auth.uid());
end;
$$;

-- Lista dos grupos da pessoa. O código só aparece para o criador (quem convida).
create function public.meus_grupos()
returns table (
  id uuid, nome text, modo text, duracao_semanas integer, inicio date, fim date,
  encerrado boolean, eh_criador boolean, codigo text, membros integer, checkin_automatico boolean
)
language sql stable security definer
set search_path = ''
as $$
  select g.id, g.nome, g.modo, g.duracao_semanas, g.inicio, g.fim,
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

create function public.ranking_grupo(p_grupo uuid)
returns table (
  membro_id uuid, apelido text, treinos integer, minutos integer, pontos integer,
  posicao integer, eh_voce boolean
)
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_usuario uuid := (select auth.uid());
  v_modo text;
begin
  perform public.grupo_exigir_membro(p_grupo);
  select modo into v_modo from public.grupos where id = p_grupo;
  return query
  select r.membro_id, r.apelido, r.treinos, r.minutos, r.pontos,
         (rank() over (order by case v_modo when 'minutos' then r.minutos
                                            when 'xp' then r.pontos else r.treinos end desc))::int,
         r.eh_voce
  from (
    select m.id as membro_id,
           coalesce(a.apelido, 'Membro') as apelido,
           -- Dois treinos no mesmo dia valem um (igual ao XP da RN22).
           (select count(distinct c.data)::int from public.grupo_checkins c
             where c.grupo_id = m.grupo_id and c.usuario_id = m.usuario_id) as treinos,
           (select coalesce(sum(c.minutos), 0)::int from public.grupo_checkins c
             where c.grupo_id = m.grupo_id and c.usuario_id = m.usuario_id) as minutos,
           (select count(distinct c.data)::int * 100 from public.grupo_checkins c
             where c.grupo_id = m.grupo_id and c.usuario_id = m.usuario_id) as pontos,
           m.usuario_id = v_usuario as eh_voce
    from public.grupo_membros m
    left join public.apelidos_usuario a on a.usuario_id = m.usuario_id
    where m.grupo_id = p_grupo
  ) r
  order by 6, r.apelido;
end;
$$;

create function public.feed_grupo(p_grupo uuid, p_limite integer default 50)
returns table (
  id uuid, membro_id uuid, apelido text, nome_treino text, minutos integer, kcal integer,
  pontos integer, data date, criado_em timestamptz, eh_voce boolean
)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform public.grupo_exigir_membro(p_grupo);
  return query
  select c.id, m.id, coalesce(a.apelido, 'Membro'), c.nome_treino, c.minutos, c.kcal,
         c.pontos, c.data, c.criado_em, c.usuario_id = (select auth.uid())
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
    'criar_grupo(text, text, integer)', 'entrar_grupo(text)', 'sair_grupo(uuid)',
    'remover_membro(uuid, uuid)', 'encerrar_grupo(uuid)',
    'definir_checkin_automatico(uuid, boolean)', 'meus_grupos()', 'ranking_grupo(uuid)',
    'feed_grupo(uuid, integer)'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end;
$$;
