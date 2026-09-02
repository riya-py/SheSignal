-- SheSignal Phase 5: fix recompute_patterns() full-table DELETE.
--
-- Supabase Postgres ships the `safeupdate` extension by default, which
-- rejects any UPDATE/DELETE statement with no WHERE clause ("DELETE
-- requires a WHERE clause", SQLSTATE 21000). The full-refresh delete in
-- 0003_patterns.sql (`delete from public.patterns;`) has no WHERE clause,
-- so recompute_patterns() has never actually been able to complete on a
-- project with safeupdate enabled - it was failing at the delete step every
-- time. Adding `where true` keeps the exact same "delete everything, then
-- reinsert" full-refresh semantics while satisfying the safety check.
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
    -- `where true` is required by the safeupdate extension - see comment above.
    delete from public.patterns where true;

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

revoke all on function public.recompute_patterns(integer, integer, integer) from public;
grant execute on function public.recompute_patterns(integer, integer, integer) to service_role;