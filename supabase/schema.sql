-- ═══════════════════════════════════════════════════════════════
-- جيبك — Supabase Database Schema
-- Apply this in Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────
-- Extensions
-- ───────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ───────────────────────────────────────────
-- 1. budget_plans
--    One active plan per user (upsert by user_id)
-- ───────────────────────────────────────────
create table if not exists public.budget_plans (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users(id) on delete cascade,
  currency                 text not null default 'EGP',
  starting_balance_minor   bigint not null default 0,   -- stored in minor units (piastres / cents)
  fixed_commitments_minor  bigint not null default 0,
  start_date               date not null,
  target_date              date not null,
  planned_daily_spend_minor bigint not null default 0,
  forecast_mode            text not null default 'planned' check (forecast_mode in ('planned', 'actual')),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- Index for fast user lookups
create index if not exists budget_plans_user_id_idx on public.budget_plans (user_id);

-- ───────────────────────────────────────────
-- 2. expenses
-- ───────────────────────────────────────────
create table if not exists public.expenses (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  plan_id         uuid references public.budget_plans(id) on delete set null,
  amount_minor    bigint not null default 0,    -- minor units
  expense_date    date not null,
  category_id     text not null default 'other',
  note            text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Index for user + date range queries
create index if not exists expenses_user_id_date_idx on public.expenses (user_id, expense_date desc);
create index if not exists expenses_plan_id_idx on public.expenses (plan_id);

-- ───────────────────────────────────────────
-- 3. preferences
--    One row per user, upsert-friendly
-- ───────────────────────────────────────────
create table if not exists public.preferences (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  language  text not null default 'ar' check (language in ('ar', 'en')),
  currency  text not null default 'EGP',
  updated_at timestamptz not null default now()
);

-- ───────────────────────────────────────────
-- 4. Row-Level Security (RLS)
--    Users can only read/write their own rows
-- ───────────────────────────────────────────

-- budget_plans
alter table public.budget_plans enable row level security;

create policy "Users can manage their own plans"
  on public.budget_plans
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- expenses
alter table public.expenses enable row level security;

create policy "Users can manage their own expenses"
  on public.expenses
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- preferences
alter table public.preferences enable row level security;

create policy "Users can manage their own preferences"
  on public.preferences
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ───────────────────────────────────────────
-- 5. Auto-update updated_at via trigger
-- ───────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger budget_plans_updated_at
  before update on public.budget_plans
  for each row execute procedure public.set_updated_at();

create trigger expenses_updated_at
  before update on public.expenses
  for each row execute procedure public.set_updated_at();

create trigger preferences_updated_at
  before update on public.preferences
  for each row execute procedure public.set_updated_at();

-- ───────────────────────────────────────────
-- 6. Auto-create preferences row on signup
-- ───────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.preferences (user_id, language, currency)
  values (new.id, 'ar', 'EGP')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
