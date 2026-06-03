-- =====================================================================
-- Watch Authenticator — Esquema inicial
-- =====================================================================
-- Tablas principales para el MVP. Modelo de datos preparado para
-- multimarca aunque el seed inicial solo cubre Rolex.
-- =====================================================================

create extension if not exists "uuid-ossp";

-- ---------- Catálogo público (lectura para todos los autenticados) ----------

create table brands (
  id              text primary key,
  name            text not null,
  country         text,
  founded_year    int,
  created_at      timestamptz not null default now()
);

create table models (
  id                  text primary key,
  brand_id            text not null references brands(id) on delete cascade,
  name                text not null,
  reference           text not null,
  year_start          int  not null,
  year_end            int,
  caliber             text,
  case_diameter_mm    numeric(5,2),
  created_at          timestamptz not null default now()
);

create index models_brand_idx on models(brand_id);

create table materials (
  id            text primary key,
  name          text not null,
  kind          text not null check (kind in ('steel','gold','platinum','titanium','ceramic','other')),
  description   text,
  created_at    timestamptz not null default now()
);

create table reference_profiles (
  id              text primary key,
  material_id     text not null references materials(id) on delete cascade,
  brand_id        text not null references brands(id) on delete cascade,
  model_id        text references models(id) on delete cascade,
  year_start      int  not null,
  year_end        int,
  source          text not null check (source in ('public','measured')),
  notes           text,
  created_at      timestamptz not null default now()
);

create index ref_profiles_brand_idx on reference_profiles(brand_id);
create index ref_profiles_model_idx on reference_profiles(model_id);

create table reference_profile_elements (
  profile_id      text not null references reference_profiles(id) on delete cascade,
  element         text not null,
  min_pct         numeric(6,3) not null,
  max_pct         numeric(6,3) not null,
  tolerance_abs   numeric(5,3),
  is_critical     boolean not null default false,
  primary key (profile_id, element)
);

-- ---------- Datos de usuario (privado por user_id) ----------

create table watches (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid not null references auth.users(id) on delete cascade,
  brand_id                text not null references brands(id),
  model_id                text not null references models(id),
  serial_number           text,
  year_of_manufacture     int  not null,
  purpose                 text not null check (purpose in ('authentication','reference')),
  notes                   text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index watches_user_idx on watches(user_id);

create table xrf_measurements (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  watch_id            uuid references watches(id) on delete cascade,
  part_measured       text not null,
  measured_at         timestamptz not null,
  instrument          text not null check (instrument in ('niton-xl','other')),
  serial_reading      text,
  notes               text,
  created_at          timestamptz not null default now()
);

create index measurements_watch_idx on xrf_measurements(watch_id);
create index measurements_user_idx  on xrf_measurements(user_id);

create table element_readings (
  measurement_id      uuid not null references xrf_measurements(id) on delete cascade,
  element             text not null,
  pct                 numeric(7,4) not null,
  error_pct           numeric(6,4),
  primary key (measurement_id, element)
);

create table photos (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  watch_id        uuid not null references watches(id) on delete cascade,
  part            text not null,
  storage_path    text not null,
  taken_at        timestamptz not null,
  notes           text,
  created_at      timestamptz not null default now()
);

create index photos_watch_idx on photos(watch_id);
create index photos_user_idx  on photos(user_id);

-- Cache de resultados de match para no recalcular
create table match_results (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  measurement_id      uuid not null references xrf_measurements(id) on delete cascade,
  profile_id          text not null references reference_profiles(id) on delete cascade,
  overall_score       int  not null,
  verdict             text not null check (verdict in ('likely-authentic','inconclusive','likely-fake')),
  flags               jsonb not null default '[]'::jsonb,
  element_matches     jsonb not null default '[]'::jsonb,
  created_at          timestamptz not null default now()
);

create index match_results_measurement_idx on match_results(measurement_id);

-- ---------- Row Level Security ----------

alter table brands                      enable row level security;
alter table models                      enable row level security;
alter table materials                   enable row level security;
alter table reference_profiles          enable row level security;
alter table reference_profile_elements  enable row level security;
alter table watches                     enable row level security;
alter table xrf_measurements            enable row level security;
alter table element_readings            enable row level security;
alter table photos                      enable row level security;
alter table match_results               enable row level security;

-- Catálogo: lectura para cualquier usuario autenticado
create policy "catalog_read_brands"   on brands   for select to authenticated using (true);
create policy "catalog_read_models"   on models   for select to authenticated using (true);
create policy "catalog_read_mat"      on materials for select to authenticated using (true);
create policy "catalog_read_refprof"  on reference_profiles for select to authenticated using (true);
create policy "catalog_read_refelem"  on reference_profile_elements for select to authenticated using (true);

-- Datos de usuario: solo el propio user_id puede leer/escribir lo suyo
create policy "watches_own"            on watches            for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "measurements_own"       on xrf_measurements   for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "photos_own"             on photos             for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "match_results_own"      on match_results      for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- element_readings hereda permiso vía la medición padre
create policy "element_readings_own"
  on element_readings for all to authenticated
  using (exists (select 1 from xrf_measurements m where m.id = measurement_id and m.user_id = auth.uid()))
  with check (exists (select 1 from xrf_measurements m where m.id = measurement_id and m.user_id = auth.uid()));

-- ---------- Trigger updated_at ----------

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger watches_updated_at before update on watches
  for each row execute procedure set_updated_at();

-- ---------- Storage bucket para fotos ----------
-- Ejecutar manualmente en Supabase Dashboard o via API:
--   insert into storage.buckets (id, name, public) values ('watch-photos', 'watch-photos', false);
-- Y configurar políticas RLS en storage.objects para que cada user_id solo
-- pueda subir/leer fotos bajo su prefijo.
