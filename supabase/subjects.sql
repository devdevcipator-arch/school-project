-- =====================================================================
-- Subjects step (onboarding step 5). Run after classes.sql.
--
-- Subjects live on the classes table: classes.subjects (list of text) holds
-- the subjects taught in that grade. school.subjects is removed.
--
-- The wizard keeps every edit in React state and writes it all in one call
-- to public.save_subjects() when the principal presses Continue.
-- =====================================================================

begin;

alter table public.school drop constraint if exists school_subjects_check;
alter table public.school drop column if exists subjects;

-- ---------------------------------------------------------------------
-- Continue on the Subjects step. Runs as the caller (RLS: own school only).
-- p_subjects: { "1": ["English","Urdu"], "2": [...], ... "10": [...] }  (subjects per grade)
-- Sets classes.subjects on each of the school's grade rows (creating any
-- missing row with no sections) and keeps school.grades listing all 10.
-- ---------------------------------------------------------------------
create or replace function public.save_subjects(p_subjects jsonb) returns void
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
    insert into public.classes as c (school, grade, subjects)
    select v_school, g, coalesce(array(select jsonb_array_elements_text(p_subjects -> g::text)), '{}')
    from generate_series(1, 10) g
    on conflict (school, grade) do update
       set subjects = excluded.subjects, updated_at = now()
    returning c.id, c.grade
  )
  select array_agg(id order by grade) into v_ids from up;

  update public.school set grades = v_ids where id = v_school;
end $$;

revoke all on function public.save_subjects(jsonb) from public, anon;
grant execute on function public.save_subjects(jsonb) to authenticated;

commit;
