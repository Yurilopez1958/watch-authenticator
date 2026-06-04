-- =====================================================================
-- Reference gallery — synced photos of verified-authentic watches
-- Each user's photos are private (RLS by auth.uid()). Image files live in
-- the 'gallery' Storage bucket; this table holds the metadata.
-- =====================================================================

create table if not exists gallery_photos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  brand_id      text not null,
  model_id      text not null,
  caliber       text,
  year          int,
  part          text not null,
  storage_path  text not null,
  created_at    timestamptz not null default now()
);

create index if not exists gallery_user_model_part_idx
  on gallery_photos(user_id, brand_id, model_id, part);

alter table gallery_photos enable row level security;

drop policy if exists "gallery_own" on gallery_photos;
create policy "gallery_own"
  on gallery_photos for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------- Storage bucket + policies ----------
-- Private bucket; files stored under "{user_id}/..." so each user only
-- touches their own prefix.
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', false)
on conflict (id) do nothing;

drop policy if exists "gallery_read_own" on storage.objects;
create policy "gallery_read_own"
  on storage.objects for select to authenticated
  using (bucket_id = 'gallery' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "gallery_insert_own" on storage.objects;
create policy "gallery_insert_own"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'gallery' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "gallery_delete_own" on storage.objects;
create policy "gallery_delete_own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'gallery' and (storage.foldername(name))[1] = auth.uid()::text);
