-- =====================================================================
-- Moves everything off public.school and onto the authenticated user.
-- Run once, after school.sql, calendar.sql, timings.sql, classes.sql and
-- subjects.sql.
--
--   public.users      one row per auth user (id = auth.users.id), holds
--                     every field that used to be on public.school
--   holidays.user     -> auth.users.id (was holidays.school)
--   periods.user      -> auth.users.id (was periods.school)
--   classes.user      -> auth.users.id (was classes.school)
--   private.school_backup   the old table, unreachable from the app
--
-- "user" is a reserved word in Postgres, so the column is always quoted.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- Table: users
-- ---------------------------------------------------------------------
create table public.users (
  id                        uuid primary key references auth.users(id) on delete cascade,

  -- Step 1: School
  name                      text check (char_length(trim(name)) >= 3),
  principal_name            text not null check (char_length(trim(principal_name)) >= 2),

  -- Step 2: Calendar
  year_start_month          public.month not null default 'April',
  exam_terms                text[] not null default array['First Term Exam', 'Mid-Term Review', 'Final Semester']
                              check (cardinality(exam_terms) >= 1),
  school_days               public.school_day[] not null default array['Mon','Tue','Wed','Thu','Fri']::public.school_day[]
                              check (cardinality(school_days) >= 1),

  -- Step 3: Timings
  start_time                time not null default '08:00',
  end_time                  time not null default '14:30',
  periods                   uuid[] not null default '{}',

  -- Step 4: Classes
  grades                    uuid[] not null default '{}',

  -- Step 6: Fees (status only, no amounts)
  fee_plans                 text[] not null default array['monthly', 'biannual', 'annual']
                              check (cardinality(fee_plans) >= 1 and fee_plans <@ array['monthly', 'biannual', 'annual']),
  fee_due_day               smallint not null default 15 check (fee_due_day between 1 and 28),
  defaulter_months          smallint not null default 2 check (defaulter_months between 1 and 6),

  -- Step 7: Policies
  student_attendance_below  smallint not null default 75 check (student_attendance_below between 0 and 100),
  class_attendance_below    smallint not null default 80 check (class_attendance_below between 0 and 100),

  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  check (end_time > start_time)
);

insert into public.users (
  id, name, principal_name, year_start_month, exam_terms, school_days, start_time, end_time,
  periods, grades, fee_plans, fee_due_day, defaulter_months,
  student_attendance_below, class_attendance_below, created_at, updated_at
)
select
  principal, name, principal_name, year_start_month, exam_terms, school_days, start_time, end_time,
  periods, grades, fee_plans, fee_due_day, defaulter_months,
  student_attendance_below, class_attendance_below, created_at, updated_at
from public.school;

-- Triggers move from school to users.
drop trigger school_touch_updated_at on public.school;
drop trigger school_sync_exam_terms on public.school;
alter function public.school_touch_updated_at() rename to users_touch_updated_at;
alter function public.school_sync_exam_terms() rename to users_sync_exam_terms;

create trigger users_touch_updated_at before update on public.users
  for each row execute function public.users_touch_updated_at();
create trigger users_sync_exam_terms before insert or update of exam_terms on public.users
  for each row execute function public.users_sync_exam_terms();

-- Only the user can see or change their own row.
alter table public.users enable row level security;
create policy users_self_all on public.users for all to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
revoke all on public.users from anon;
grant select, insert, update, delete on public.users to authenticated;

-- ---------------------------------------------------------------------
-- holidays, periods, classes: link to the auth user
-- ---------------------------------------------------------------------
drop policy holidays_principal_all on public.holidays;
drop policy periods_principal_all on public.periods;
drop policy classes_principal_all on public.classes;

alter table public.holidays add column "user" uuid;
alter table public.periods  add column "user" uuid;
alter table public.classes  add column "user" uuid;

update public.holidays t set "user" = s.principal from public.school s where s.id = t.school;
update public.periods  t set "user" = s.principal from public.school s where s.id = t.school;
update public.classes  t set "user" = s.principal from public.school s where s.id = t.school;

alter table public.holidays alter column "user" set not null, drop column school;
alter table public.periods  alter column "user" set not null, drop column school;
alter table public.classes  alter column "user" set not null, drop column school;

alter table public.holidays add constraint holidays_user_fkey foreign key ("user") references auth.users(id) on delete cascade;
alter table public.periods  add constraint periods_user_fkey  foreign key ("user") references auth.users(id) on delete cascade;
alter table public.classes  add constraint classes_user_fkey  foreign key ("user") references auth.users(id) on delete cascade;
alter table public.classes  add constraint classes_user_grade_key unique ("user", grade);

