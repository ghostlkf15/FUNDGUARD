-- =================================================================
-- FUNDGUARD · Esquema inicial de base de datos Supabase
-- Plataforma de simulación de pruebas de fondeo
-- Versión 1.0 · TKECH / LKALGORITMIC
-- =================================================================

-- Extensiones requeridas
create extension if not exists "pgcrypto";
create extension if not exists "pgjwt" with schema extensions;

-- =================================================================
-- Enums
-- =================================================================

do $$ begin
  create type market_type as enum ('forex', 'futuros', 'crypto');
exception when duplicate_object then null; end $$;

do $$ begin
  create type challenge_status as enum (
    'draft', 'linking', 'active', 'approved', 'failed',
    'disconnected', 'phase_changed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type drawdown_type as enum ('static', 'trailing');
exception when duplicate_object then null; end $$;

do $$ begin
  create type rule_event_type as enum (
    'approved', 'failed_max_dd', 'failed_daily_dd', 'failed_special',
    'alert_daily_dd', 'alert_max_dd', 'phase_change',
    'disconnected', 'reconnected'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_channel as enum ('email', 'in_app', 'push');
exception when duplicate_object then null; end $$;

do $$ begin
  create type account_link_method as enum (
    'ea_mt4', 'ea_mt5', 'cbot_ctrader', 'crypto_api'
  );
exception when duplicate_object then null; end $$;

-- =================================================================
-- profiles (extiende auth.users)
-- =================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade not null,
  full_name text,
  avatar_url text,
  is_admin boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- =================================================================
-- firms
-- =================================================================

create table if not exists public.firms (
  id uuid primary key default gen_random_uuid() not null,
  name text not null,
  slug text not null unique,
  market market_type not null,
  logo_url text,
  website_url text,
  description text,
  is_active boolean default true not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists firms_market_idx on public.firms(market);

-- =================================================================
-- firm_presets (incluye phases como JSONB por flexibilidad)
-- =================================================================

create table if not exists public.firm_presets (
  id uuid primary key default gen_random_uuid() not null,
  firm_id uuid references public.firms(id) on delete cascade not null,
  name text not null,
  slug text not null,
  initial_balance numeric(18,2) not null,
  currency text default 'USD' not null,
  phases jsonb not null default '[]'::jsonb,
  broker_timezone text default 'Etc/UTC' not null,
  daily_reset_hour_utc integer default 0 not null,
  is_active boolean default true not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists firm_presets_firm_idx on public.firm_presets(firm_id);

-- =================================================================
-- challenges
-- =================================================================

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid() not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  firm_id uuid references public.firms(id) on delete restrict not null,
  preset_id uuid references public.firm_presets(id) on delete restrict not null,
  market market_type not null,
  current_phase integer default 0 not null,
  status challenge_status default 'draft' not null,
  initial_balance numeric(18,2) not null,
  current_balance numeric(18,2) not null,
  current_equity numeric(18,2) not null,
  peak_equity numeric(18,2) not null,
  start_daily_balance numeric(18,2) not null,
  daily_pnl numeric(18,2) default 0 not null,
  total_pnl numeric(18,2) default 0 not null,
  total_pnl_pct numeric(8,4) default 0 not null,
  daily_drawdown_pct numeric(8,4) default 0 not null,
  max_drawdown_pct numeric(8,4) default 0 not null,
  trading_days_count integer default 0 not null,
  last_trade_date date,
  ea_last_report_at timestamptz,
  broker_server_timezone text,
  link_method account_link_method,
  report_key_hash text,
  crypto_api_key_enc text,
  crypto_api_secret_enc text,
  crypto_exchange_id text,
  crypto_passphrase_enc text,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists challenges_user_idx on public.challenges(user_id);
create index if not exists challenges_status_idx on public.challenges(status);
create index if not exists challenges_report_key_idx on public.challenges(report_key_hash);

-- =================================================================
-- equity_snapshots
-- =================================================================

create table if not exists public.equity_snapshots (
  id bigint generated always as identity primary key,
  challenge_id uuid references public.challenges(id) on delete cascade not null,
  balance numeric(18,2) not null,
  equity numeric(18,2) not null,
  daily_pnl numeric(18,2) not null,
  total_pnl numeric(18,2) not null,
  daily_dd_pct numeric(8,4) not null,
  max_dd_pct numeric(8,4) not null,
  open_positions_count integer default 0 not null,
  timestamp timestamptz default now() not null
);

create index if not exists equity_snapshots_challenge_ts on public.equity_snapshots(challenge_id, timestamp);

-- =================================================================
-- trades
-- =================================================================

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid() not null,
  challenge_id uuid references public.challenges(id) on delete cascade not null,
  external_id text not null,
  symbol text not null,
  side text not null check (side in ('buy','sell')),
  volume numeric(18,4) not null,
  open_price numeric(18,6) not null,
  close_price numeric(18,6),
  open_time timestamptz not null,
  close_time timestamptz,
  pnl numeric(18,2),
  swap numeric(18,2) default 0,
  commission numeric(18,2) default 0,
  is_open boolean default true not null,
  created_at timestamptz default now() not null,
  unique (challenge_id, external_id)
);

create index if not exists trades_challenge_idx on public.trades(challenge_id);
create index if not exists trades_open_idx on public.trades(is_open);

-- =================================================================
-- rule_events
-- =================================================================

create table if not exists public.rule_events (
  id uuid primary key default gen_random_uuid() not null,
  challenge_id uuid references public.challenges(id) on delete cascade not null,
  type rule_event_type not null,
  message text not null,
  severity text not null check (severity in ('info','warning','critical')),
  snapshot_json jsonb,
  created_at timestamptz default now() not null
);

create index if not exists rule_events_challenge_idx on public.rule_events(challenge_id);

-- =================================================================
-- notifications
-- =================================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid() not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  challenge_id uuid references public.challenges(id) on delete set null,
  channel notification_channel not null,
  subject text,
  body text not null,
  is_read boolean default false not null,
  sent_at timestamptz default now() not null,
  read_at timestamptz
);

create index if not exists notifications_user_idx on public.notifications(user_id, is_read);

-- =================================================================
-- Trigger updated_at
-- =================================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists _100_profiles_updated_at on public.profiles;
create trigger _100_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists _100_firms_updated_at on public.firms;
create trigger _100_firms_updated_at before update on public.firms
  for each row execute function public.set_updated_at();

drop trigger if exists _100_firm_presets_updated_at on public.firm_presets;
create trigger _100_firm_presets_updated_at before update on public.firm_presets
  for each row execute function public.set_updated_at();

drop trigger if exists _100_challenges_updated_at on public.challenges;
create trigger _100_challenges_updated_at before update on public.challenges
  for each row execute function public.set_updated_at();

-- =================================================================
-- Trigger para crear profile tras insert de user
-- =================================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    false
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- =================================================================
-- ROW LEVEL SECURITY
-- =================================================================

alter table public.profiles enable row level security;
alter table public.firms enable row level security;
alter table public.firm_presets enable row level security;
alter table public.challenges enable row level security;
alter table public.equity_snapshots enable row level security;
alter table public.trades enable row level security;
alter table public.rule_events enable row level security;
alter table public.notifications enable row level security;

-- profiles: el usuario lee su propio perfil; admin lee todo
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (
  auth.uid() = id or exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  )
);

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update using (
  auth.uid() = id
);

-- firms y firm_presets: lectura pública para usuarios autenticados
drop policy if exists firms_select on public.firms;
create policy firms_select on public.firms for select
  using (auth.role() = 'anon' or auth.uid() is not null or true);

drop policy if exists firms_admin on public.firms;
create policy firms_admin on public.firms for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

drop policy if exists presets_select on public.firm_presets;
create policy presets_select on public.firm_presets for select
  using (auth.role() = 'anon' or auth.uid() is not null or true);

drop policy if exists presets_admin on public.firm_presets;
create policy presets_admin on public.firm_presets for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- challenges: cada usuario lo suyo; admin todo
drop policy if exists challenges_own on public.challenges;
create policy challenges_own on public.challenges for all using (
  auth.uid() = user_id or exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  )
);

