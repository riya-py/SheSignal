-- SheSignal Phase 1: profiles + reports schema, constraints, indexes, RLS.
-- Run this in the Supabase SQL editor (or via `supabase db push`) on a fresh project.

create extension if not exists pgcrypto;
create extension if not exists postgis;

-- ============================================================
-- profiles
-- ============================================================
create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    role text not null default 'user' check (role in ('user', 'admin')),
    created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new Supabase Auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id) values (new.id);
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- ============================================================
-- reports
-- ============================================================
create table if not exists public.reports (
    id uuid primary key default gen_random_uuid(),
    reporter_id uuid references public.profiles (id) on delete set null,
    category text not null check (
        category in (
            'harassment', 'poor_lighting', 'stalking', 'isolated_area',
            'unsafe_transit', 'suspicious_activity', 'other'
        )
    ),
    description text not null check (char_length(description) between 1 and 1000),
    latitude double precision not null check (latitude between -90 and 90),
    longitude double precision not null check (longitude between -180 and 180),
    location geography(Point, 4326)
        generated always as (
            ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
        ) stored,
    occurred_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    status text not null default 'active' check (status in ('active', 'flagged', 'removed'))
);

create index if not exists reports_location_gix on public.reports using gist (location);
create index if not exists reports_created_at_idx on public.reports (created_at desc);
create index if not exists reports_category_idx on public.reports (category);
create index if not exists reports_status_idx on public.reports (status);

-- Public-safe view: never exposes reporter_id, only active reports.
create or replace view public.public_reports
with (security_invoker = true)
as
    select id, category, description, latitude, longitude, occurred_at, created_at, status
    from public.reports
    where status = 'active';

-- ============================================================
-- RLS
-- ============================================================
alter table public.profiles enable row level security;
alter table public.reports enable row level security;

-- profiles: a user may only see/update their own row.
create policy "profiles_select_own" on public.profiles
    for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
    for update using (auth.uid() = id);

-- reports: authenticated users may insert their own report only.
create policy "reports_insert_own" on public.reports
    for insert to authenticated
    with check (auth.uid() = reporter_id);

-- reports: a user may read their own submitted reports (raw row, for a
-- future "my reports" feature). No general SELECT policy exists on the
-- base table, so anon/other users get zero rows from it directly.
create policy "reports_select_own" on public.reports
    for select to authenticated
    using (auth.uid() = reporter_id);

-- Intentionally no UPDATE/DELETE policies for regular users: reports are
-- immutable once submitted. Moderation happens server-side via the
-- service-role key only.

-- Public/anon access goes through the view, not the base table.