-- Endurece grupos e sessões de treino (testes finais).
-- 1) limite de tentativas de código; 2) valores forjados em sessoes_treino; 3) removido não reentra.

-- Tentativas de código que falharam. Sem política: o cliente não lê nem escreve.
create table public.tentativas_entrar_grupo (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users on delete cascade,
  criado_em timestamptz not null default now()
);
create index idx_tentativas_entrar_grupo on public.tentativas_entrar_grupo (usuario_id, criado_em);
alter table public.tentativas_entrar_grupo enable row level security;
revoke all on public.tentativas_entrar_grupo from anon, authenticated;

-- Quem o criador removeu não volta com o mesmo código. Sem política (só as funções leem).
create table public.grupo_removidos (
  grupo_id uuid not null references public.grupos on delete cascade,
  usuario_id uuid not null references auth.users on delete cascade,
  removido_em timestamptz not null default now(),
  primary key (grupo_id, usuario_id)
);
alter table public.grupo_removidos enable row level security;
revoke all on public.grupo_removidos from anon, authenticated;

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
  -- 5 falhas em 15 minutos bloqueiam novas tentativas.
  if (select count(*) from public.tentativas_entrar_grupo
      where usuario_id = v_usuario and criado_em > now() - interval '15 minutes') >= 5 then
    raise exception 'muitas_tentativas';
  end if;
  -- Mesma resposta para código inexistente, mal formado ou de grupo encerrado/vencido.
  select * into v_grupo from public.grupos
  where codigo = upper(btrim(coalesce(p_codigo, '')))
    and encerrado_em is null and (fim is null or fim >= current_date);
  if v_grupo.id is null then
    -- Uma exceção desfaria o registro da falha; por isso devolve null e o app mostra o erro.
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
  delete from public.grupo_membros where id = p_membro;
  insert into public.grupo_removidos (grupo_id, usuario_id) values (p_grupo, v_alvo)
  on conflict do nothing;
end;
$$;

-- Sessões: o dia vem do fuso do Brasil (o padrão em UTC passaria de meia-noite antes).
alter table public.sessoes_treino
  alter column data set default (now() at time zone 'America/Sao_Paulo')::date;

-- Valida só o que vem do app (papéis do cliente); seed, testes e manutenção seguem livres.
create function public.validar_sessao_treino()
returns trigger
language plpgsql security invoker
set search_path = ''
as $$
declare v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if current_user not in ('authenticated', 'anon') then return new; end if;
  if new.data < v_hoje - 1 or new.data > v_hoje then
    raise exception 'sessao_data_invalida' using errcode = '23514';
  end if;
  if new.duracao_minutos is not null and new.duracao_minutos not between 1 and 240 then
    raise exception 'sessao_duracao_invalida' using errcode = '23514';
  end if;
  if new.kcal_estimadas is not null and new.kcal_estimadas not between 0 and 3000 then
    raise exception 'sessao_kcal_invalida' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger trigger_valida_sessao_treino
  before insert or update of data, duracao_minutos, kcal_estimadas on public.sessoes_treino
  for each row execute function public.validar_sessao_treino();
revoke execute on function public.validar_sessao_treino() from public, anon, authenticated;