drop policy if exists snapshots_own on public.equity_snapshots;
create policy snapshots_own on public.equity_snapshots for select using (
  exists (
    select 1 from public.challenges c
    where c.id = challenge_id and (c.user_id = auth.uid() or exists (
      select 1 from public.profiles where id = auth.uid() and is_admin = true
    ))
  )
);

drop policy if exists trades_own on public.trades;
create policy trades_own on public.trades for all using (
  exists (
    select 1 from public.challenges c
    where c.id = challenge_id and (c.user_id = auth.uid() or exists (
      select 1 from public.profiles where id = auth.uid() and is_admin = true
    ))
  )
);

drop policy if exists events_own on public.rule_events;
create policy events_own on public.rule_events for select using (
  exists (
    select 1 from public.challenges c
    where c.id = challenge_id and (c.user_id = auth.uid() or exists (
      select 1 from public.profiles where id = auth.uid() and is_admin = true
    ))
  )
);

drop policy if exists notifications_own on public.notifications;
create policy notifications_own on public.notifications for all using (
  auth.uid() = user_id or exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  )
);

-- =================================================================
-- Realtime publications
-- =================================================================

alter publication supabase_realtime add table public.challenges;
alter publication supabase_realtime add table public.equity_snapshots;
alter publication supabase_realtime add table public.rule_events;
alter publication supabase_realtime add table public.notifications;

-- =================================================================
-- pg_cron: limpieza de snapshots antiguos (si está habilitado)
-- =================================================================

-- (descomentar si se habilita pg_cron en el proyecto
-- select cron.schedule('cleanup-old-snapshots', '0 3 * * *', $$
--   delete from public.equity_snapshots where timestamp < now() - interval '90 days';
-- $$);
