-- Adds a clinician-review-only intake summary to appointment requests.
-- This is not a diagnosis field and must never be presented as one.
alter table public.appointments add column if not exists pre_diagnosis_report text;
grant select, update on public.appointments to authenticated;
