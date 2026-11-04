-- RN17 (continuação): sai o Open Food Facts da base_alimentos e entram os
-- alimentos cadastrados pelos usuários (fonte = 'usuario').
-- 1) alimentos_refeicao.alimento_id deixa de apagar a refeição junto com o alimento:
--    a linha guarda nome, porção e macros, então o plano sobrevive (set null).
-- 2) alimentos_favoritos.alimento_id era uuid, mas base_alimentos.id é bigint
--    (tabela vazia): vira bigint com chave estrangeira.
-- 3) Cadastro pelo usuário: fica visível só para quem cadastrou (RLS) e nunca entra
--    no plano (e_basico = false) até o dono promover a linha na curadoria.
-- 4) Apaga os alimentos do Open Food Facts (backup em
--    ~/Documents/Projetos/FitApp-backups/2026-11-03/base_alimentos_off.json).
-- Idempotente.

alter table public.alimentos_refeicao alter column alimento_id drop not null;
alter table public.alimentos_refeicao drop constraint if exists alimentos_refeicao_alimento_id_fkey;
alter table public.alimentos_refeicao
  add constraint alimentos_refeicao_alimento_id_fkey
  foreign key (alimento_id) references public.base_alimentos (id) on delete set null;

do $$
begin
  if (select data_type from information_schema.columns
      where table_schema = 'public' and table_name = 'alimentos_favoritos'
        and column_name = 'alimento_id') = 'uuid' then
    delete from public.alimentos_favoritos;
    alter table public.alimentos_favoritos
      alter column alimento_id type bigint using null;
    alter table public.alimentos_favoritos
      add constraint alimentos_favoritos_alimento_id_fkey
      foreign key (alimento_id) references public.base_alimentos (id) on delete cascade;
  end if;
end;
$$;

alter table public.base_alimentos
  add column if not exists criado_por uuid references auth.users on delete cascade;
alter table public.base_alimentos drop constraint if exists base_alimentos_fonte_check;
alter table public.base_alimentos
  add constraint base_alimentos_fonte_check check (fonte in ('off', 'taco', 'usuario'));
alter table public.base_alimentos drop constraint if exists base_alimentos_usuario_check;
alter table public.base_alimentos
  add constraint base_alimentos_usuario_check check (
    fonte <> 'usuario' or (
      criado_por is not null
      and not e_basico
      and char_length(btrim(nome)) between 2 and 80
      and calorias_100g between 0 and 900
      and proteinas_100g + carboidratos_100g + gorduras_100g <= 100
    )
  );
create index if not exists idx_base_alimentos_criado_por
  on public.base_alimentos (criado_por) where criado_por is not null;

-- Bases continuam só leitura, exceto o que o próprio usuário cadastrou.
drop policy if exists base_alimentos_ler on public.base_alimentos;
create policy base_alimentos_ler on public.base_alimentos for select to authenticated
  using (fonte <> 'usuario' or criado_por = (select auth.uid()));
drop policy if exists base_alimentos_cadastrar on public.base_alimentos;
create policy base_alimentos_cadastrar on public.base_alimentos for insert to authenticated
  with check (fonte = 'usuario' and criado_por = (select auth.uid())
              and not e_basico and not is_curado and codigo_barras is null);
drop policy if exists base_alimentos_alterar_proprio on public.base_alimentos;
create policy base_alimentos_alterar_proprio on public.base_alimentos for update to authenticated
  using (fonte = 'usuario' and criado_por = (select auth.uid()))
  with check (fonte = 'usuario' and criado_por = (select auth.uid()) and not e_basico and not is_curado);
drop policy if exists base_alimentos_apagar_proprio on public.base_alimentos;
create policy base_alimentos_apagar_proprio on public.base_alimentos for delete to authenticated
  using (fonte = 'usuario' and criado_por = (select auth.uid()));

delete from public.base_alimentos where fonte = 'off';
