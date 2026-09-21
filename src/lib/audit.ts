import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Writes an audit log entry. Uses the service-role client because
 * audit_logs has no client-facing INSERT policy (see
 * 0010_rls_policies.sql) -- a log a seller could write directly wouldn't be
 * trustworthy as a record of what they did. Callers are dashboard/server
 * actions that have already performed their own authorization check.
 */
export async function logAudit(
  storeId: string,
  actorId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  metadata: Record<string, unknown> = {},
) {
  const admin = createAdminClient();
  await admin.from("audit_logs").insert({
    store_id: storeId,
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
  });
}
