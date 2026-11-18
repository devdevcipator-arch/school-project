-- =====================================================================
-- Turn the month and school_day option sets from enums into lookup tables,
-- so they show up in the Schema Visualizer like exam_terms.
-- Run once, after calendar.sql.
--
--   month       (name, position)  -> school.year_start_month (foreign key)
--   school_day  (name, position)  -> school.school_days      (list, checked by trigger)
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- Option set tables
-- ---------------------------------------------------------------------
create table if not exists public.months (
  name      text primary key,
  position  smallint not null unique check (position between 1 and 12)
);
insert into public.months (name, position) values
  ('January', 1), ('February', 2), ('March', 3), ('April', 4), ('May', 5), ('June', 6),
  ('July', 7), ('August', 8), ('September', 9), ('October', 10), ('November', 11), ('December', 12)
on conflict do nothing;

create table if not exists public.week_days (
  name      text primary key,
  position  smallint not null unique check (position between 1 and 7)
);
insert into public.week_days (name, position) values
  ('Mon', 1), ('Tue', 2), ('Wed', 3), ('Thu', 4), ('Fri', 5), ('Sat', 6), ('Sun', 7)
on conflict do nothing;

alter table public.months enable row level security;
alter table public.week_days enable row level security;
drop policy if exists months_read on public.months;
drop policy if exists week_days_read on public.week_days;
create policy months_read on public.months for select to authenticated using (true);
create policy week_days_read on public.week_days for select to authenticated using (true);

-- ---------------------------------------------------------------------
-- school.year_start_month: month enum -> text referencing months
-- ---------------------------------------------------------------------
alter table public.school alter column year_start_month drop default;
alter table public.school alter column year_start_month type text using year_start_month::text;
alter table public.school alter column year_start_month set default 'April';
alter table public.school add constraint school_year_start_month_fkey
  foreign key (year_start_month) references public.months(name) on update cascade;

-- ---------------------------------------------------------------------
-- school.school_days: school_day[] enum -> text[] of week_days
-- (Postgres cannot put a foreign key on a list, so a trigger checks it.)
-- ---------------------------------------------------------------------
drop function if exists public.save_calendar(public.month, text[], public.school_day[], jsonb);

alter table public.school drop constraint if exists school_school_days_check;
alter table public.school alter column school_days drop default;
alter table public.school alter column school_days type text[] using school_days::text[];
alter table public.school alter column school_days set default array['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
alter table public.school add constraint school_school_days_check check (cardinality(school_days) >= 1);

create or replace function public.school_check_school_days() returns trigger
language plpgsql security definer set search_path = '' as $$
declare bad text;
begin
  select d into bad from unnest(new.school_days) d
  where not exists (select 1 from public.week_days o where o.name = d) limit 1;
  if bad is not null then
    raise exception 'Unknown school day: %', bad using errcode = '23503';
  end if;
  -- De-duplicate and keep week order (Mon ... Sun).
  new.school_days := (
    select coalesce(array_agg(o.name order by o.position), '{}')
    from public.week_days o where o.name = any (new.school_days)
  );
  return new;
end $$;

drop trigger if exists school_check_school_days on public.school;
create trigger school_check_school_days before insert or update of school_days on public.school
  for each row execute function public.school_check_school_days();

drop type if exists public.month;
drop type if exists public.school_day;

-- ---------------------------------------------------------------------
-- Continue on the Calendar step (same behavior, text parameters now).
-- ---------------------------------------------------------------------
create or replace function public.save_calendar(
  p_year_start_month text,
  p_exam_terms       text[],
  p_school_days      text[],
  p_holidays         jsonb
) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_school uuid;
begin
  update public.school
     set year_start_month = p_year_start_month,
         exam_terms       = p_exam_terms,
         school_days      = p_school_days
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

revoke all on function public.save_calendar(text, text[], text[], jsonb) from public, anon;
grant execute on function public.save_calendar(text, text[], text[], jsonb) to authenticated;

commit;
