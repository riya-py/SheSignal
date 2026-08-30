-- SheSignal Phase 3: pattern detection.
-- Run in the Supabase SQL editor after 0001 and 0002.
--
-- Design invariant (Phase 0/architecture doc): a pattern only exists when
-- enough reports cluster together - see the `having count(*) >= p_min_reports`
-- clause below. There is no code path that turns a single report into a
-- pattern. Individual reports -> aggregation -> pattern, never the reverse.

create table if not exists public.patterns (
    id uuid primary key default gen_random_uuid(),
    geohash text not null,
    time_bucket text not null check (
        time_bucket in ('morning', 'afternoon', 'evening', 'night')
    ),
    centroid_latitude double precision not null,
    centroid_longitude double precision not null,
    report_count integer not null,
    category_breakdown jsonb not null default '{}'::jsonb,
    factor_breakdown jsonb not null default '{}'::jsonb,
    first_report_at timestamptz not null,
    last_report_at timestamptz not null,
    computed_at timestamptz not null default now(),
    unique (geohash, time_bucket)
);

create index if not exists patterns_report_count_idx on public.patterns (report_count desc);
create index if not exists patterns_geohash_idx on public.patterns (geohash);
create index if not exists patterns_time_bucket_idx on public.patterns (time_bucket);

-- ============================================================
-- Aggregation function - all clustering happens in the database, never in
-- application memory. Geographic clustering: PostGIS ST_GeoHash grid cells
-- (cell size controlled by p_geohash_precision). Temporal clustering:
-- time-of-day bucket, preferring the AI-derived report_analysis.time_context
-- and falling back to the report's own occurred_at hour when analysis is
-- missing/failed - so pattern detection doesn't stall on AI outages.
-- ============================================================
create or replace function public.recompute_patterns(
    p_min_reports integer default 3,
    p_lookback_days integer default 90,
    p_geohash_precision integer default 7
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
    v_pattern_count integer;
begin
    create temporary table _report_cells on commit drop as
    select
        r.id as report_id,
        ST_GeoHash(r.location::geometry, p_geohash_precision) as geohash,
        coalesce(
            nullif(ra.time_context, 'unknown'),
            case
                when extract(hour from r.occurred_at) between 5 and 10 then 'morning'
                when extract(hour from r.occurred_at) between 11 and 16 then 'afternoon'
                when extract(hour from r.occurred_at) between 17 and 20 then 'evening'
                else 'night'
            end
        ) as time_bucket,
        r.category,
        r.latitude,
        r.longitude,
        r.occurred_at,
        ra.factors
    from public.reports r
    left join public.report_analysis ra on ra.report_id = r.id
    where r.status = 'active'
      and r.occurred_at >= now() - make_interval(days => p_lookback_days);

    create temporary table _qualifying_cells on commit drop as
    select geohash, time_bucket
    from _report_cells
    group by geohash, time_bucket
    having count(*) >= p_min_reports;

    -- Full refresh: cells that no longer qualify (e.g. reports removed by
    -- moderation) simply disappear instead of lingering as stale patterns.
    delete from public.patterns;

    insert into public.patterns (
        geohash, time_bucket, centroid_latitude, centroid_longitude,
        report_count, category_breakdown, factor_breakdown,
        first_report_at, last_report_at, computed_at
    )
    select
        c.geohash,
        c.time_bucket,
        avg(c.latitude),
        avg(c.longitude),
        count(*),
        (
            select jsonb_object_agg(cat_counts.category, cat_counts.cnt)
            from (
                select category, count(*) as cnt
                from _report_cells c2
                where c2.geohash = c.geohash and c2.time_bucket = c.time_bucket
                group by category
            ) cat_counts
        ),
        (
            select coalesce(jsonb_object_agg(factor_counts.factor, factor_counts.cnt), '{}'::jsonb)
            from (
                select f as factor, count(*) as cnt
                from _report_cells c3
                cross join lateral unnest(coalesce(c3.factors, '{}')) as f
                where c3.geohash = c.geohash and c3.time_bucket = c.time_bucket
                group by f
            ) factor_counts
        ),
        min(c.occurred_at),
        max(c.occurred_at),
        now()
    from _report_cells c
    join _qualifying_cells q
      on q.geohash = c.geohash and q.time_bucket = c.time_bucket
    group by c.geohash, c.time_bucket;

    select count(*) into v_pattern_count from public.patterns;
    return v_pattern_count;
end;
$$;

-- Only the backend (service role) may trigger a recompute - it's an
-- expensive aggregation, not something to expose to anon/authenticated.
revoke all on function public.recompute_patterns(integer, integer, integer) from public;
grant execute on function public.recompute_patterns(integer, integer, integer) to service_role;

-- ============================================================
-- RLS: patterns are aggregate counts with no reporter linkage, so they're
-- safe to read publicly, unlike raw reports.
-- ============================================================
alter table public.patterns enable row level security;

create policy "patterns_select_all" on public.patterns
    for select using (true);

-- No insert/update/delete policy for anon/authenticated: only the
-- service-role-invoked recompute function writes this table.