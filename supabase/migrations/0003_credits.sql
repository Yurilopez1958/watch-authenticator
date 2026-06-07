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
