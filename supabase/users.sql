-- =====================================================================
-- users: one row per account, holding the credentials and profile
-- details a person gives on Sign Up (components/auth/SignupForm.tsx)
-- and the activity recorded on every Login (components/auth/LoginForm.tsx).
--
-- Passwords are NOT stored here. Supabase Auth keeps them in auth.users
-- as a one-way bcrypt hash; copying that hash into a public table would
-- only make it reachable through the API. Login checks the password
-- against auth.users, then the triggers below keep this table in sync.
-- =====================================================================

create table if not exists public.users (
  id               uuid primary key references auth.users(id) on delete cascade,

  -- Sign Up form
  full_name        text not null check (char_length(trim(full_name)) >= 2),
  email            text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),

  -- Account
  role             text not null default 'principal' check (role in ('principal', 'teacher', 'student')),
  auth_provider    text not null default 'email',
  email_verified   boolean not null default false,

  -- Sign In activity
  last_sign_in_at  timestamptz,
  sign_in_count    integer not null default 0,

  created_at       timestamptz not null default now(),   -- signed up
  updated_at       timestamptz not null default now()
);

-- Keep updated_at fresh.
create or replace function public.users_touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists users_touch_updated_at on public.users;
create trigger users_touch_updated_at before update on public.users
  for each row execute function public.users_touch_updated_at();

-- Sign Up: create the row as soon as Supabase Auth creates the account.
-- The form sends full_name via supabase.auth.signUp({ options: { data: { full_name } } }).
create or replace function public.handle_auth_user_created() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.users (id, full_name, email, auth_provider, email_verified, created_at)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    lower(new.email),
    coalesce(new.raw_app_meta_data ->> 'provider', 'email'),
    new.email_confirmed_at is not null,
    new.created_at
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_auth_user_created();

-- Sign In / email change / verification: mirror the changes.
create or replace function public.handle_auth_user_updated() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.users set
    email           = lower(new.email),
    email_verified  = new.email_confirmed_at is not null,
    last_sign_in_at = new.last_sign_in_at,
    sign_in_count   = sign_in_count
                      + case when new.last_sign_in_at is distinct from old.last_sign_in_at then 1 else 0 end
  where id = new.id;
  return new;
end $$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated after update of email, email_confirmed_at, last_sign_in_at on auth.users
  for each row execute function public.handle_auth_user_updated();

-- Backfill accounts that already exist.
insert into public.users (id, full_name, email, auth_provider, email_verified, last_sign_in_at, created_at)
select u.id,
       coalesce(nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''), split_part(u.email, '@', 1)),
       lower(u.email),
       coalesce(u.raw_app_meta_data ->> 'provider', 'email'),
       u.email_confirmed_at is not null,
       u.last_sign_in_at,
       u.created_at
from auth.users u
where u.email is not null
on conflict (id) do nothing;

-- Security: a signed-in user sees only their own row and may edit only their name.
-- Email, role and sign-in activity are written by the triggers above, never by the client.
alter table public.users enable row level security;

drop policy if exists users_select_own on public.users;
create policy users_select_own on public.users for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

revoke insert, update, delete on public.users from anon, authenticated;
grant select on public.users to authenticated;
grant update (full_name) on public.users to authenticated;
