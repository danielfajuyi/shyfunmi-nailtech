-- Run this once in the Supabase SQL Editor (Dashboard → SQL → New query).
-- This is the salon database. Login, bookings, gallery and loyalty all live here.

create table if not exists app_state (
  id text primary key default 'main',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into app_state (id, data)
values ('main', '{}'::jsonb)
on conflict (id) do nothing;

alter table app_state enable row level security;

-- The Express server uses the service role key, which bypasses RLS.
-- No anon policies on purpose: the public site talks to the API, not directly to Postgres.
