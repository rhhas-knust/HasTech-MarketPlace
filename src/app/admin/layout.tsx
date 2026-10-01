import { redirect } from "next/navigation";
import { getCurrentUser, isPlatformAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";

/**
 * Single gate for every /admin/* page -- deliberately its own layout, with
 * no shared header/nav from the public site or seller dashboard, so this
 * never gets stumbled into and doesn't look like part of either. Individual
 * pages don't need their own isPlatformAdmin() check for rendering, but
 * server actions they call still do (a layout only guards navigation, not
 * the action endpoint itself -- see src/lib/consultations.ts).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isPlatformAdmin())) redirect("/dashboard");

  const supabase = await createClient();
  const [user, { count: newConsultations }, { count: openFeedback }] = await Promise.all([
    getCurrentUser(),
    supabase.from("consultation_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("platform_feedback").select("id", { count: "exact", head: true }).neq("status", "resolved"),
  ]);

  return (
    <AdminShell
      userEmail={user?.email ?? ""}
      newConsultations={newConsultations ?? 0}
      openFeedback={openFeedback ?? 0}
    >
      {children}
    </AdminShell>
  );
}
