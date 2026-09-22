-- ============================================================================
-- Seller-to-platform feedback: bug reports, feature requests and general
-- issues sellers want the HASTECH team to see. This is feedback ABOUT the
-- platform itself, not a customer-facing support inbox for a store's own
-- shoppers (that would be a different, store-scoped table).
-- ============================================================================

create type feedback_category as enum ('bug', 'feature_request', 'question', 'other');
create type feedback_status as enum ('open', 'in_progress', 'resolved');

create table platform_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  store_id uuid references stores (id) on delete set null,
  category feedback_category not null default 'other',
  message text not null,
  status feedback_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_feedback_message_length check (char_length(message) between 1 and 4000)
);

create index platform_feedback_user_id_idx on platform_feedback (user_id, created_at desc);
create index platform_feedback_status_idx on platform_feedback (status) where status <> 'resolved';

create trigger set_updated_at before update on platform_feedback for each row execute function set_updated_at();

alter table platform_feedback enable row level security;

-- Authors can see and file their own feedback; platform admins can see and
-- triage everything. No update policy for authors -- a report is a
-- one-way submission, not something they should be able to silently edit
-- after a staff member has responded to it. Only status transitions (by
-- an admin) are allowed via a client-facing policy.
create policy platform_feedback_select_own on platform_feedback for select to authenticated
  using ((select auth.uid()) = user_id or is_platform_admin());
create policy platform_feedback_insert_own on platform_feedback for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy platform_feedback_admin_update on platform_feedback for update to authenticated
  using (is_platform_admin()) with check (is_platform_admin());
