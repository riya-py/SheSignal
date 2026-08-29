-- SheSignal Phase 2: report_analysis table.
-- Run in the Supabase SQL editor after 0001_init_schema.sql.

create table if not exists public.report_analysis (
    id uuid primary key default gen_random_uuid(),
    report_id uuid not null unique references public.reports (id) on delete cascade,
    status text not null check (status in ('completed', 'failed')),
    category text check (
        category in (
            'harassment', 'poor_lighting', 'stalking', 'isolated_area',
            'unsafe_transit', 'suspicious_activity', 'other'
        )
    ),
    severity text check (severity in ('low', 'medium', 'high')),
    time_context text check (
        time_context in ('morning', 'afternoon', 'evening', 'night', 'unknown')
    ),
    factors text[],
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists report_analysis_report_id_idx on public.report_analysis (report_id);
create index if not exists report_analysis_status_idx on public.report_analysis (status);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists report_analysis_set_updated_at on public.report_analysis;
create trigger report_analysis_set_updated_at
    before update on public.report_analysis
    for each row execute procedure public.set_updated_at();

-- ============================================================
-- RLS
-- ============================================================
alter table public.report_analysis enable row level security;

-- A user may read the analysis only for a report they own. No general
-- public SELECT policy - patterns/aggregates are what Phase 3 exposes
-- publicly, not per-report AI output.
create policy "report_analysis_select_own" on public.report_analysis
    for select to authenticated
    using (
        exists (
            select 1 from public.reports r
            where r.id = report_analysis.report_id
              and r.reporter_id = auth.uid()
        )
    );

-- No INSERT/UPDATE/DELETE policy for regular users: only the backend's
-- service-role key (which bypasses RLS) ever writes analysis rows.