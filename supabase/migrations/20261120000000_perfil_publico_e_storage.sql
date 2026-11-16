-- Perfil público (RN24 revista) e buckets privados de fotos (RN31).

alter table public.apelidos_usuario
  add column usuario text check (usuario ~ '^[a-z0-9_]{3,15}$'),
  add column avatar_caminho text,
  add column bio text check (char_length(bio) <= 160);
create unique index idx_apelidos_usuario_arroba on public.apelidos_usuario (usuario);

-- Buckets privados, 5 MB, só JPEG (o app redimensiona antes de enviar).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select b, b, false, 5242880, array['image/jpeg']
from unnest(array['avatares', 'checkins', 'posts', 'banners', 'evolucao']) b;

-- Arquivos ficam em <usuario_id>/<arquivo>.jpg: cada pessoa mexe só na própria pasta.
-- Etapas 33, 35 e 36 ampliam a leitura (grupo, seguidor) bucket a bucket; por ora só o dono lê.
create policy fotos_dono_ler on storage.objects for select to authenticated
  using (bucket_id in ('avatares', 'checkins', 'posts', 'banners', 'evolucao')
         and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy fotos_dono_criar on storage.objects for insert to authenticated
  with check (bucket_id in ('avatares', 'checkins', 'posts', 'banners', 'evolucao')
              and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy fotos_dono_alterar on storage.objects for update to authenticated
  using (bucket_id in ('avatares', 'checkins', 'posts', 'banners', 'evolucao')
         and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy fotos_dono_apagar on storage.objects for delete to authenticated
  using (bucket_id in ('avatares', 'checkins', 'posts', 'banners', 'evolucao')
         and (storage.foldername(name))[1] = (select auth.uid())::text);
-- Avatar é parte do perfil público: qualquer pessoa logada vê.
create policy avatares_ler on storage.objects for select to authenticated
  using (bucket_id = 'avatares');
