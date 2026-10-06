-- Lets visitors send data-protection requests (access, correction, deletion
-- under the Data Protection Act, 2012 (Act 843)) through the contact form,
-- and records when the sender agreed to the Privacy Policy.
alter table public.consultation_requests
  drop constraint if exists consultation_requests_topic_check;

alter table public.consultation_requests
  add constraint consultation_requests_topic_check
  check (topic in ('how_it_works', 'pricing', 'privacy', 'other'));

alter table public.consultation_requests
  add column if not exists privacy_accepted_at timestamptz;
