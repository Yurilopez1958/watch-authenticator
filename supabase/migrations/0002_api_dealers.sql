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
