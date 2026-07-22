-- Patient profile details. Run once in Supabase SQL Editor.
alter table public.profiles add column if not exists date_of_birth date;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists address text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists emergency_contact text;
alter table public.profiles add column if not exists allergies text;
alter table public.profiles add column if not exists medical_history text;
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update using (id=auth.uid()) with check (id=auth.uid());
grant update on public.profiles to authenticated;
