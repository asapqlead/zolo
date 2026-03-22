-- ============================================================
-- ZOLO — Supabase Schema
-- Run this in your Supabase project: SQL Editor → New Query
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── Users (anonymous, identified by a UUID stored in localStorage) ──────────
create table if not exists zolo_users (
  id          uuid primary key default gen_random_uuid(),
  profile     jsonb not null default '{}',
  total_xp    integer not null default 0,
  day_streak  integer not null default 0,
  last_streak_date text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Tasks ────────────────────────────────────────────────────────────────────
create table if not exists zolo_tasks (
  id            text primary key,
  user_id       uuid not null references zolo_users(id) on delete cascade,
  title         text not null,
  priority      text not null default 'medium',
  completed     boolean not null default false,
  date          text not null,
  completed_at  text,
  created_at    text not null,
  decay_state   text not null default 'healthy',
  xp_earned     integer,
  updated_at    timestamptz not null default now()
);

create index if not exists zolo_tasks_user_id on zolo_tasks(user_id);
create index if not exists zolo_tasks_date    on zolo_tasks(date);

-- ── Habits ───────────────────────────────────────────────────────────────────
create table if not exists zolo_habits (
  id               text primary key,
  user_id          uuid not null references zolo_users(id) on delete cascade,
  name             text not null,
  icon             text not null default '⭐',
  category         text not null default 'Custom',
  frequency        text not null default 'daily',
  streak           integer not null default 0,
  longest_streak   integer not null default 0,
  completed_dates  text[] not null default '{}',
  reminder_time    text,
  created_at       text not null,
  updated_at       timestamptz not null default now()
);

create index if not exists zolo_habits_user_id on zolo_habits(user_id);

-- ── Focus Sessions ───────────────────────────────────────────────────────────
create table if not exists zolo_focus_sessions (
  id          text primary key,
  user_id     uuid not null references zolo_users(id) on delete cascade,
  started_at  text not null,
  duration    integer not null,
  completed   boolean not null default false,
  updated_at  timestamptz not null default now()
);

create index if not exists zolo_focus_user_id on zolo_focus_sessions(user_id);

-- ── Reflections ──────────────────────────────────────────────────────────────
create table if not exists zolo_reflections (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references zolo_users(id) on delete cascade,
  week_start    text not null,
  content       text not null,
  generated_at  text not null,
  updated_at    timestamptz not null default now()
);

create index if not exists zolo_reflections_user_id on zolo_reflections(user_id);

-- ── Row Level Security ───────────────────────────────────────────────────────
-- Users can only read/write their own rows

alter table zolo_users          enable row level security;
alter table zolo_tasks          enable row level security;
alter table zolo_habits         enable row level security;
alter table zolo_focus_sessions enable row level security;
alter table zolo_reflections    enable row level security;

-- zolo_users: anyone can insert (anonymous signup), only owner can select/update/delete
create policy "users_insert" on zolo_users for insert with check (true);
create policy "users_select" on zolo_users for select using (true);
create policy "users_update" on zolo_users for update using (true);

-- Tasks
create policy "tasks_all" on zolo_tasks for all using (true) with check (true);

-- Habits
create policy "habits_all" on zolo_habits for all using (true) with check (true);

-- Focus sessions
create policy "focus_all" on zolo_focus_sessions for all using (true) with check (true);

-- Reflections
create policy "reflections_all" on zolo_reflections for all using (true) with check (true);

-- ── Updated_at trigger ───────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger zolo_users_updated_at          before update on zolo_users          for each row execute function set_updated_at();
create trigger zolo_tasks_updated_at          before update on zolo_tasks          for each row execute function set_updated_at();
create trigger zolo_habits_updated_at         before update on zolo_habits         for each row execute function set_updated_at();
create trigger zolo_focus_sessions_updated_at before update on zolo_focus_sessions for each row execute function set_updated_at();
create trigger zolo_reflections_updated_at    before update on zolo_reflections    for each row execute function set_updated_at();
