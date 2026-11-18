-- =====================================================================
-- Calendar step (onboarding step 2): option sets + holidays table.
-- Run once on a database that already has public.school (school.sql).
--
--   month        option set (enum)      -> school.year_start_month
--   school_day   option set (enum)      -> school.school_days  (list)
--   exam_terms   option set (table, grows as principals type new names)
--                                        -> school.exam_terms   (list)
--   holidays     table (name, start_date, end_date), linked to its school
--
-- The wizard keeps every edit in React state and writes it all in one call
-- to public.save_calendar() when the principal presses Continue.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- Option set: month
-- ---------------------------------------------------------------------
do $$ begin
  create type public.month as enum (
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December');
exception when duplicate_object then null; end $$;

create or replace function public.tmp_month_of(n smallint) returns public.month
language sql immutable as $$
  select (enum_range(null::public.month))[n]
$$;

alter table public.school drop constraint if exists school_year_start_month_check;
alter table public.school alter column year_start_month drop default;
alter table public.school
  alter column year_start_month type public.month using public.tmp_month_of(year_start_month);
alter table public.school alter column year_start_month set default 'April';
drop function public.tmp_month_of(smallint);

-- ---------------------------------------------------------------------
-- Option set: school_day (multi-select)
-- ---------------------------------------------------------------------
do $$ begin
  create type public.school_day as enum ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun');
exception when duplicate_object then null; end $$;

-- Old storage was 0 = Sun ... 6 = Sat.
create or replace function public.tmp_days_of(d smallint[]) returns public.school_day[]
language sql immutable as $$
  select coalesce(array_agg(x order by x), '{}')
  from (select distinct (array['Sun','Mon','Tue','Wed','Thu','Fri','Sat']::public.school_day[])[v + 1] as x
        from unnest(d) v) s
$$;

alter table public.school drop constraint if exists school_school_days_check;
alter table public.school alter column school_days drop default;
alter table public.school
  alter column school_days type public.school_day[] using public.tmp_days_of(school_days);
alter table public.school alter column school_days set default array['Mon','Tue','Wed','Thu','Fri']::public.school_day[];
alter table public.school add constraint school_school_days_check check (cardinality(school_days) >= 1);
drop function public.tmp_days_of(smallint[]);

-- ---------------------------------------------------------------------
-- Option set: exam_terms (multi-select, grows on demand)
-- A Postgres enum cannot be extended safely from the app, so this option
-- set is a lookup table. Any name saved on a school is created here first.
-- ---------------------------------------------------------------------
create table if not exists public.exam_terms (
  name        text primary key check (char_length(name) between 1 and 80 and name = trim(name)),
  created_at  timestamptz not null default now()
);

insert into public.exam_terms (name)
values ('First Term Exam'), ('Mid-Term Review'), ('Final Semester')
on conflict do nothing;

alter table public.exam_terms enable row level security;
drop policy if exists exam_terms_read on public.exam_terms;
create policy exam_terms_read on public.exam_terms for select to authenticated using (true);

-- Before a school row is written: trim + de-duplicate its exam terms, create
-- any missing ones in the option set. Every school.exam_terms value is
-- therefore always an exam_terms option.
create or replace function public.school_sync_exam_terms() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.exam_terms := (
    select coalesce(array_agg(t order by first_pos), '{}')
    from (select trim(x) as t, min(pos) as first_pos
          from unnest(new.exam_terms) with ordinality as u(x, pos)
          where trim(x) <> ''
          group by trim(x)) s
  );
  insert into public.exam_terms (name)
  select unnest(new.exam_terms)
  on conflict do nothing;
  return new;
end $$;

drop trigger if exists school_sync_exam_terms on public.school;
create trigger school_sync_exam_terms before insert or update of exam_terms on public.school
  for each row execute function public.school_sync_exam_terms();

-- Run it once over existing rows.
update public.school set exam_terms = exam_terms;

-- ---------------------------------------------------------------------
-- Table: holidays (one row per holiday or break, owned by a school)
-- ---------------------------------------------------------------------
create table if not exists public.holidays (
  id          uuid primary key default gen_random_uuid(),
  school      uuid not null references public.school(id) on delete cascade,
  name        text not null check (char_length(trim(name)) >= 1),
  start_date  date not null,
  end_date    date not null,
  created_at  timestamptz not null default now(),
  check (end_date >= start_date)
);
create index if not exists holidays_school_idx on public.holidays (school, start_date);

alter table public.holidays enable row level security;
drop policy if exists holidays_principal_all on public.holidays;
create policy holidays_principal_all on public.holidays for all to authenticated
  using (exists (select 1 from public.school s where s.id = school and s.principal = (select auth.uid())))
  with check (exists (select 1 from public.school s where s.id = school and s.principal = (select auth.uid())));

-- Move holidays that were stored as JSON on the school row, then drop that column.
do $$ begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'school' and column_name = 'holidays') then
    insert into public.holidays (school, name, start_date, end_date)
    select s.id, h ->> 'name', (h ->> 'from')::date, (h ->> 'to')::date
    from public.school s, jsonb_array_elements(s.holidays) h;
    alter table public.school drop column holidays;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Continue on the Calendar step: save everything in one transaction.
-- Runs as the caller, so RLS limits it to the caller's own school.
-- p_holidays: [{ "name": text, "start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD" }]
-- ---------------------------------------------------------------------
create or replace function public.save_calendar(
  p_year_start_month public.month,
  p_exam_terms       text[],
  p_school_days      public.school_day[],
  p_holidays         jsonb
) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_school uuid;
begin
  update public.school
     set year_start_month = p_year_start_month,
         exam_terms       = p_exam_terms,
         school_days      = (select array_agg(distinct d order by d) from unnest(p_school_days) d)
   where principal = (select auth.uid())
  returning id into v_school;

  if v_school is null then
    raise exception 'No school is linked to this account.' using errcode = 'P0002';
  end if;

  delete from public.holidays where school = v_school;
  insert into public.holidays (school, name, start_date, end_date)
  select v_school, trim(h ->> 'name'), (h ->> 'start_date')::date, (h ->> 'end_date')::date
  from jsonb_array_elements(coalesce(p_holidays, '[]'::jsonb)) h;
end $$;

revoke all on function public.save_calendar(public.month, text[], public.school_day[], jsonb) from public, anon;
grant execute on function public.save_calendar(public.month, text[], public.school_day[], jsonb) to authenticated;

commit;
