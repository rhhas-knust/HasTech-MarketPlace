import { redirect } from "next/navigation";
import { getCurrentUser, getUserStores } from "@/lib/auth/session";

export default async function DashboardIndexPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const stores = await getUserStores();
  if (stores.length === 0) redirect("/onboarding");

  redirect(`/dashboard/${stores[0].store.slug}`);
}
