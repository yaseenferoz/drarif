-- Run this short file in Supabase SQL Editor to enable status changes in the
-- existing production appointments table. It does not delete bookings.
alter table public.appointments add column if not exists status text;
alter table public.appointments add column if not exists admin_notes text;
alter table public.appointments add column if not exists updated_at timestamptz;

update public.appointments set status = 'new' where status is null;
update public.appointments set updated_at = coalesce(updated_at, created_at, now()) where updated_at is null;

alter table public.appointments alter column status set default 'new';
alter table public.appointments alter column status set not null;
alter table public.appointments alter column updated_at set default now();
alter table public.appointments alter column updated_at set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'appointments_status_check'
      and conrelid = 'public.appointments'::regclass
  ) then
    alter table public.appointments
      add constraint appointments_status_check
      check (status in ('new','confirmed','completed','cancelled'));
  end if;
end $$;

notify pgrst, 'reload schema';

select column_name
from information_schema.columns
where table_schema = 'public' and table_name = 'appointments'
  and column_name in ('status','admin_notes','updated_at');
