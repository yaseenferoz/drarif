-- Run this file in the Supabase SQL editor, then create your first user.
-- Promote that user with: update public.profiles set role = 'admin' where id = 'USER_UUID';

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'patient' check (role in ('patient','admin')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''));
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create table if not exists public.treatments (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  eyebrow text not null default '',
  excerpt text not null default '',
  image_url text not null default '',
  symptoms jsonb not null default '[]',
  evaluations jsonb not null default '[]',
  treatments jsonb not null default '[]',
  preparation jsonb not null default '[]',
  recovery text not null default '',
  urgent_signs jsonb not null default '[]',
  published boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text not null default '',
  category text not null default 'Health',
  image_url text not null default '',
  reading_minutes integer not null default 5,
  content text not null default '',
  published boolean not null default false,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  mobile_number text not null,
  email text,
  consultation_type text not null,
  appointment_date date not null,
  preferred_time text not null,
  symptoms text not null,
  status text not null default 'new' check(status in ('new','confirmed','completed','cancelled')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.treatments enable row level security;
alter table public.articles enable row level security;
alter table public.site_settings enable row level security;
alter table public.appointments enable row level security;

create policy "profiles read own" on public.profiles for select using (id=auth.uid() or public.is_admin());
create policy "public published treatments" on public.treatments for select using (published or public.is_admin());
create policy "public published articles" on public.articles for select using (published or public.is_admin());
create policy "public settings read" on public.site_settings for select using (true);
create policy "anyone can request appointment" on public.appointments for insert with check (user_id is null or user_id=auth.uid());
create policy "patients read own appointments" on public.appointments for select using (user_id=auth.uid() or public.is_admin());
create policy "admins manage treatments" on public.treatments for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage articles" on public.articles for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage settings" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());
create policy "admins update appointments" on public.appointments for update using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets(id,name,public) values('site-media','site-media',true) on conflict(id) do nothing;
create policy "public media read" on storage.objects for select using (bucket_id='site-media');
create policy "admins upload media" on storage.objects for insert with check (bucket_id='site-media' and public.is_admin());
create policy "admins update media" on storage.objects for update using (bucket_id='site-media' and public.is_admin());
create policy "admins delete media" on storage.objects for delete using (bucket_id='site-media' and public.is_admin());
