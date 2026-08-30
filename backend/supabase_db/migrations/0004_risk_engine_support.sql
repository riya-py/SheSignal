-- SheSignal Phase 4: support tables/functions for the deterministic risk engine.
-- Run in the Supabase SQL editor after 0001, 0002, 0003.

-- Severity data wasn't aggregated in Phase 3 (patterns only needed
-- category/factor breakdowns for map display). The risk engine needs it,
-- so we extend the existing patterns table rather than create a new one.
alter table public.patterns
    add column if not exists severity_breakdown jsonb not null default '{}'::jsonb;

-- Spatial column + index so "patterns near this point" is an indexed
-- database query, not something FastAPI computes by scanning rows.
alter table public.patterns
    add column if not exists centroid_location geography(Point, 4326)
        generated always as (
            ST_SetSRID(ST_MakePoint(centroid_longitude, centroid_latitude), 4326)::geography
        ) stored;

create index if not exists patterns_centroid_location_gix
    on public.patterns using gist (centroid_location);

-- Re-create recompute_patterns to also aggregate severity_breakdown (same
-- shape/approach as factor_breakdown in 0003, just keyed on severity
-- instead of individual factor tags).
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
        ra.factors,
        ra.severity
    from public.reports r
    left join public.report_analysis ra on ra.report_id = r.id
    where r.status = 'active'
      and r.occurred_at >= now() - make_interval(days => p_lookback_days);

    create temporary table _qualifying_cells on commit drop as
    select geohash, time_bucket
    from _report_cells
    group by geohash, time_bucket
    having count(*) >= p_min_reports;

    delete from public.patterns;

    insert into public.patterns (
        geohash, time_bucket, centroid_latitude, centroid_longitude,
        report_count, category_breakdown, factor_breakdown, severity_breakdown,
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
        (
            select coalesce(jsonb_object_agg(sev_counts.severity, sev_counts.cnt), '{}'::jsonb)
            from (
                select severity, count(*) as cnt
                from _report_cells c4
                where c4.geohash = c.geohash and c4.time_bucket = c.time_bucket
                  and severity is not null
                group by severity
            ) sev_counts
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

revoke all on function public.recompute_patterns(integer, integer, integer) from public;
grant execute on function public.recompute_patterns(integer, integer, integer) to service_role;

-- Indexed spatial lookup used by the risk engine: all patterns within
-- radius_meters of a point, closest concerns first by volume.
create or replace function public.patterns_within_radius(
    p_lat double precision,
    p_lng double precision,
    p_radius_meters double precision
)
returns setof public.patterns
language sql
stable
as $$
    select *
    from public.patterns
    where ST_DWithin(
        centroid_location,
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
        p_radius_meters
    )
    order by report_count desc;
$$;

-- Restricted to the backend only, same reasoning as recompute_patterns:
-- keeps rate limiting/caching/radius clamping enforceable at the app layer
-- instead of letting the geospatial query be hit directly and unbounded.
revoke all on function public.patterns_within_radius(double precision, double precision, double precision) from public;
grant execute on function public.patterns_within_radius(double precision, double precision, double precision) to service_role;