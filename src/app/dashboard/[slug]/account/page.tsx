import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Download } from "lucide-react";
import { getCurrentProfile, requireStoreAccess } from "@/lib/auth/session";
import { GRACE_DAYS } from "@/lib/account-deletion";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteAccountForm } from "@/components/dashboard/delete-account-form";
import { requestDeletionAction } from "./actions";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const membership = await requireStoreAccess(slug);
  if (!membership) redirect("/dashboard");
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const isOwner = membership.role === "owner";

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-(--color-ink)">Account</h1>

      <Card>
        <CardHeader>
          <CardTitle>Your details</CardTitle>
        </CardHeader>
        <CardBody>
          <dl className="grid gap-3 text-sm sm:grid-cols-[8rem_1fr]">
            <dt className="text-(--color-ink-muted)">Name</dt>
            <dd className="text-(--color-ink)">{profile.full_name || "Not set"}</dd>
            <dt className="text-(--color-ink-muted)">Email</dt>
            <dd className="text-(--color-ink)">{profile.email}</dd>
            <dt className="text-(--color-ink-muted)">Role</dt>
            <dd className="text-(--color-ink)">{isOwner ? "Owner" : "Staff"} of {membership.store.name}</dd>
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Download your data</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-(--color-ink-muted)">
            A copy of your account, store, products, customers and orders as a JSON file you can keep or move elsewhere.
          </p>
          <a
            href={`/api/account/export?store=${encodeURIComponent(slug)}`}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-md border border-(--color-border-strong) px-4 text-sm font-medium text-(--color-ink) transition-transform duration-150 hover:bg-(--color-surface-subtle) active:scale-[0.97]"
          >
            <Download className="h-4 w-4" aria-hidden /> Download my data
          </a>
        </CardBody>
      </Card>

      <Card className="border-(--color-danger)/40">
        <CardHeader>
          <CardTitle>Delete account</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="space-y-3 text-sm text-(--color-ink-muted)">
            <p>
              {isOwner
                ? "Your store goes offline straight away. After "
                : "You lose access to this store straight away. After "}
              {GRACE_DAYS} days we permanently delete:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>your sign-in, name and email</li>
              {isOwner && (
                <>
                  <li>your store page, products, photos and downloadable files</li>
                  <li>your customers&apos; names, phone numbers, emails and addresses</li>
                  <li>your Paystack keys and your promotions</li>
                </>
              )}
            </ul>
            {isOwner && (
              <p>
                Order amounts, dates and product names are kept for six years, as Ghanaian tax law requires, with no customer
                details attached. Download your data first if you want a copy.
              </p>
            )}
            <p>Changed your mind? Sign in within {GRACE_DAYS} days and cancel.</p>
          </div>
          <div className="mt-5 border-t border-(--color-border) pt-5">
            <DeleteAccountForm action={requestDeletionAction.bind(null, slug)} />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
