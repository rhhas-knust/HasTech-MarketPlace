#!/usr/bin/env bash
# Applies every migration to a scratch local Postgres database and runs the
# tenant-isolation assertions in rls_isolation_tests.sql against it.
#
# This exercises the REAL migrations (0001-0010) with a thin shim standing
# in for the parts of a Supabase project we don't have locally (auth schema,
# anon/authenticated/service_role roles). It never touches a real project.
#
# Requires a local `psql` that can reach a Postgres server as a superuser.
# Override connection details with PGHOST/PGPORT/PGUSER/PGPASSWORD as usual.
set -euo pipefail

DB_NAME="${TEST_RLS_DB:-hastech_rls_test}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/../supabase/migrations"

echo "==> Recreating scratch database '$DB_NAME'"
dropdb --if-exists "$DB_NAME"
createdb "$DB_NAME"

echo "==> Applying local Supabase shim (roles, auth schema)"
psql -v ON_ERROR_STOP=1 -d "$DB_NAME" -f "$SCRIPT_DIR/local_test_shim.sql"

echo "==> Applying migrations"
for f in "$MIGRATIONS_DIR"/*.sql; do
  echo "    - $(basename "$f")"
  psql -v ON_ERROR_STOP=1 -d "$DB_NAME" -f "$f"
done

echo "==> Applying local grants shim (mirrors Supabase default privileges)"
psql -v ON_ERROR_STOP=1 -d "$DB_NAME" -f "$SCRIPT_DIR/local_test_grants.sql"

echo "==> Running tenant isolation assertions"
psql -v ON_ERROR_STOP=1 -d "$DB_NAME" -f "$SCRIPT_DIR/rls_isolation_tests.sql"

echo "==> Cleaning up scratch database"
dropdb --if-exists "$DB_NAME"

echo "==> RLS tenant isolation tests passed"
