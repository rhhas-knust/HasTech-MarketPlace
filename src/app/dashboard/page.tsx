import { redirect } from "next/navigation";
import { getCurrentUser, getUserStores, isPlatformAdmin } from "@/lib/auth/session";

export default async function DashboardIndexPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const stores = await getUserStores();
  if (stores.length === 0) {
    // A platform admin with no store of their own shouldn't be funneled
    // into seller onboarding -- send them to the admin area instead.
    if (await isPlatformAdmin()) redirect("/admin");
    redirect("/onboarding");
  }

  redirect(`/dashboard/${stores[0].store.slug}`);
}
