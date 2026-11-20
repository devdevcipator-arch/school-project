-- =====================================================================
-- Classes step (onboarding step 4): classes table.
-- Run once on a database that already has public.school (school.sql).
--
--   classes   table, one row per grade (1 to 10) of a school:
--               grade     1 to 10
--               sections  list of text, e.g. {1-A,1-B}; empty = grade not offered
--               subjects  list of text, the subjects taught in this grade
--   school.grades   list of classes (uuid[] of classes.id, Grade 1 to 10)
--
-- The wizard keeps every edit in React state and writes it all in one call
-- to public.save_classes() when the principal presses Continue.
-- =====================================================================

begin;

-- Earlier shape (one row per school with grade_1 ... grade_10 columns): replace it.
do $$ begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'classes' and column_name = 'grade_1') then
    alter table public.school drop column if exists grades;
    drop table public.classes;
  end if;
end $$;

create table if not exists public.classes (
  id          uuid primary key default gen_random_uuid(),
  school      uuid not null references public.school(id) on delete cascade,
  grade       smallint not null check (grade between 1 and 10),
  sections    text[] not null default '{}',
  subjects    text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (school, grade)
);

alter table public.classes enable row level security;
drop policy if exists classes_principal_all on public.classes;
create policy classes_principal_all on public.classes for all to authenticated
  using (exists (select 1 from public.school s where s.id = school and s.principal = (select auth.uid())))
  with check (exists (select 1 from public.school s where s.id = school and s.principal = (select auth.uid())));

-- school.grades: list of classes (uuid[] of classes.id)
do $$ begin
  if coalesce((select data_type from information_schema.columns
               where table_schema = 'public' and table_name = 'school' and column_name = 'grades'), '') <> 'ARRAY' then
    alter table public.school drop constraint if exists school_grades_check;
    alter table public.school drop column if exists grades;
    alter table public.school add column grades uuid[] not null default '{}';
  end if;
end $$;

drop function if exists public.save_classes(jsonb);

-- ---------------------------------------------------------------------
-- Continue on the Classes step. Runs as the caller (RLS: own school only).
-- p_grades: { "1": ["1-A","1-B"], "2": [...], ... "10": [...] }  (sections per grade)
-- Writes one classes row per grade (1 to 10). Subjects on existing rows are kept.
-- ---------------------------------------------------------------------
create or replace function public.save_classes(p_grades jsonb) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_school uuid;
  v_ids    uuid[];
begin
  select id into v_school from public.school where principal = (select auth.uid());
  if v_school is null then
    raise exception 'No school is linked to this account.' using errcode = 'P0002';
  end if;

  with up as (
    insert into public.classes as c (school, grade, sections)
    select v_school, g, coalesce(array(select jsonb_array_elements_text(p_grades -> g::text)), '{}')
    from generate_series(1, 10) g
    on conflict (school, grade) do update
       set sections = excluded.sections, updated_at = now()
    returning c.id, c.grade
  )
  select array_agg(id order by grade) into v_ids from up;

  update public.school set grades = v_ids where id = v_school;
end $$;

revoke all on function public.save_classes(jsonb) from public, anon;
grant execute on function public.save_classes(jsonb) to authenticated;

commit;