create index holidays_user_idx on public.holidays ("user", start_date);
create index periods_user_idx  on public.periods  ("user", start_time);

create policy holidays_user_all on public.holidays for all to authenticated
  using ("user" = (select auth.uid())) with check ("user" = (select auth.uid()));
create policy periods_user_all on public.periods for all to authenticated
  using ("user" = (select auth.uid())) with check ("user" = (select auth.uid()));
create policy classes_user_all on public.classes for all to authenticated
  using ("user" = (select auth.uid())) with check ("user" = (select auth.uid()));

-- ---------------------------------------------------------------------
-- Sign Up: create the user's row
-- ---------------------------------------------------------------------
create or replace function public.handle_new_principal() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.users (id, principal_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), new.email)
  );
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Onboarding saves. Same signatures, so the app calls them the same way.
-- ---------------------------------------------------------------------
create or replace function public.save_calendar(
  p_year_start_month public.month,
  p_exam_terms       text[],
  p_school_days      public.school_day[],
  p_holidays         jsonb
) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_user uuid;
begin
  update public.users
     set year_start_month = p_year_start_month,
         exam_terms       = p_exam_terms,
         school_days      = (select array_agg(distinct d order by d) from unnest(p_school_days) d)
   where id = (select auth.uid())
  returning id into v_user;

  if v_user is null then
    raise exception 'No school is linked to this account.' using errcode = 'P0002';
  end if;

  delete from public.holidays where "user" = v_user;
  insert into public.holidays ("user", name, start_date, end_date)
  select v_user, trim(h ->> 'name'), (h ->> 'start_date')::date, (h ->> 'end_date')::date
  from jsonb_array_elements(coalesce(p_holidays, '[]'::jsonb)) h;
end $$;

create or replace function public.save_timings(
  p_start_time time,
  p_end_time   time,
  p_periods    jsonb
) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_user uuid;
  v_ids  uuid[];
begin
  update public.users
     set start_time = p_start_time,
         end_time   = p_end_time
   where id = (select auth.uid())
  returning id into v_user;

  if v_user is null then
    raise exception 'No school is linked to this account.' using errcode = 'P0002';
  end if;

  delete from public.periods where "user" = v_user;

  with input as (
    select trim(p ->> 'title') as title, (p ->> 'start_time')::time as start_time,
           (p ->> 'end_time')::time as end_time, pos
    from jsonb_array_elements(coalesce(p_periods, '[]'::jsonb)) with ordinality as x(p, pos)
  ), ins as (
    insert into public.periods ("user", title, start_time, end_time)
    select v_user, title, start_time, end_time from input order by pos
    returning id, start_time
  )
  select coalesce(array_agg(id order by start_time), '{}') into v_ids from ins;

  update public.users set periods = v_ids where id = v_user;
end $$;

create or replace function public.save_classes(p_grades jsonb) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_user uuid;
  v_ids  uuid[];
begin
  select id into v_user from public.users where id = (select auth.uid());
  if v_user is null then
    raise exception 'No school is linked to this account.' using errcode = 'P0002';
  end if;

  with up as (
    insert into public.classes as c ("user", grade, sections)
    select v_user, g, coalesce(array(select jsonb_array_elements_text(p_grades -> g::text)), '{}')
    from generate_series(1, 10) g
    on conflict ("user", grade) do update
       set sections = excluded.sections, updated_at = now()
    returning c.id, c.grade
  )
  select array_agg(id order by grade) into v_ids from up;

  update public.users set grades = v_ids where id = v_user;
end $$;

create or replace function public.save_subjects(p_subjects jsonb) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_user uuid;
  v_ids  uuid[];
begin
  select id into v_user from public.users where id = (select auth.uid());
  if v_user is null then
    raise exception 'No school is linked to this account.' using errcode = 'P0002';
  end if;

  with up as (
    insert into public.classes as c ("user", grade, subjects)
    select v_user, g, coalesce(array(select jsonb_array_elements_text(p_subjects -> g::text)), '{}')
    from generate_series(1, 10) g
    on conflict ("user", grade) do update
       set subjects = excluded.subjects, updated_at = now()
    returning c.id, c.grade
  )
  select array_agg(id order by grade) into v_ids from up;

  update public.users set grades = v_ids where id = v_user;
end $$;

-- ---------------------------------------------------------------------
-- Old table: keep a private backup the app cannot reach.
-- ---------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
drop policy school_principal_all on public.school;
revoke all on public.school from public, anon, authenticated;
alter table public.school set schema private;
alter table private.school rename to school_backup;

commit;
