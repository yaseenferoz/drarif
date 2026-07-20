-- CMS and admin upgrade. Safe to run more than once.
-- Run this in Supabase SQL Editor, then sign out and sign in again.

insert into public.profiles (id, full_name)
select id, coalesce(raw_user_meta_data->>'full_name', email, '')
from auth.users
on conflict (id) do nothing;

create table if not exists public.site_pages (
  id uuid primary key default gen_random_uuid(),
  page_key text unique not null,
  eyebrow text not null default '',
  title text not null,
  description text not null default '',
  content jsonb not null default '{}',
  published boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  href text not null,
  location text not null default 'header' check(location in ('header','footer')),
  sort_order integer not null default 0,
  visible boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  caption text not null default '',
  image_url text not null,
  category text not null default 'Clinic',
  sort_order integer not null default 0,
  published boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.site_pages enable row level security;
alter table public.navigation_items enable row level security;
alter table public.gallery_items enable row level security;

drop policy if exists "public published pages" on public.site_pages;
drop policy if exists "admins manage pages" on public.site_pages;
drop policy if exists "public visible navigation" on public.navigation_items;
drop policy if exists "admins manage navigation" on public.navigation_items;
drop policy if exists "public published gallery" on public.gallery_items;
drop policy if exists "admins manage gallery" on public.gallery_items;

create policy "public published pages" on public.site_pages for select using (published or public.is_admin());
create policy "admins manage pages" on public.site_pages for all using (public.is_admin()) with check (public.is_admin());
create policy "public visible navigation" on public.navigation_items for select using (visible or public.is_admin());
create policy "admins manage navigation" on public.navigation_items for all using (public.is_admin()) with check (public.is_admin());
create policy "public published gallery" on public.gallery_items for select using (published or public.is_admin());
create policy "admins manage gallery" on public.gallery_items for all using (public.is_admin()) with check (public.is_admin());

insert into public.site_pages(page_key,eyebrow,title,description,content) values
('home','APPOINTMENTS OPEN THIS WEEK','Advanced digestive care. Humanly delivered.','Specialist GI, cancer, liver–pancreas and keyhole surgery with clear guidance at every step.','{"expertise_title":"Care for the whole digestive system.","expertise_text":"From common conditions to complex cancer surgery, each treatment begins with an accurate diagnosis and a plan built around you.","about_title":"Expert decisions. Honest conversations.","about_text":"Advanced training, clear explanations and structured support through recovery.","articles_title":"Knowledge for better decisions."}'),
('about','ABOUT DR. ARIF RAZA','Specialist expertise, close to home.','Advanced gastrointestinal and laparoscopic surgical care grounded in careful diagnosis, honest advice and compassionate follow-up.','{"heading":"Focused GI, HPB and cancer surgery care in Kalaburagi.","body":"Dr. Arif Raza is a Consultant Gastrointestinal, GI Oncology, HPB and Advanced Laparoscopic Surgeon with more than 13 years of surgical experience.","secondary":"His approach is to explain the diagnosis plainly, discuss choices honestly and recommend surgery only when it is appropriate."}'),
('treatments','OUR SPECIALITIES','Specialist care for digestive conditions.','Explore diagnostic, endoscopic and surgical options after detailed consultation and report review.','{}'),
('articles','HEALTH LIBRARY','Clear guidance for digestive health.','Practical, doctor-reviewed reading for better care decisions.','{}'),
('gallery','CLINIC GALLERY','Care, facilities and patient education.','A closer look at specialist services and patient education.','{}'),
('booking','APPOINTMENTS','Request a consultation.','Share a few details and the clinic team will call to confirm your appointment.','{"aside_title":"Your care starts with a conversation.","aside_text":"New consultations, follow-ups, second opinions and report review requests are welcome."}'),
('contact','CONTACT','We’re here to help.','Contact the clinic for appointments, report review and specialist consultation details.','{}'),
('privacy','LEGAL','Privacy policy','How submitted information is handled and protected.','{"body":"Information submitted through appointment and contact forms is used to respond to your request and support clinic administration."}'),
('terms','LEGAL','Terms & conditions','Important information about appointments and educational content.','{"body":"Website information is educational and is not a diagnosis, prescription or emergency service."}')
on conflict(page_key) do nothing;

insert into public.navigation_items(label,href,location,sort_order,visible)
select * from (values
('About','/about','header',1,true),('Treatments','/treatments','header',2,true),
('Health library','/articles','header',3,true),('Gallery','/gallery','header',4,true),
('Contact','/contact','header',5,true)
) as seed(label,href,location,sort_order,visible)
where not exists(select 1 from public.navigation_items);

insert into public.gallery_items(title,caption,image_url,category,sort_order,published)
select * from (values
('Specialist consultation','Clear guidance for digestive and surgical concerns.','/assets/img/aboutarif.png','Clinic',1,true),
('Advanced laparoscopic care','Modern keyhole surgery for suitable conditions.','/assets/img/service/laprosocopic.png','Treatments',2,true),
('GI cancer care','Coordinated planning for complex gastrointestinal cancers.','/assets/img/team/gicancer.png','Treatments',3,true),
('Digestive health education','Practical information patients can understand and use.','/assets/img/lifestyle.png','Education',4,true)
) as seed(title,caption,image_url,category,sort_order,published)
where not exists(select 1 from public.gallery_items);

insert into public.site_settings(key,value) values
('general','{"logo_url":"/assets/img/gastroarif.png","doctor_name":"Dr. Arif Raza","credentials":"Consultant GI, HPB, GI Oncology & Advanced Laparoscopic Surgeon","phone":"+91 91879 66771","email":"dr.raza@nkhospital.in","hospital":"NK Hospital","location":"Kalaburagi, Karnataka","hours":"Monday – Saturday · 9:00 AM – 7:00 PM"}')
on conflict(key) do nothing;

-- Promote the exact authentication account. This deliberately fails instead
-- of silently updating zero rows when the email does not exist.
do $$
declare
  admin_user_id uuid;
begin
  select id into admin_user_id
  from auth.users
  where lower(btrim(email)) = lower('yaseenfiroz@gmail.com')
  limit 1;

  if admin_user_id is null then
    raise exception 'No Supabase Auth user exists for yaseenfiroz@gmail.com';
  end if;

  insert into public.profiles (id, full_name, role)
  select
    id,
    coalesce(raw_user_meta_data->>'full_name', email, ''),
    'admin'
  from auth.users
  where id = admin_user_id
  on conflict (id) do update set role = 'admin';
end $$;

-- The SQL Editor result must show role = admin before testing the portal.
select u.email, p.id, p.role
from auth.users u
join public.profiles p on p.id = u.id
where lower(btrim(u.email)) = lower('yaseenfiroz@gmail.com');
