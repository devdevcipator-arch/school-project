-- =====================================================================
-- Timings step (onboarding step 3): school hours + periods table.
-- Run once on a database that already has public.school (school.sql).
--
--   school.start_time, school.end_time   school hours
--   periods   table (title, start_time, end_time), linked to its school
--   school.periods   list of periods (uuid[] of periods.id, in bell order)
--
-- The wizard keeps every edit in React state and writes it all in one call
-- to public.save_timings() when the principal presses Continue.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- Table: periods (one row per period or break, owned by a school)
-- ---------------------------------------------------------------------
create table if not exists public.periods (
  id          uuid primary key default gen_random_uuid(),
  school      uuid not null references public.school(id) on delete cascade,
  title       text not null check (char_length(trim(title)) >= 1),
  start_time  time not null,
  end_time    time not null,
  created_at  timestamptz not null default now(),
  check (end_time > start_time)
);
create index if not exists periods_school_idx on public.periods (school, start_time);

alter table public.periods enable row level security;
drop policy if exists periods_principal_all on public.periods;
create policy periods_principal_all on public.periods for all to authenticated
  using (exists (select 1 from public.school s where s.id = school and s.principal = (select auth.uid())))
  with check (exists (select 1 from public.school s where s.id = school and s.principal = (select auth.uid())));

-- ---------------------------------------------------------------------
-- school.periods: jsonb -> list of periods (uuid[] of periods.id)
-- ---------------------------------------------------------------------
do $$ begin
  if (select data_type from information_schema.columns
      where table_schema = 'public' and table_name = 'school' and column_name = 'periods') = 'jsonb' then
    alter table public.school drop constraint if exists school_periods_check;
    alter table public.school drop column periods;
    alter table public.school add column periods uuid[] not null default '{}';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Continue on the Timings step: save everything in one transaction.
-- Runs as the caller, so RLS limits it to the caller's own school.
-- p_periods: [{ "title": text, "start_time": "HH:MM", "end_time": "HH:MM" }] in bell order
-- ---------------------------------------------------------------------
create or replace function public.save_timings(
  p_start_time time,
  p_end_time   time,
  p_periods    jsonb
) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_school uuid;
  v_ids    uuid[];
begin
  update public.school
     set start_time = p_start_time,
         end_time   = p_end_time
   where principal = (select auth.uid())
  returning id into v_school;

  if v_school is null then
    raise exception 'No school is linked to this account.' using errcode = 'P0002';
  end if;

  delete from public.periods where school = v_school;

  with input as (
    select trim(p ->> 'title') as title, (p ->> 'start_time')::time as start_time,
           (p ->> 'end_time')::time as end_time, pos
    from jsonb_array_elements(coalesce(p_periods, '[]'::jsonb)) with ordinality as x(p, pos)
  ), ins as (
    insert into public.periods (school, title, start_time, end_time)
    select v_school, title, start_time, end_time from input order by pos
    returning id, start_time
  )
  select coalesce(array_agg(id order by start_time), '{}') into v_ids from ins;

  update public.school set periods = v_ids where id = v_school;
end $$;

revoke all on function public.save_timings(time, time, jsonb) from public, anon;
grant execute on function public.save_timings(time, time, jsonb) to authenticated;

commit;
