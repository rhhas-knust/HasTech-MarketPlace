import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Users } from "lucide-react";
import { requireStoreAccess } from "@/lib/auth/session";
import { getStoreCustomers } from "@/lib/dashboard-data";
import { formatCurrency } from "@/lib/money";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const membership = await requireStoreAccess(slug);
  if (!membership) redirect("/dashboard");

  const customers = await getStoreCustomers(membership.store.id);

  if (customers.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-8 w-8" />}
        title="No customers yet"
        description="Customers appear here after their first order."
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-(--color-ink)">Customers</h1>
      <div className="overflow-x-auto rounded-xl border border-(--color-border) bg-(--color-surface)">
        <table className="w-full text-sm">
          <thead className="border-b border-(--color-border) text-left text-(--color-ink-muted)">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Orders</th>
              <th className="px-4 py-3 font-medium">Total spent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--color-border)">
            {customers.map((customer) => {
              const orders = (customer.orders as unknown as { total: number; payment_status: string }[]) ?? [];
              const paidOrders = orders.filter((o) => o.payment_status === "paid");
              const totalSpent = paidOrders.reduce((sum, o) => sum + Number(o.total), 0);
              return (
                <tr key={customer.id}>
                  <td className="px-4 py-3 font-medium text-(--color-ink)">
                    {[customer.first_name, customer.last_name].filter(Boolean).join(" ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-(--color-ink-muted)">
                    <div>{customer.email}</div>
                    <div>{customer.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-(--color-ink)">{orders.length}</td>
                  <td className="px-4 py-3 text-(--color-ink)">{formatCurrency(totalSpent, membership.store.currency)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
