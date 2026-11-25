-- Execute todo este arquivo no Supabase: SQL Editor > New query > Run.
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 70),
  campus text not null check (campus in ('Maracanã','Maria da Graça','Angra dos Reis','Itaguaí','Nova Friburgo','Nova Iguaçu','Petrópolis','Valença')),
  category text not null,
  place text,
  description text not null,
  contact text not null,
  photo_url text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '1 year')
);

alter table public.items enable row level security;

drop policy if exists "Anúncios ativos são públicos" on public.items;
create policy "Anúncios ativos são públicos"
on public.items for select to anon, authenticated
using (expires_at > now());

drop policy if exists "Usuário cria seus anúncios" on public.items;
create policy "Usuário cria seus anúncios"
on public.items for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Dono pode excluir anúncio" on public.items;
create policy "Dono pode excluir anúncio"
on public.items for delete to authenticated
using (auth.uid() = user_id);

create index if not exists items_campus_idx on public.items(campus);
create index if not exists items_expires_at_idx on public.items(expires_at);

-- Fotos: crie um bucket público chamado item-photos no Storage.
-- Depois, execute estas políticas:
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('item-photos', 'item-photos', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true, file_size_limit=5242880;

drop policy if exists "Fotos são públicas" on storage.objects;
create policy "Fotos são públicas" on storage.objects
for select to anon, authenticated using (bucket_id = 'item-photos');

drop policy if exists "Usuário envia foto na própria pasta" on storage.objects;
create policy "Usuário envia foto na própria pasta" on storage.objects
for insert to authenticated
with check (bucket_id = 'item-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Exclusão automática diária de anúncios com mais de 1 ano.
-- No Supabase, habilite a extensão pg_cron (Database > Extensions) antes de executar:
create extension if not exists pg_cron;
select cron.schedule(
  'apagar-anuncios-expirados',
  '15 3 * * *',
  $$delete from public.items where expires_at <= now();$$
);
