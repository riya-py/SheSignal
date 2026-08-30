-- SheSignal Phase 1: RLS verification checklist.
--
-- These checks can't run in a local Python test suite because RLS is
-- enforced by Postgres itself, and this sandbox has no live Supabase
-- connection. Run each block below in the Supabase SQL editor (or psql)
-- against the actual project after applying 0001_init_schema.sql, using
-- `set role` to simulate anon/authenticated, or by testing through
-- PostgREST with real anon/user JWTs for the most realistic result.

-- 1. anon cannot read the base reports table directly.
set role anon;
select * from public.reports;               -- expected: 0 rows (no SELECT policy for anon)
reset role;

-- 2. anon CAN read the sanitized public view, and reporter_id is absent
--    from the result set entirely (not just null).
set role anon;
select * from public.public_reports limit 5; -- expected: rows, no reporter_id column
reset role;

-- 3. an authenticated user can only insert a report with their own id as
--    reporter_id. Replace :other_user_id with a different real user's id.
--    This should fail:
--    insert into public.reports (reporter_id, category, description, latitude, longitude)
--    values (:other_user_id, 'other', 'test', 12.9, 77.6);

-- 4. an authenticated user can select their own submitted reports, but
--    not another user's, from the base table.
--    (run as user A) select * from public.reports;  -- only rows where reporter_id = A

-- 5. no UPDATE/DELETE policy exists for regular users - both should be
--    rejected regardless of ownership:
--    update public.reports set status = 'removed' where id = '<some-id>';
--    delete from public.reports where id = '<some-id>';

-- ============================================================
-- Phase 2: report_analysis
-- ============================================================

-- 6. a user can read the analysis for their own report only.
--    (run as user A, with report_id belonging to A) -> expected: 1 row
--    (run as user A, with report_id belonging to user B) -> expected: 0 rows
--    select * from public.report_analysis where report_id = '<report-id>';

-- 7. anon cannot read report_analysis at all.
set role anon;
select * from public.report_analysis;         -- expected: 0 rows
reset role;

-- 8. no authenticated user (even the report owner) can write directly -
--    only the backend's service-role key writes this table.
--    (run as user A, own report) should fail:
--    insert into public.report_analysis (report_id, status) values ('<own-report-id>', 'completed');

-- ============================================================
-- Phase 3: patterns
-- ============================================================

-- 9. anon CAN read patterns - they're aggregate counts, safe to expose.
set role anon;
select * from public.patterns limit 5;         -- expected: rows (once recomputed), no reporter linkage
reset role;

-- 10. no authenticated/anon role can write to patterns or call the
--     recompute function directly - both should fail:
--     insert into public.patterns (geohash, time_bucket, centroid_latitude,
--       centroid_longitude, report_count, first_report_at, last_report_at)
--       values ('u0', 'night', 0, 0, 99, now(), now());
--     select public.recompute_patterns();   -- permission denied for anon/authenticated

-- ============================================================
-- Phase 4: risk engine support
-- ============================================================

-- 11. patterns_within_radius is restricted the same way as
--     recompute_patterns - only the backend's service-role key may call it
--     directly, keeping rate limiting/radius clamping enforceable at the
--     app layer:
--     select * from public.patterns_within_radius(28.6, 77.2, 500);
--     -- expected: permission denied for anon/authenticated