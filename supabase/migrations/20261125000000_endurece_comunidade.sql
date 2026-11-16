-- Endurecimento da comunidade (testes finais): bloqueio, limites, ocultação, avatar, fotos, acentos.

-- Policies chamam bloqueio_entre como authenticated, então o grant fica; mas só responde sobre a própria pessoa.
create or replace function public.bloqueio_entre(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select (a = (select auth.uid()) or b = (select auth.uid())) and exists (select 1 from bloqueios
    where (bloqueador_id = a and bloqueado_id = b) or (bloqueador_id = b and bloqueado_id = a))
$$;

-- Bloquear desfaz o seguir nos dois sentidos.
create function public.bloqueio_remove_seguidores() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from seguidores
  where (seguidor_id = new.bloqueador_id and seguido_id = new.bloqueado_id)
     or (seguidor_id = new.bloqueado_id and seguido_id = new.bloqueador_id);
  return new;
end $$;
create trigger trg_bloqueio_remove_seguidores after insert on public.bloqueios
  for each row execute function public.bloqueio_remove_seguidores();

-- Limites diários.
create function public.limitar_denuncia() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform consumir_limite(new.denunciante_id, 'denuncias', 20);
  return new;
end $$;
create trigger trg_limitar_denuncia before insert on public.denuncias
  for each row execute function public.limitar_denuncia();

create function public.limitar_seguir() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform consumir_limite(new.seguidor_id, 'seguir', 200);
  return new;
end $$;
create trigger trg_limitar_seguir before insert on public.seguidores
  for each row execute function public.limitar_seguir();

create function public.limitar_comentario_grupo() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform consumir_limite(new.usuario_id, 'comentarios_grupo', 100);
  return new;
end $$;
create trigger trg_limitar_comentario_grupo before insert on public.grupo_comentarios
  for each row execute function public.limitar_comentario_grupo();

-- Ocultação: só denunciantes com conta de mais de 24 h contam (contas descartáveis não censuram).
create or replace function public.ocultar_post_denunciado() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.post_id is not null
     and (select count(distinct d.denunciante_id) from denuncias d
          join auth.users u on u.id = d.denunciante_id
          where d.post_id = new.post_id and u.created_at < now() - interval '24 hours') >= 3 then
    update posts set oculto = true where id = new.post_id;
  end if;
  return new;
end $$;

-- Filtro de palavras sem acento (dos dois lados).
create or replace function public.validar_novo_post() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  de constant text := 'áàâãäéèêëíìîïóòôõöúùûüç';
  para constant text := 'aaaaaeeeeiiiiooooouuuuc';
begin
  if exists (select 1 from palavras_proibidas w
             where translate(lower(new.texto), de, para)
               ~ ('\m' || regexp_replace(translate(w.palavra, de, para), '([^a-z0-9 ])', '\\\1', 'g') || '\M')) then
    raise exception 'texto_ofensivo' using errcode = 'P0001';
  end if;
  perform consumir_limite(new.autor_id, 'posts', 30);
  return new;
end $$;

alter table public.apelidos_usuario add constraint apelidos_avatar_pasta
  check (avatar_caminho is null or avatar_caminho like usuario_id::text || '/%');

-- Foto de post: só se o post é visível (a RLS de posts já esconde oculto e bloqueado); o dono vê as suas.
drop policy posts_fotos_ler on storage.objects;
create policy posts_fotos_ler on storage.objects for select to authenticated
  using (bucket_id = 'posts' and exists (select 1 from public.posts p where p.foto_caminho = name));
