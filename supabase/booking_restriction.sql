-- Prevent duplicate active bookings for the same patient identity.
-- Run once in the Supabase SQL Editor. Active means new or confirmed;
-- completed and cancelled appointments do not block a new request.

create or replace function public.prevent_duplicate_active_appointment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(trim(coalesce(new.status, ''))) in ('new', 'confirmed')
     and exists (
       select 1
       from public.appointments a
       where a.id <> new.id
         and lower(trim(a.full_name)) = lower(trim(new.full_name))
         and regexp_replace(a.mobile_number, '[^0-9]', '', 'g') = regexp_replace(new.mobile_number, '[^0-9]', '', 'g')
         and lower(trim(coalesce(a.status, ''))) in ('new', 'confirmed')
     ) then
    raise exception using
      errcode = '23505',
      message = 'An active appointment already exists for this name and mobile number.';
  end if;
  return new;
end;
$$;

drop trigger if exists appointments_prevent_duplicate_active on public.appointments;
create trigger appointments_prevent_duplicate_active
before insert or update of full_name, mobile_number, status
on public.appointments
for each row execute function public.prevent_duplicate_active_appointment();

notify pgrst, 'reload schema';
