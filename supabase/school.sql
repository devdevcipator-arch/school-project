-- =====================================================================
-- school: one row per school, holding everything the principal fills in
-- on the onboarding wizard (components/onboarding/steps.tsx, lib/onboarding.ts).
-- Column groups follow the wizard steps. Defaults mirror the wizard defaults.
-- Fees store no money: only plans, due day and defaulter rule.
--
-- A school row is created automatically on Sign Up (trigger at the bottom):
-- the new auth user becomes its principal. Wizard fields stay empty or at
-- their defaults until the principal completes onboarding.
-- =====================================================================

create table if not exists public.school (
  id                        uuid primary key default gen_random_uuid(),
  principal                 uuid not null unique default auth.uid()          -- principal => user (auth.users)
                              references auth.users(id) on delete cascade,

  -- Step 1: School
  name                      text check (char_length(trim(name)) >= 3),       -- filled in onboarding
  principal_name            text not null check (char_length(trim(principal_name)) >= 2),

  -- Step 2: Calendar
  year_start_month          smallint not null default 4 check (year_start_month between 1 and 12),
  term_name                 text not null default 'Autumn term 2026' check (trim(term_name) <> ''),
  term_start                date,                                            -- filled in onboarding
  exam_terms                text[] not null default array['First Term Exam', 'Mid-Term Review', 'Final Semester']
                              check (cardinality(exam_terms) >= 1),
  school_days               smallint[] not null default array[1, 2, 3, 4, 5]::smallint[]   -- 0 = Sun ... 6 = Sat
                              check (cardinality(school_days) >= 1 and school_days <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]),
  holidays                  jsonb not null default '[]'::jsonb      -- [{ "name", "from": date, "to": date }]
                              check (jsonb_typeof(holidays) = 'array'),

  -- Step 3: Timings
  start_time                time not null default '08:00',
  end_time                  time not null default '14:30',
  periods                   jsonb not null default '[]'::jsonb      -- [{ "label", "start": "HH:MM", "end": "HH:MM", "isBreak": bool }]
                              check (jsonb_typeof(periods) = 'array'),

  -- Step 4: Classes
  grades                    jsonb not null default '[]'::jsonb      -- [{ "grade": 1-10, "on": bool, "sections": int }]
                              check (jsonb_typeof(grades) = 'array'),

  -- Step 5: Subjects
  subjects                  jsonb not null default '[]'::jsonb      -- [{ "name", "skip": [grades that do not study it] }]
                              check (jsonb_typeof(subjects) = 'array'),

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

-- Keep updated_at fresh.
create or replace function public.school_touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists school_touch_updated_at on public.school;
create trigger school_touch_updated_at before update on public.school
  for each row execute function public.school_touch_updated_at();

-- Only the school's principal can see or change it.
alter table public.school enable row level security;

drop policy if exists school_owner_all on public.school;
drop policy if exists school_principal_all on public.school;
create policy school_principal_all on public.school for all to authenticated
  using (principal = (select auth.uid()))
  with check (principal = (select auth.uid()));

-- Sign Up: when Supabase Auth creates the user, create their school with
-- them as principal. Full name comes from signUp({ options: { data: { full_name } } }).
create or replace function public.handle_new_principal() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.school (principal, principal_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), new.email)
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_principal();
