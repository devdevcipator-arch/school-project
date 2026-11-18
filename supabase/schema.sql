-- =====================================================================
-- School management platform: database schema (Supabase / Postgres)
-- Derived from the front-end data model in lib/*.ts.
--
-- Rules baked in:
--   * Multi-tenant: every row carries school_id; RLS keeps schools apart.
--   * Roles: principal, teacher, student (one profile per auth user).
--   * Fees never store money: only plans, installments, due dates,
--     payment timestamps and part/final kind (status is derived).
-- =====================================================================

create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
create type user_role            as enum ('principal', 'teacher', 'student');
create type account_status       as enum ('active', 'inactive', 'pending');
create type gender               as enum ('Male', 'Female');
create type guardian_relation    as enum ('Father', 'Mother', 'Guardian');

create type student_day_status   as enum ('present', 'absent', 'leave');
create type teacher_day_state    as enum ('present', 'late', 'absent');
create type leave_status         as enum ('Pending', 'Approved', 'Declined');

create type fee_plan             as enum ('monthly', 'biannual', 'annual');
create type payment_kind         as enum ('part', 'final');

create type notice_audience      as enum ('school', 'staff', 'students', 'parents', 'classes', 'department');
create type notice_priority      as enum ('normal', 'important', 'urgent');
create type notice_status        as enum ('published', 'scheduled', 'draft');
create type notice_channel       as enum ('feed', 'banner', 'sms');
create type notice_category      as enum ('Emergency Alert', 'Holiday / Closure', 'Exam / Academic',
                                          'Administrative / HR', 'Event / Sports', 'General Notice');

create type assessment_format    as enum ('ai-quiz', 'homework', 'term-test', 'project');
create type assessment_status    as enum ('live', 'scheduled', 'closed', 'draft');
create type question_type        as enum ('mcq', 'tf', 'short', 'fill');
create type difficulty           as enum ('Easy', 'Medium', 'Hard', 'Adaptive');
create type submission_mode      as enum ('online', 'physical');
create type submission_state     as enum ('on-time', 'late', 'none');

create type report_status        as enum ('draft', 'ready', 'sent');

create type talent_level         as enum ('beginner', 'intermediate', 'team', 'interschool', 'champion');
create type event_scope          as enum ('School', 'District', 'Regional', 'National');

create type resource_ext         as enum ('pdf', 'docx', 'pptx', 'epub');
create type resource_category    as enum ('textbook', 'helping', 'past-paper', 'presentation', 'worksheet');

create type vault_category       as enum ('Textbook', 'Syllabus', 'Handbook', 'Policy');
create type vault_status         as enum ('uploading', 'parsing', 'embedding', 'indexed', 'failed');

create type tone                 as enum ('ok', 'warn', 'serious', 'danger', 'neutral');

-- ---------------------------------------------------------------------
-- Tenancy and identity
-- ---------------------------------------------------------------------
create table schools (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,           -- used for sign-in emails / invite links
  logo_path   text,
  address     text,
  phone       text,
  email       text,
  created_at  timestamptz not null default now()
);

-- One row per auth user. Holds the display name shown across each portal.
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  school_id   uuid not null references schools(id) on delete cascade,
  role        user_role not null,
  full_name   text not null,
  email       text not null,
  phone       text,
  avatar_path text,
  status      account_status not null default 'active',
  created_at  timestamptz not null default now(),
  unique (school_id, email)
);
create index on profiles (school_id, role);

-- Invite links for teachers (and optional student self sign-up).
create table invites (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  role        user_role not null check (role <> 'principal'),
  token       text unique not null default encode(gen_random_bytes(18), 'hex'),
  email       text,
  created_by  uuid references profiles(id) on delete set null,
  expires_at  timestamptz not null default now() + interval '14 days',
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Onboarding / school setup (lib/onboarding.ts)
-- ---------------------------------------------------------------------
create table school_settings (
  school_id                    uuid primary key references schools(id) on delete cascade,
  year_start_month             smallint not null default 4 check (year_start_month between 1 and 12),
  school_days                  smallint[] not null default '{1,2,3,4,5}',   -- 0 = Sun ... 6 = Sat
  day_start                    time not null default '08:00',
  day_end                      time not null default '14:00',
  fee_plans                    fee_plan[] not null default '{monthly}',      -- plans offered
  fee_due_day                  smallint not null default 10 check (fee_due_day between 1 and 28),
  defaulter_months             smallint not null default 3,
  student_attendance_below     smallint not null default 75,                 -- % alert threshold
  class_attendance_below       smallint not null default 80,
  onboarding_completed_at      timestamptz
);

create table academic_years (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  label       text not null,                  -- e.g. '2026-27'
  starts_on   date not null,
  ends_on     date not null,
  is_current  boolean not null default false,
  unique (school_id, label)
);
create unique index one_current_year on academic_years (school_id) where is_current;

create table terms (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid not null references schools(id) on delete cascade,
  academic_year_id uuid not null references academic_years(id) on delete cascade,
  name             text not null,             -- 'First Term', 'Mid-Term', 'Final'
  starts_on        date,
  ends_on          date,
  is_exam_term     boolean not null default true,
  position         smallint not null default 0
);

create table holidays (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  name        text not null,
  from_date   date not null,
  to_date     date not null check (to_date >= from_date)
);
create index on holidays (school_id, from_date);

create table bell_periods (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  label       text not null,
  starts_at   time not null,
  ends_at     time not null,
  is_break    boolean not null default false,
  position    smallint not null
);

create table grades (
  school_id   uuid not null references schools(id) on delete cascade,
  grade       smallint not null check (grade between 1 and 12),
  enabled     boolean not null default true,
  primary key (school_id, grade)
);

create table subjects (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references schools(id) on delete cascade,
  name         text not null,
  skip_grades  smallint[] not null default '{}',   -- grades that do not take this subject
  unique (school_id, name)
);

-- ---------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------
create table teachers (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  profile_id  uuid unique references profiles(id) on delete set null,
  emp_id      text not null,
  joined_on   date not null default current_date,
  status      account_status not null default 'active',  -- 'pending' = joined by invite, awaiting assignment
  unique (school_id, emp_id)
);

-- Class/section, e.g. '10-A'.
create table sections (
  id                uuid primary key default gen_random_uuid(),
  school_id         uuid not null references schools(id) on delete cascade,
  grade             smallint not null,
  name              text not null,             -- 'A', 'B', 'C'
  code              text generated always as (grade::text || '-' || name) stored,
  class_teacher_id  uuid unique references teachers(id) on delete set null,
  foreign key (school_id, grade) references grades(school_id, grade) on delete cascade,
  unique (school_id, grade, name)
);

-- Teacher form: "Other classes taught" and "Assigned subjects".
create table teacher_sections (
  school_id   uuid not null references schools(id) on delete cascade,
  teacher_id  uuid not null references teachers(id) on delete cascade,
  section_id  uuid not null references sections(id) on delete cascade,
  primary key (teacher_id, section_id)
);

create table teacher_subjects (
  school_id   uuid not null references schools(id) on delete cascade,
  teacher_id  uuid not null references teachers(id) on delete cascade,
  subject_id  uuid not null references subjects(id) on delete cascade,
  primary key (teacher_id, subject_id)
);

create table students (
  id                 uuid primary key default gen_random_uuid(),
  school_id          uuid not null references schools(id) on delete cascade,
  profile_id         uuid unique references profiles(id) on delete set null,
  section_id         uuid references sections(id) on delete set null,
  roll_no            smallint,
  reg_id             text not null,
  name               text not null,
  gender             gender not null,
  dob                date,
  guardian           text not null,
  guardian_relation  guardian_relation not null default 'Father',
  phone              text,
  email              text,
  address            text,
  enrolled_on        date not null default current_date,
  status             account_status not null default 'active',  -- 'pending' = self sign-up awaiting approval
  unique (school_id, reg_id),
  unique (section_id, roll_no)
);
create index on students (school_id, section_id);

-- Weekly timetable shown on the student overview.
create table timetable_slots (
  id              uuid primary key default gen_random_uuid(),
  school_id       uuid not null references schools(id) on delete cascade,
  section_id      uuid not null references sections(id) on delete cascade,
  weekday         smallint not null check (weekday between 0 and 6),
  bell_period_id  uuid not null references bell_periods(id) on delete cascade,
  subject_id      uuid references subjects(id) on delete set null,
  teacher_id      uuid references teachers(id) on delete set null,
  room            text,
  unique (section_id, weekday, bell_period_id)
);

-- ---------------------------------------------------------------------
-- Attendance and leave
-- ---------------------------------------------------------------------
-- Student daily attendance (teacher Class Attendance). Holidays come from `holidays`.
create table student_attendance (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  student_id  uuid not null references students(id) on delete cascade,
  section_id  uuid not null references sections(id) on delete cascade,
  date        date not null,
  status      student_day_status not null,
  remark      text,
  marked_by   uuid references teachers(id) on delete set null,
  marked_at   timestamptz not null default now(),
  unique (student_id, date)
);
create index on student_attendance (section_id, date);

-- Teacher check-in / check-out (My Attendance).
create table teacher_attendance (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid not null references schools(id) on delete cascade,
  teacher_id     uuid not null references teachers(id) on delete cascade,
  date           date not null,
  state          teacher_day_state not null,
  check_in       time,
  check_out      time,
  minutes_late   smallint,
  note           text,
  unique (teacher_id, date)
);

create table leave_requests (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references schools(id) on delete cascade,
  teacher_id   uuid not null references teachers(id) on delete cascade,
  reason       text not null,
  from_at      timestamptz not null,
  to_at        timestamptz not null check (to_at > from_at),
  status       leave_status not null default 'Pending',
  sent_at      timestamptz not null default now(),
  decided_by   uuid references profiles(id) on delete set null,
  decided_at   timestamptz
);
create index on leave_requests (school_id, status);

-- ---------------------------------------------------------------------
-- Fees (no amounts, ever)
-- ---------------------------------------------------------------------
create table student_fee_plans (
  school_id         uuid not null references schools(id) on delete cascade,
  student_id        uuid not null references students(id) on delete cascade,
  academic_year_id  uuid not null references academic_years(id) on delete cascade,
  plan              fee_plan not null,
  primary key (student_id, academic_year_id)
);

create table fee_installments (
  id                uuid primary key default gen_random_uuid(),
  school_id         uuid not null references schools(id) on delete cascade,
  student_id        uuid not null references students(id) on delete cascade,
  academic_year_id  uuid not null references academic_years(id) on delete cascade,
  label             text not null,             -- 'October', 'First half', 'Annual'
  months            date[] not null,           -- first day of each month covered
  due_on            date not null
);
create index on fee_installments (student_id, due_on);

-- "part" leaves the installment open, "final" clears it.
create table fee_payments (
  id              uuid primary key default gen_random_uuid(),
  school_id       uuid not null references schools(id) on delete cascade,
  installment_id  uuid not null references fee_installments(id) on delete cascade,
  paid_at         timestamptz not null default now(),
  kind            payment_kind not null,
  recorded_by     uuid references profiles(id) on delete set null
);
create index on fee_payments (installment_id);

-- Class Fees remarks ("Reminder sent to parents", ...).
create table fee_remarks (
  id              uuid primary key default gen_random_uuid(),
  school_id       uuid not null references schools(id) on delete cascade,
  installment_id  uuid not null references fee_installments(id) on delete cascade,
  remark          text not null,
  author_id       uuid references profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Announcements / notices
-- ---------------------------------------------------------------------
create table announcements (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id) on delete cascade,
  title         text not null,
  body_html     text not null default '',
  audience      notice_audience not null,
  targets       text[] not null default '{}',   -- section codes or departments
  category      notice_category not null default 'General Notice',
  priority      notice_priority not null default 'normal',
  status        notice_status not null default 'draft',
  publish_at    timestamptz,                    -- publish time / scheduled time
  channels      notice_channel[] not null default '{feed}',
  pinned        boolean not null default false,
  author_id     uuid references profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on announcements (school_id, status, publish_at desc);

create table announcement_attachments (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid not null references schools(id) on delete cascade,
  announcement_id  uuid not null references announcements(id) on delete cascade,
  name             text not null,
  size_bytes       bigint not null,
  storage_path     text not null
);

create table announcement_reads (
  school_id        uuid not null references schools(id) on delete cascade,
  announcement_id  uuid not null references announcements(id) on delete cascade,
  profile_id       uuid not null references profiles(id) on delete cascade,
  read_at          timestamptz not null default now(),
  primary key (announcement_id, profile_id)
);

-- ---------------------------------------------------------------------
-- Assessments
-- ---------------------------------------------------------------------
create table assessments (
  id                 uuid primary key default gen_random_uuid(),
  school_id          uuid not null references schools(id) on delete cascade,
  section_id         uuid not null references sections(id) on delete cascade,
  subject_id         uuid not null references subjects(id) on delete restrict,
  teacher_id         uuid references teachers(id) on delete set null,
  title              text not null,
  topic              text,
  format             assessment_format not null,
  status             assessment_status not null default 'draft',
  start_at           timestamptz not null,
  due_at             timestamptz not null,
  extended_from      timestamptz,               -- original due date when extended
  duration_mins      smallint,
  total_marks        smallint not null,
  difficulty         difficulty,
  instructions_html  text,
  mode               submission_mode not null default 'online',
  auto_graded        boolean not null default false,
  released           boolean not null default false,
  created_at         timestamptz not null default now()
);
create index on assessments (section_id, due_at);

create table assessment_questions (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid not null references schools(id) on delete cascade,
  assessment_id  uuid not null references assessments(id) on delete cascade,
  position       smallint not null,
  type           question_type not null,
  text           text not null,
  options        text[],                        -- MCQ options; TF uses {True,False}
  answer         text not null,
  explanation    text,
  marks          smallint not null default 1
);

create table assessment_attachments (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid not null references schools(id) on delete cascade,
  assessment_id  uuid not null references assessments(id) on delete cascade,
  name           text not null,
  size_bytes     bigint not null,
  storage_path   text not null
);

create table submissions (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid not null references schools(id) on delete cascade,
  assessment_id  uuid not null references assessments(id) on delete cascade,
  student_id     uuid not null references students(id) on delete cascade,
  state          submission_state not null default 'none',
  submitted_at   timestamptz,
  answers        jsonb,                         -- question_id -> answer
  results        boolean[],                     -- per-question, auto-graded tests
  score          numeric(6,2),                  -- null until marked
  file_path      text,
  file_kind      text check (file_kind in ('pdf', 'image')),
  remarks        text not null default '',
  graded_by      uuid references teachers(id) on delete set null,
  unique (assessment_id, student_id)
);

-- ---------------------------------------------------------------------
-- Reports
-- ---------------------------------------------------------------------
create table report_cards (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references schools(id) on delete cascade,
  student_id   uuid not null references students(id) on delete cascade,
  term_id      uuid not null references terms(id) on delete cascade,
  status       report_status not null default 'draft',
  remark       text not null default '',
  author_id    uuid references teachers(id) on delete set null,
  sent_at      timestamptz,
  unique (student_id, term_id)
);

create table report_card_marks (
  id              uuid primary key default gen_random_uuid(),
  school_id       uuid not null references schools(id) on delete cascade,
  report_card_id  uuid not null references report_cards(id) on delete cascade,
  subject_id      uuid not null references subjects(id) on delete restrict,
  max_marks       smallint not null,
  obtained        numeric(6,2),                 -- null = not entered yet
  remark          text not null default '',
  unique (report_card_id, subject_id)
);

-- Monthly progress reports written by teachers.
create table progress_reports (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references schools(id) on delete cascade,
  student_id   uuid not null references students(id) on delete cascade,
  time_frame   text not null,                 -- 'October 2026'
  description  text not null,
  author_id    uuid references teachers(id) on delete set null,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Talents
-- ---------------------------------------------------------------------
create table talent_skills (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  name        text not null,                  -- 'Cricket', 'Naat', 'Swimming'
  category    text not null,                  -- 'Sports & Athletics', ...
  roles       text[] not null default '{}',   -- 'Captain', 'Goalkeeper'
  event       text,                           -- flagship competition
  min_grade   smallint not null default 1,
  unique (school_id, name)
);

create table student_talents (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  student_id  uuid not null references students(id) on delete cascade,
  skill_id    uuid not null references talent_skills(id) on delete cascade,
  is_primary  boolean not null default false,
  role        text,
  level       talent_level not null default 'beginner',
  endorsed_by uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (student_id, skill_id)
);
create unique index one_primary_talent on student_talents (student_id) where is_primary;

create table talent_achievements (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  student_id  uuid not null references students(id) on delete cascade,
  text        text not null,
  created_at  timestamptz not null default now()
);

create table competitions (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  title       text not null,
  date        date not null,
  category    text not null
);

create table talent_events (
  id              uuid primary key default gen_random_uuid(),
  school_id       uuid not null references schools(id) on delete cascade,
  student_id      uuid not null references students(id) on delete cascade,
  skill_id        uuid references talent_skills(id) on delete set null,
  competition_id  uuid references competitions(id) on delete set null,
  date            date not null,
  title           text not null,
  scope           event_scope not null,
  result          text not null
);

create table mentor_remarks (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  student_id  uuid not null references students(id) on delete cascade,
  author_id   uuid references profiles(id) on delete set null,
  author_role text not null,                  -- 'Sports Coach', 'Class Teacher'
  date        date not null default current_date,
  text        text not null
);

-- ---------------------------------------------------------------------
-- Resources
-- ---------------------------------------------------------------------
create table resource_folders (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  parent_id   uuid references resource_folders(id) on delete cascade,
  name        text not null,
  grade       smallint,
  subject_id  uuid references subjects(id) on delete set null,
  updated_at  timestamptz not null default now()
);

create table resources (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id) on delete cascade,
  folder_id     uuid not null references resource_folders(id) on delete cascade,
  title         text not null,
  description   text not null default '',
  ext           resource_ext not null,
  size_bytes    bigint not null,
  grade         smallint not null,
  subject_id    uuid references subjects(id) on delete set null,
  category      resource_category not null,
  storage_path  text not null,
  uploaded_by   uuid references profiles(id) on delete set null,
  uploaded_at   timestamptz not null default now()
);
create index on resources (school_id, grade, subject_id);

-- ---------------------------------------------------------------------
-- AI copilot (principal / teacher / student assistants)
-- ---------------------------------------------------------------------
create table vault_documents (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id) on delete cascade,
  title         text not null,
  file_name     text not null,
  category      vault_category not null,
  subject_id    uuid references subjects(id) on delete set null,
  grade         smallint,
  pages         int not null default 0,
  size_bytes    bigint not null,
  status        vault_status not null default 'uploading',
  progress      smallint not null default 0 check (progress between 0 and 100),
  keywords      text[] not null default '{}',
  storage_path  text not null,
  uploaded_by   uuid references profiles(id) on delete set null,
  uploaded_at   timestamptz not null default now()
);

-- Indexed passages the copilot can cite (RAG).
create table vault_passages (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references schools(id) on delete cascade,
  document_id  uuid not null references vault_documents(id) on delete cascade,
  page         int not null,
  content      text not null,
  embedding    vector(1536)
);
create index on vault_passages using hnsw (embedding vector_cosine_ops);

create table copilot_conversations (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  profile_id  uuid not null references profiles(id) on delete cascade,
  title       text,
  created_at  timestamptz not null default now()
);

create table copilot_messages (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid not null references schools(id) on delete cascade,
  conversation_id  uuid not null references copilot_conversations(id) on delete cascade,
  sender           text not null check (sender in ('user', 'assistant')),
  text             text not null,
  blocks           jsonb,                     -- stats / table / list / links
  sources          jsonb,                     -- [{doc, page}]
  tools            text[] not null default '{}',
  action           jsonb,                     -- drafted action (teacher, student, quiz, notice, remark)
  action_applied   boolean not null default false,
  created_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Notifications and public contact form
-- ---------------------------------------------------------------------
create table notifications (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  profile_id  uuid not null references profiles(id) on delete cascade,
  text        text not null,
  tone        tone not null default 'neutral',
  link        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index on notifications (profile_id, created_at desc);

create table contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  school      text,
  message     text not null,
  created_at  timestamptz not null default now()
);

-- =====================================================================
-- Helpers for RLS
-- =====================================================================
create or replace function auth_school_id() returns uuid
  language sql stable security definer set search_path = public as
$$ select school_id from profiles where id = auth.uid() $$;

create or replace function auth_role() returns user_role
  language sql stable security definer set search_path = public as
$$ select role from profiles where id = auth.uid() $$;

create or replace function auth_teacher_id() returns uuid
  language sql stable security definer set search_path = public as
$$ select id from teachers where profile_id = auth.uid() $$;

create or replace function auth_student_id() returns uuid
  language sql stable security definer set search_path = public as
$$ select id from students where profile_id = auth.uid() $$;

-- Sections a teacher works with (class teacher or subject teacher).
create or replace function teacher_section_ids() returns setof uuid
  language sql stable security definer set search_path = public as
$$
  select id from sections where class_teacher_id = auth_teacher_id()
  union
  select section_id from teacher_sections where teacher_id = auth_teacher_id()
$$;

create or replace function student_in_my_sections(sid uuid) returns boolean
  language sql stable security definer set search_path = public as
$$ select exists (select 1 from students s where s.id = sid and s.section_id in (select teacher_section_ids())) $$;

-- =====================================================================
-- Row level security
-- =====================================================================
-- Baseline for every tenant table:
--   * principal: full access inside their school
--   * staff (principal + teacher): read inside their school
do $$
declare t text;
begin
  foreach t in array array[
    'school_settings','academic_years','terms','holidays','bell_periods','grades','subjects',
    'teachers','sections','teacher_sections','teacher_subjects','students','timetable_slots',
    'student_attendance','teacher_attendance','leave_requests',
    'student_fee_plans','fee_installments','fee_payments','fee_remarks',
    'announcements','announcement_attachments','announcement_reads',
    'assessments','assessment_questions','assessment_attachments','submissions',
    'report_cards','report_card_marks','progress_reports',
    'talent_skills','student_talents','talent_achievements','competitions','talent_events','mentor_remarks',
    'resource_folders','resources','vault_documents','vault_passages',
    'copilot_conversations','copilot_messages','notifications','invites'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format($p$create policy principal_all on %I for all
      using (school_id = auth_school_id() and auth_role() = 'principal')
      with check (school_id = auth_school_id() and auth_role() = 'principal')$p$, t);
    execute format($p$create policy staff_read on %I for select
      using (school_id = auth_school_id() and auth_role() in ('principal','teacher'))$p$, t);
  end loop;
end $$;

alter table schools          enable row level security;
alter table profiles         enable row level security;
alter table contact_messages enable row level security;

create policy member_read on schools for select using (id = auth_school_id());
create policy principal_update on schools for update using (id = auth_school_id() and auth_role() = 'principal');

create policy self_update on profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = auth_role() and school_id = auth_school_id());
create policy school_read on profiles for select using (school_id = auth_school_id());
create policy principal_all on profiles for all
  using (school_id = auth_school_id() and auth_role() = 'principal')
  with check (school_id = auth_school_id());

create policy anyone_insert on contact_messages for insert with check (true);

-- School-wide reference data that students can read too.
do $$
declare t text;
begin
  foreach t in array array[
    'school_settings','academic_years','terms','holidays','bell_periods','grades','subjects',
    'sections','teachers','talent_skills','competitions','resource_folders','resources'
  ] loop
    execute format($p$create policy student_read on %I for select
      using (school_id = auth_school_id() and auth_role() = 'student')$p$, t);
  end loop;
end $$;

-- ---- Teacher write access (own classes only) ----
create policy teacher_own on teacher_attendance for all
  using (teacher_id = auth_teacher_id()) with check (teacher_id = auth_teacher_id());

create policy teacher_own on leave_requests for insert
  with check (teacher_id = auth_teacher_id() and status = 'Pending');
create policy teacher_cancel on leave_requests for delete
  using (teacher_id = auth_teacher_id() and status = 'Pending');

create policy teacher_mark on student_attendance for all
  using (section_id in (select teacher_section_ids()))
  with check (school_id = auth_school_id() and section_id in (select teacher_section_ids()));

create policy teacher_mark on fee_payments for insert
  with check (school_id = auth_school_id() and exists (
    select 1 from fee_installments i where i.id = installment_id and student_in_my_sections(i.student_id)));
create policy teacher_mark on fee_remarks for insert
  with check (school_id = auth_school_id() and author_id = auth.uid());

create policy teacher_class_notice on announcements for all
  using (author_id = auth.uid() and auth_role() = 'teacher')
  with check (school_id = auth_school_id() and author_id = auth.uid() and audience in ('classes','students','parents'));

create policy teacher_own on assessments for all
  using (section_id in (select teacher_section_ids()))
  with check (school_id = auth_school_id() and section_id in (select teacher_section_ids()));
create policy teacher_own on assessment_questions for all
  using (exists (select 1 from assessments a where a.id = assessment_id and a.section_id in (select teacher_section_ids())))
  with check (school_id = auth_school_id());
create policy teacher_own on assessment_attachments for all
  using (exists (select 1 from assessments a where a.id = assessment_id and a.section_id in (select teacher_section_ids())))
  with check (school_id = auth_school_id());
create policy teacher_grade on submissions for update
  using (student_in_my_sections(student_id));

create policy teacher_own on report_cards for all
  using (student_in_my_sections(student_id))
  with check (school_id = auth_school_id() and student_in_my_sections(student_id));
create policy teacher_own on report_card_marks for all
  using (exists (select 1 from report_cards r where r.id = report_card_id and student_in_my_sections(r.student_id)))
  with check (school_id = auth_school_id());
create policy teacher_own on progress_reports for all
  using (author_id = auth_teacher_id())
  with check (school_id = auth_school_id() and author_id = auth_teacher_id());

create policy teacher_endorse on student_talents for all
  using (student_in_my_sections(student_id))
  with check (school_id = auth_school_id() and student_in_my_sections(student_id));
create policy teacher_endorse on talent_achievements for insert
  with check (school_id = auth_school_id() and student_in_my_sections(student_id));
create policy teacher_endorse on talent_events for insert
  with check (school_id = auth_school_id() and student_in_my_sections(student_id));
create policy teacher_endorse on mentor_remarks for insert
  with check (school_id = auth_school_id() and author_id = auth.uid());

create policy teacher_upload on resources for all
  using (uploaded_by = auth.uid())
  with check (school_id = auth_school_id() and uploaded_by = auth.uid() and auth_role() = 'teacher');
create policy teacher_upload on resource_folders for insert
  with check (school_id = auth_school_id() and auth_role() = 'teacher');

-- ---- Student access (own records only) ----
create policy student_self on students for select using (id = auth_student_id());
create policy student_self on student_attendance for select using (student_id = auth_student_id());
create policy student_self on student_fee_plans for select using (student_id = auth_student_id());
create policy student_self on fee_installments for select using (student_id = auth_student_id());
create policy student_self on fee_payments for select using (exists (
  select 1 from fee_installments i where i.id = installment_id and i.student_id = auth_student_id()));
create policy student_self on report_cards for select using (student_id = auth_student_id() and status = 'sent');
create policy student_self on report_card_marks for select using (exists (
  select 1 from report_cards r where r.id = report_card_id and r.student_id = auth_student_id() and r.status = 'sent'));
create policy student_self on progress_reports for select using (student_id = auth_student_id());
create policy student_self on student_talents for select using (student_id = auth_student_id());
create policy student_self on talent_achievements for select using (student_id = auth_student_id());
create policy student_self on talent_events for select using (student_id = auth_student_id());
create policy student_self on mentor_remarks for select using (student_id = auth_student_id());

create policy student_section on timetable_slots for select using (
  section_id = (select section_id from students where id = auth_student_id()));
create policy student_section on assessments for select using (
  status <> 'draft' and section_id = (select section_id from students where id = auth_student_id()));
create policy student_section on assessment_attachments for select using (exists (
  select 1 from assessments a where a.id = assessment_id and a.status <> 'draft'
    and a.section_id = (select section_id from students where id = auth_student_id())));
-- Questions are served through an RPC that hides `answer` until results are released.

create policy student_self on submissions for select using (student_id = auth_student_id());
create policy student_submit on submissions for insert with check (student_id = auth_student_id() and score is null);
create policy student_submit on submissions for update using (student_id = auth_student_id() and score is null)
  with check (student_id = auth_student_id() and score is null);

create policy student_feed on announcements for select using (
  school_id = auth_school_id() and auth_role() = 'student' and status = 'published'
  and (audience in ('school','students')
       or (audience = 'classes' and (select code from sections s join students st on st.section_id = s.id
                                     where st.id = auth_student_id()) = any (targets))));
create policy student_feed on announcement_attachments for select using (exists (
  select 1 from announcements a where a.id = announcement_id));   -- inherits the announcement policy

-- ---- Everyone: own reads, notifications, copilot history ----
create policy self_rw on announcement_reads for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid() and school_id = auth_school_id());
create policy self_rw on notifications for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy self_rw on copilot_conversations for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid() and school_id = auth_school_id());
create policy self_rw on copilot_messages for all
  using (exists (select 1 from copilot_conversations c where c.id = conversation_id and c.profile_id = auth.uid()))
  with check (school_id = auth_school_id());

-- =====================================================================
-- Derived views used by dashboards
-- =====================================================================
-- Installment status: ontime / late / partial / overdue / due / upcoming.
create or replace view fee_installment_status with (security_invoker = true) as
select
  i.*,
  f.paid_at                                         as final_paid_at,
  exists (select 1 from fee_payments p where p.installment_id = i.id and p.kind = 'part') as has_part,
  case
    when f.paid_at is not null and f.paid_at::date <= i.due_on then 'ontime'
    when f.paid_at is not null                                then 'late'
    when exists (select 1 from fee_payments p where p.installment_id = i.id and p.kind = 'part') then 'partial'
    when current_date > i.due_on                              then 'overdue'
    when current_date >= date_trunc('month', i.due_on)::date  then 'due'
    else 'upcoming'
  end                                               as status,
  case when f.paid_at is null then greatest(0, current_date - i.due_on) else 0 end as overdue_days
from fee_installments i
left join lateral (
  select min(paid_at) as paid_at from fee_payments p where p.installment_id = i.id and p.kind = 'final'
) f on true;

-- Per-student attendance rate for the current term.
create or replace view student_term_attendance with (security_invoker = true) as
select
  a.student_id,
  t.id as term_id,
  count(*) filter (where a.status = 'present') as present,
  count(*) filter (where a.status = 'absent')  as absent,
  count(*) filter (where a.status = 'leave')   as leave,
  round(100.0 * count(*) filter (where a.status = 'present') / nullif(count(*), 0), 1) as rate
from student_attendance a
join terms t on t.school_id = a.school_id and a.date between t.starts_on and t.ends_on
group by a.student_id, t.id;

-- Keep announcements.updated_at fresh.
create or replace function touch_updated_at() returns trigger language plpgsql as
$$ begin new.updated_at = now(); return new; end $$;
create trigger announcements_touch before update on announcements
  for each row execute function touch_updated_at();
