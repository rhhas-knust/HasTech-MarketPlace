-- ============================================================================
-- Notifications (in-app) and audit log.
-- ============================================================================

create table notifications (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores (id) on delete cascade,
  user_id uuid references profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  metadata jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on notifications (user_id, is_read, created_at desc);
create index notifications_store_id_idx on notifications (store_id, created_at desc);

-- Important seller/admin actions. Written exclusively by triggers or
-- trusted server code (service role) -- never directly by client code --
-- so the log can't be tampered with by the actor it is recording.
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores (id) on delete cascade,
  actor_id uuid references profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_store_id_idx on audit_logs (store_id, created_at desc);
