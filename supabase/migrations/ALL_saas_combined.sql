-- ============================================================
-- Watch Authenticator - TODO el esquema SaaS en un solo archivo.
-- Pega esto en Supabase -> SQL Editor y ejecuta una vez.
-- (Equivale a las migraciones 0001 + 0002 + 0003.)
-- ============================================================


-- >>> 0001_saas_subscriptions.sql
-- ============================================================================
-- Watch Authenticator — SaaS subscriptions schema (Supabase / Postgres)
-- Run in the Supabase SQL editor. Assumes Supabase Auth (auth.users) exists.
-- ============================================================================

-- ---------- enums ----------
do $$ begin
  create type user_role   as enum ('user','admin');
  create type user_status as enum ('active','blocked','review');
  create type plan_id     as enum ('free','pro','business');
  create type sub_status  as enum ('active','trialing','past_due','canceled','incomplete','incomplete_expired','unpaid');
  create type usage_kind  as enum ('auth','valuation');
  create type sec_type    as enum ('new_device','suspicious_ip','limit_blocked','concurrent','manual_block');
exception when duplicate_object then null; end $$;

-- ---------- profiles (1:1 con auth.users) ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  role        user_role   not null default 'user',
  status      user_status not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Crea el profile automáticamente al registrarse un usuario.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- subscriptions (1:1 con usuario) ----------
create table if not exists public.subscriptions (
  user_id                uuid primary key references auth.users(id) on delete cascade,
  plan                   plan_id    not null default 'free',
  status                 sub_status not null default 'active',
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  grace_until            timestamptz,            -- gracia tras past_due antes de bloquear
  updated_at             timestamptz not null default now()
);
create index if not exists idx_sub_customer on public.subscriptions(stripe_customer_id);

-- ---------- usage_counters (uno por usuario y mes) ----------
create table if not exists public.usage_counters (
  user_id         uuid not null references auth.users(id) on delete cascade,
  period_start    date not null,                 -- date_trunc('month', now())
  auth_count      int  not null default 0,
  valuation_count int  not null default 0,
  primary key (user_id, period_start)
);

-- ---------- usage_events (auditoría opcional) ----------
create table if not exists public.usage_events (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  kind        usage_kind not null,
  created_at  timestamptz not null default now(),
  meta        jsonb
);
create index if not exists idx_usage_events_user on public.usage_events(user_id, created_at desc);

-- ---------- devices (anti-cuentas-compartidas) ----------
create table if not exists public.devices (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  device_id   text not null,                     -- id aleatorio del cliente (hash)
  label       text,
  user_agent  text,
  last_ip     text,
  last_seen   timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  revoked     boolean not null default false,
  unique (user_id, device_id)
);
create index if not exists idx_devices_user on public.devices(user_id, last_seen desc);

