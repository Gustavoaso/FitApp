-- Fotos de evolução (RN29). Dado sensível: privada por padrão; só os grupos marcados veem.

create table public.evolucao_preferencias (
  usuario_id uuid primary key references auth.users on delete cascade default auth.uid(),
  frequencia text not null default 'mensal' check (frequencia in ('semanal', 'mensal'))
);
alter table public.evolucao_preferencias enable row level security;
create policy evolucao_pref_ler on public.evolucao_preferencias for select to authenticated
  using (usuario_id = (select auth.uid()));
create policy evolucao_pref_criar on public.evolucao_preferencias for insert to authenticated
  with check (usuario_id = (select auth.uid()));
create policy evolucao_pref_alterar on public.evolucao_preferencias for update to authenticated
  using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));

create table public.evolucao_registros (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users on delete cascade default auth.uid(),
  data date not null default current_date,
  peso_kg numeric(5, 1) check (peso_kg between 20 and 400),
  mostrar_peso boolean not null default false,
  foto_frente text,
  foto_lado text,
  foto_costas text,
  criado_em timestamptz not null default now(),
  -- pelo menos 1 foto; cada caminho na pasta da própria pessoa
  check (num_nonnulls(foto_frente, foto_lado, foto_costas) >= 1),
  check (coalesce(foto_frente, usuario_id::text || '/') like usuario_id::text || '/%'
     and coalesce(foto_lado, usuario_id::text || '/') like usuario_id::text || '/%'
     and coalesce(foto_costas, usuario_id::text || '/') like usuario_id::text || '/%')
);
create index idx_evolucao_registros_usuario on public.evolucao_registros (usuario_id, data desc);
alter table public.evolucao_registros enable row level security;
create policy evolucao_reg_ler on public.evolucao_registros for select to authenticated
  using (usuario_id = (select auth.uid()));
create policy evolucao_reg_criar on public.evolucao_registros for insert to authenticated
  with check (usuario_id = (select auth.uid()));
create policy evolucao_reg_alterar on public.evolucao_registros for update to authenticated
  using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));
create policy evolucao_reg_apagar on public.evolucao_registros for delete to authenticated
  using (usuario_id = (select auth.uid()));

-- Ausência de linha = "só eu". Só dá para compartilhar com grupo do qual a pessoa é membro.
create table public.evolucao_compartilhamentos (
  registro_id uuid not null references public.evolucao_registros on delete cascade,
  grupo_id uuid not null references public.grupos on delete cascade,
  primary key (registro_id, grupo_id)
);
create index idx_evolucao_comp_grupo on public.evolucao_compartilhamentos (grupo_id);
alter table public.evolucao_compartilhamentos enable row level security;
create policy evolucao_comp_ler on public.evolucao_compartilhamentos for select to authenticated
  using (exists (select 1 from public.evolucao_registros r
                 where r.id = registro_id and r.usuario_id = (select auth.uid())));
create policy evolucao_comp_criar on public.evolucao_compartilhamentos for insert to authenticated
  with check (
    exists (select 1 from public.evolucao_registros r
            where r.id = registro_id and r.usuario_id = (select auth.uid()))
    and exists (select 1 from public.grupo_membros m
                where m.grupo_id = evolucao_compartilhamentos.grupo_id
                  and m.usuario_id = (select auth.uid())));
create policy evolucao_comp_apagar on public.evolucao_compartilhamentos for delete to authenticated
  using (exists (select 1 from public.evolucao_registros r
                 where r.id = registro_id and r.usuario_id = (select auth.uid())));

-- Quem sai do grupo deixa de compartilhar com ele.
create function public.evolucao_limpar_ao_sair() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.evolucao_compartilhamentos c
  using public.evolucao_registros r
  where c.registro_id = r.id and r.usuario_id = old.usuario_id and c.grupo_id = old.grupo_id;
  return old;
end;
$$;
create trigger trg_evolucao_limpar_ao_sair after delete on public.grupo_membros
  for each row execute function public.evolucao_limpar_ao_sair();

-- Aba "Evolução" do grupo: só registros compartilhados com ele, só para membros.
-- Nunca devolve id de autenticação nem e-mail; o peso só sai se a pessoa marcou.
create function public.evolucao_grupo(p_grupo uuid)
returns table (
  registro_id uuid, apelido text, eh_voce boolean, data date, peso_kg numeric,
  foto_frente text, foto_lado text, foto_costas text
)
language sql stable security definer set search_path = '' as $$
  select r.id, a.apelido, r.usuario_id = (select auth.uid()), r.data,
         case when r.mostrar_peso then r.peso_kg end,
         r.foto_frente, r.foto_lado, r.foto_costas
  from public.evolucao_compartilhamentos c
  join public.evolucao_registros r on r.id = c.registro_id
  join public.apelidos_usuario a on a.usuario_id = r.usuario_id
  where c.grupo_id = p_grupo
    and exists (select 1 from public.grupo_membros m
                where m.grupo_id = p_grupo and m.usuario_id = (select auth.uid()))
    and exists (select 1 from public.grupo_membros m2
                where m2.grupo_id = p_grupo and m2.usuario_id = r.usuario_id)
  order by r.data desc, r.criado_em desc
  limit 100;
$$;
revoke execute on function public.evolucao_grupo(uuid) from public, anon;
grant execute on function public.evolucao_grupo(uuid) to authenticated;

-- Storage: membro lê a foto só se o registro foi compartilhado com um grupo em comum.
create function public.pode_ler_foto_evolucao(p_caminho text)
returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.evolucao_registros r
    join public.evolucao_compartilhamentos c on c.registro_id = r.id
    join public.grupo_membros m on m.grupo_id = c.grupo_id
    where p_caminho in (r.foto_frente, r.foto_lado, r.foto_costas)
      and m.usuario_id = (select auth.uid()));
$$;
revoke execute on function public.pode_ler_foto_evolucao(text) from public, anon;
grant execute on function public.pode_ler_foto_evolucao(text) to authenticated;
create policy fotos_evolucao_grupo_ler on storage.objects for select to authenticated
  using (bucket_id = 'evolucao' and public.pode_ler_foto_evolucao(name));
