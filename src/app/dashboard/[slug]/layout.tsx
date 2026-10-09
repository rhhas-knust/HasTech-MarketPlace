import { redirect } from "next/navigation";
import { getCurrentProfile, getCurrentUser, requireStoreAccess } from "@/lib/auth/session";
import { cancelDeletionAction } from "./account/actions";
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

  const [attention, profile] = await Promise.all([getAttentionCounts(membership.store.id), getCurrentProfile()]);
  const deletionDate = profile?.deletion_scheduled_for
    ? new Date(profile.deletion_scheduled_for).toLocaleDateString("en-GH", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <DashboardShell
      storeSlug={slug}
      storeName={membership.store.name}
      userEmail={user.email ?? ""}
      ordersToFulfil={attention.ordersToFulfil}
      stockAlerts={attention.lowStock + attention.outOfStock}
    >
      {deletionDate && (
        <div
          role="alert"
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-(--color-danger)/40 bg-(--color-danger-subtle) p-4"
        >
          <p className="text-sm text-(--color-ink)">
            <strong className="font-semibold">Your account will be deleted on {deletionDate}.</strong> Your store is offline
            until then.
          </p>
          <form action={cancelDeletionAction.bind(null, slug)}>
            <button
              type="submit"
              className="h-9 rounded-md bg-(--color-ink) px-4 text-sm font-medium text-(--color-surface) transition-transform duration-150 active:scale-[0.97]"
            >
              Cancel deletion
            </button>
          </form>
        </div>
      )}
      {children}
    </DashboardShell>
  );
}
