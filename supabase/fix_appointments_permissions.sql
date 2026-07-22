-- Allow clinic administrators to remove appointment records from the admin portal.
-- Run once in the Supabase SQL Editor. Safe to run repeatedly.

grant delete on public.appointments to authenticated;

alter table public.appointments enable row level security;

drop policy if exists "admins delete appointments" on public.appointments;
create policy "admins delete appointments"
on public.appointments
for delete
using (public.is_admin());

-- Keep the admin workflow privileges explicit for projects upgraded from the
-- original appointments table.
grant select, update, delete on public.appointments to authenticated;

select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'appointments'
  and grantee = 'authenticated'
order by privilege_type;
