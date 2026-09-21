import { redirect } from "next/navigation";
import { getCurrentUser, requireStoreAccess } from "@/lib/auth/session";
import { DashboardShell } from "@/components/dashboard/shell";

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

  return (
    <DashboardShell storeSlug={slug} storeName={membership.store.name} userEmail={user.email ?? ""}>
      {children}
    </DashboardShell>
  );
}
