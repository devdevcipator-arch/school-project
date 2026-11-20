-- =====================================================================
-- Classes step (onboarding step 4): classes table.
-- Run once on a database that already has public.school (school.sql).
--
--   classes   table, one row per school: grade_1 ... grade_10, each a
--             list of text holding that grade's sections, e.g. {1-A,1-B}.
--             An empty list means the grade is not offered.
--   school.grades   classes (uuid of the school's classes row)
--
-- The wizard keeps every edit in React state and writes it all in one call
-- to public.save_classes() when the principal presses Continue.
-- =====================================================================

begin;

create table if not exists public.classes (
  id          uuid primary key default gen_random_uuid(),
  school      uuid not null unique references public.school(id) on delete cascade,
  grade_1     text[] not null default '{}',
  grade_2     text[] not null default '{}',
  grade_3     text[] not null default '{}',
  grade_4     text[] not null default '{}',
  grade_5     text[] not null default '{}',
  grade_6     text[] not null default '{}',
  grade_7     text[] not null default '{}',
  grade_8     text[] not null default '{}',
  grade_9     text[] not null default '{}',
  grade_10    text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.classes enable row level security;
drop policy if exists classes_principal_all on public.classes;
create policy classes_principal_all on public.classes for all to authenticated
  using (exists (select 1 from public.school s where s.id = school and s.principal = (select auth.uid())))
  with check (exists (select 1 from public.school s where s.id = school and s.principal = (select auth.uid())));

-- school.grades: jsonb -> classes (uuid of the school's classes row)
do $$ begin
  if (select data_type from information_schema.columns
      where table_schema = 'public' and table_name = 'school' and column_name = 'grades') = 'jsonb' then
    alter table public.school drop constraint if exists school_grades_check;
    alter table public.school drop column grades;
    alter table public.school add column grades uuid references public.classes(id) on delete set null;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Continue on the Classes step. Runs as the caller (RLS: own school only).
-- p_grades: { "1": ["1-A","1-B"], "2": [...], ... "10": [...] }
-- ---------------------------------------------------------------------
create or replace function public.save_classes(p_grades jsonb) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_school  uuid;
  v_classes uuid;
begin
  select id into v_school from public.school where principal = (select auth.uid());
  if v_school is null then
    raise exception 'No school is linked to this account.' using errcode = 'P0002';
  end if;

  insert into public.classes as c (school, grade_1, grade_2, grade_3, grade_4, grade_5,
                                   grade_6, grade_7, grade_8, grade_9, grade_10)
  select v_school,
         coalesce(array(select jsonb_array_elements_text(p_grades -> '1')),  '{}'),
         coalesce(array(select jsonb_array_elements_text(p_grades -> '2')),  '{}'),
         coalesce(array(select jsonb_array_elements_text(p_grades -> '3')),  '{}'),
         coalesce(array(select jsonb_array_elements_text(p_grades -> '4')),  '{}'),
         coalesce(array(select jsonb_array_elements_text(p_grades -> '5')),  '{}'),
         coalesce(array(select jsonb_array_elements_text(p_grades -> '6')),  '{}'),
         coalesce(array(select jsonb_array_elements_text(p_grades -> '7')),  '{}'),
         coalesce(array(select jsonb_array_elements_text(p_grades -> '8')),  '{}'),
         coalesce(array(select jsonb_array_elements_text(p_grades -> '9')),  '{}'),
         coalesce(array(select jsonb_array_elements_text(p_grades -> '10')), '{}')
  on conflict (school) do update
     set grade_1 = excluded.grade_1, grade_2 = excluded.grade_2, grade_3 = excluded.grade_3,
         grade_4 = excluded.grade_4, grade_5 = excluded.grade_5, grade_6 = excluded.grade_6,
         grade_7 = excluded.grade_7, grade_8 = excluded.grade_8, grade_9 = excluded.grade_9,
         grade_10 = excluded.grade_10, updated_at = now()
  returning c.id into v_classes;

  update public.school set grades = v_classes where id = v_school;
end $$;

revoke all on function public.save_classes(jsonb) from public, anon;
grant execute on function public.save_classes(jsonb) to authenticated;

commit;
