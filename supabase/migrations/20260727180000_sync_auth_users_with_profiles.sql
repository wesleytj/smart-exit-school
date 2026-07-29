-- ============================================================
-- Smart Exit School
-- Migration 0010
-- File: 20260727180000_sync_auth_users_with_profiles.sql
-- Description:
--   Synchronizes Supabase Auth signups with public.profiles via
--   trigger on auth.users → public.handle_new_user().
--
-- Scope:
--   public.handle_new_user, on_auth_user_created
--
-- Depends on:
--   Migration 0001 (public.profiles)
-- ============================================================

-- ============================================================
-- FUNCTION
-- Inserts a public.profiles row for each new auth.users row.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    avatar_url,
    phone
  )
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(new.email, '@', 1)
    ),
    null,
    null
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

comment on function public.handle_new_user() is
    'Creates a public.profiles row after each auth.users insert (Supabase Auth sync).';

-- ============================================================
-- TRIGGER
-- ============================================================

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