-- ---------- security_events (alertas para el admin) ----------
create table if not exists public.security_events (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users(id) on delete set null,
  type        sec_type not null,
  severity    int not null default 1,            -- 1=info, 2=warn, 3=alta
  ip          text,
  details     jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists idx_sec_created on public.security_events(created_at desc);

-- ---------- payments (alimentado por invoice.paid) ----------
create table if not exists public.payments (
  id              text primary key,              -- stripe invoice id
  user_id         uuid references auth.users(id) on delete set null,
  amount_cents    int not null,
  currency        text not null,
  status          text not null,                 -- paid, refunded...
  description     text,
  created_at      timestamptz not null default now()
);
create index if not exists idx_payments_user on public.payments(user_id, created_at desc);

-- ---------- webhook_events (idempotencia) ----------
create table if not exists public.webhook_events (
  id           text primary key,                 -- stripe event id
  type         text not null,
  processed_at timestamptz not null default now()
);

-- ============================================================================
-- Función: helper de admin
-- ============================================================================
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

-- ============================================================================
-- Función: consumo de cuota ATÓMICO (check + increment con lock de fila)
--   p_limit NULL = ilimitado. Devuelve si se permitió y el uso resultante.
-- ============================================================================
create or replace function public.consume_quota(p_user uuid, p_kind usage_kind, p_limit int)
returns table(allowed boolean, used int, period date)
language plpgsql security definer set search_path = public as $$
declare
  v_period date := date_trunc('month', now())::date;
  v_used   int;
begin
  insert into public.usage_counters(user_id, period_start)
  values (p_user, v_period)
  on conflict (user_id, period_start) do nothing;

  -- bloquea la fila del periodo para evitar carreras
  if p_kind = 'auth' then
    select auth_count into v_used from public.usage_counters
      where user_id = p_user and period_start = v_period for update;
  else
    select valuation_count into v_used from public.usage_counters
      where user_id = p_user and period_start = v_period for update;
  end if;

  if p_limit is not null and v_used >= p_limit then
    return query select false, v_used, v_period; return;
  end if;

  if p_kind = 'auth' then
    update public.usage_counters set auth_count = auth_count + 1
      where user_id = p_user and period_start = v_period returning auth_count into v_used;
  else
    update public.usage_counters set valuation_count = valuation_count + 1
      where user_id = p_user and period_start = v_period returning valuation_count into v_used;
  end if;

  insert into public.usage_events(user_id, kind) values (p_user, p_kind);
  return query select true, v_used, v_period;
end; $$;

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles        enable row level security;
alter table public.subscriptions   enable row level security;
alter table public.usage_counters  enable row level security;
alter table public.usage_events    enable row level security;
alter table public.devices         enable row level security;
alter table public.security_events enable row level security;
alter table public.payments        enable row level security;

-- profiles: cada uno lee/edita lo suyo; admin lee todo.
create policy profiles_self_select on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy profiles_self_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- subscriptions: solo lectura por el dueño o admin (las ESCRITURAS las hace el
-- servidor con la service-role key, que SALTA la RLS).
create policy subs_select on public.subscriptions for select using (user_id = auth.uid() or public.is_admin());

-- usage: lectura del dueño/admin. Las escrituras van por consume_quota (definer) o service-role.
create policy usage_select   on public.usage_counters for select using (user_id = auth.uid() or public.is_admin());
create policy events_select  on public.usage_events   for select using (user_id = auth.uid() or public.is_admin());

-- devices: el dueño puede ver y revocar (borrar) sus dispositivos.
create policy devices_select on public.devices for select using (user_id = auth.uid() or public.is_admin());
create policy devices_delete on public.devices for delete using (user_id = auth.uid());

-- security_events / payments: solo admin (vía RLS); el servidor inserta con service-role.
create policy sec_admin_select  on public.security_events for select using (public.is_admin());
create policy pay_select        on public.payments        for select using (user_id = auth.uid() or public.is_admin());

-- NOTA: webhook_events no necesita RLS de cliente (solo lo toca el servidor).
alter table public.webhook_events enable row level security;  -- sin policies = sin acceso de cliente

-- Sembrar una suscripción 'free' al crear el profile (opcional).
create or replace function public.handle_new_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.subscriptions(user_id, plan, status) values (new.id, 'free', 'active')
  on conflict (user_id) do nothing;
  return new;
end; $$;
drop trigger if exists on_profile_created on public.profiles;
create trigger on_profile_created after insert on public.profiles
  for each row execute function public.handle_new_profile();


-- >>> 0002_api_dealers.sql
-- ============================================================================
-- Dealer API keys. Each key belongs to a user; only a SHA-256 hash is stored
-- (the raw key is shown once at creation and never persisted).
-- ============================================================================

create table if not exists public.api_keys (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text,
  prefix       text not null,              -- e.g. "wa_live_ab12" for display
  key_hash     text not null unique,       -- sha-256 hex of the full key
  last_used_at timestamptz,
  revoked      boolean not null default false,
  created_at   timestamptz not null default now()
);
create index if not exists idx_api_keys_user on public.api_keys(user_id, created_at desc);

alter table public.api_keys enable row level security;

-- Owner (or admin) can read metadata. The raw key is never stored, only its hash.
create policy api_keys_select on public.api_keys
  for select using (user_id = auth.uid() or public.is_admin());
-- Owner can revoke by deleting; create/update happen server-side (service-role).
create policy api_keys_delete on public.api_keys
  for delete using (user_id = auth.uid());


-- >>> 0003_credits.sql
-- ============================================================================
-- Prepaid credits. Consumed automatically when a user exceeds their plan's
-- monthly limit (instead of being blocked), if they have balance.
-- ============================================================================

create table if not exists public.credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance int not null default 0
);

create table if not exists public.credit_ledger (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  delta      int not null,
  reason     text,
  created_at timestamptz not null default now()
);
create index if not exists idx_credit_ledger_user on public.credit_ledger(user_id, created_at desc);

alter table public.credits       enable row level security;
alter table public.credit_ledger enable row level security;
create policy credits_select on public.credits       for select using (user_id = auth.uid() or public.is_admin());
create policy ledger_select  on public.credit_ledger for select using (user_id = auth.uid() or public.is_admin());

-- Atomically spend one credit; returns true if a credit was available.
create or replace function public.spend_credit(p_user uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  update public.credits set balance = balance - 1 where user_id = p_user and balance > 0;
  if found then
    insert into public.credit_ledger(user_id, delta, reason) values (p_user, -1, 'usage');
    return true;
  end if;
  return false;
end; $$;

-- Adds credits (e.g. after a one-time purchase).
create or replace function public.add_credits(p_user uuid, p_n int, p_reason text)
returns int language plpgsql security definer set search_path = public as $$
declare v_bal int;
begin
  insert into public.credits(user_id, balance) values (p_user, p_n)
  on conflict (user_id) do update set balance = public.credits.balance + p_n
  returning balance into v_bal;
  insert into public.credit_ledger(user_id, delta, reason) values (p_user, p_n, p_reason);
  return v_bal;
end; $$;
