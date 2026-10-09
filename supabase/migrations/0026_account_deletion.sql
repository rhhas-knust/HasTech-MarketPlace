-- ============================================================================
-- Self-service account deletion (Data Protection Act, 2012 (Act 843): the
-- right to have personal data erased; Privacy Policy: "Seller accounts: until
-- you close your account, then deleted within 30 days").
--
-- Asking to delete takes the seller's stores offline at once and schedules the
-- erasure 30 days out, so a mistake or a hijacked session can be undone by
-- signing back in. The erasure itself runs from server code
-- (src/lib/account-deletion.ts, via the daily /api/cron/account-deletions job):
-- personal data is removed or anonymised, while order amounts and dates stay
-- for the six years tax law requires, with no names attached.
-- ============================================================================

alter table profiles add column if not exists deletion_requested_at timestamptz;
alter table profiles add column if not exists deletion_scheduled_for timestamptz;
alter table profiles add column if not exists deleted_at timestamptz;

create index if not exists profiles_deletion_due_idx
  on profiles (deletion_scheduled_for)
  where deletion_scheduled_for is not null and deleted_at is null;
