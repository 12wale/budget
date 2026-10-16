-- Budget Survival Calculator — Supabase schema
-- Run in the Supabase SQL Editor. Safe to run again after a partial setup.

create extension if not exists pgcrypto;

create table if not exists public.budget_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  currency text not null default 'EGP',
  starting_balance_minor bigint not null default 0 check (starting_balance_minor >= 0),
  fixed_commitments_minor bigint not null default 0 check (fixed_commitments_minor >= 0),
  start_date date not null,
  target_date date not null,
  planned_daily_spend_minor bigint not null default 0 check (planned_daily_spend_minor >= 0),
  forecast_mode text not null default 'planned' check (forecast_mode in ('planned', 'actual')),
  status text not null default 'active' check (status in ('active', 'ended')),
  ended_at timestamptz,
  saved_balance_minor bigint not null default 0 check (saved_balance_minor >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budget_plans_date_order check (target_date >= start_date),
  constraint budget_plans_commitments_within_balance check (fixed_commitments_minor <= starting_balance_minor)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid references public.budget_plans(id) on delete set null,
  amount_minor bigint not null check (amount_minor > 0),
  expense_date date not null,
  category_id text not null default 'other',
  note text check (note is null or char_length(note) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  language text not null default 'ar' check (language in ('ar', 'en')),
  currency text not null default 'EGP',
  updated_at timestamptz not null default now()
);

-- Upgrade databases created with the original one-plan-per-user constraint.
alter table public.budget_plans add column if not exists status text not null default 'active';
alter table public.budget_plans add column if not exists ended_at timestamptz;
alter table public.budget_plans add column if not exists saved_balance_minor bigint not null default 0;
alter table public.budget_plans drop constraint if exists budget_plans_user_id_key;
drop index if exists public.budget_plans_user_id_uidx;
create unique index if not exists budget_plans_one_active_per_user_uidx
  on public.budget_plans (user_id) where status = 'active';
create index if not exists expenses_user_date_idx on public.expenses (user_id, expense_date desc);
create index if not exists expenses_plan_id_idx on public.expenses (plan_id);

-- Email ownership is confirmed by Firebase; this claim is set server-side only.
create or replace function public.is_email_verified()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt()->'app_metadata'->>'email_verified' = 'true', false);
$$;

alter table public.budget_plans enable row level security;
alter table public.expenses enable row level security;
alter table public.preferences enable row level security;

drop policy if exists "Users can manage their own plans" on public.budget_plans;
create policy "Users can manage their own plans" on public.budget_plans
  for all to authenticated
  using (auth.uid() = user_id and public.is_email_verified())
  with check (auth.uid() = user_id and public.is_email_verified());

drop policy if exists "Users can manage their own expenses" on public.expenses;
create policy "Users can manage their own expenses" on public.expenses
  for all to authenticated
  using (auth.uid() = user_id and public.is_email_verified())
  with check (
    auth.uid() = user_id
    and public.is_email_verified()
    and (
      plan_id is null
      or exists (
        select 1 from public.budget_plans p
        where p.id = plan_id and p.user_id = auth.uid()
      )
    )
  );

drop policy if exists "Users can manage their own preferences" on public.preferences;
create policy "Users can manage their own preferences" on public.preferences
  for all to authenticated
  using (auth.uid() = user_id and public.is_email_verified())
  with check (auth.uid() = user_id and public.is_email_verified());

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists budget_plans_updated_at on public.budget_plans;
create trigger budget_plans_updated_at before update on public.budget_plans
  for each row execute function public.set_updated_at();

drop trigger if exists expenses_updated_at on public.expenses;
create trigger expenses_updated_at before update on public.expenses
  for each row execute function public.set_updated_at();

drop trigger if exists preferences_updated_at on public.preferences;
create trigger preferences_updated_at before update on public.preferences
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.preferences (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
