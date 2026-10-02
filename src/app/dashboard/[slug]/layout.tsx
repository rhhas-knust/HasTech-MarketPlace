import { redirect } from "next/navigation";
import { getCurrentUser, requireStoreAccess } from "@/lib/auth/session";
import { DashboardShell } from "@/components/dashboard/shell";
import { getAttentionCounts } from "@/lib/dashboard-data";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await requireStoreAccess(slug);
  if (!membership) redirect("/dashboard");

  const attention = await getAttentionCounts(membership.store.id);

  return (
    <DashboardShell
      storeSlug={slug}
      storeName={membership.store.name}
      userEmail={user.email ?? ""}
      ordersToFulfil={attention.ordersToFulfil}
      stockAlerts={attention.lowStock + attention.outOfStock}
    >
      {children}
    </DashboardShell>
  );
}
