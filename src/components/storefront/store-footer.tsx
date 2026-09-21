import Link from "next/link";
import { MessageCircle } from "lucide-react";
import type { Store } from "@/lib/types/database";
import { PLATFORM_NAME } from "@/lib/constants";
import { whatsappLink } from "@/lib/whatsapp";

export function StoreFooter({ store }: { store: Store }) {
  return (
    <footer className="border-t border-(--color-border) bg-(--color-surface)">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="font-semibold text-(--color-ink)">{store.name}</p>
            {store.description && (
              <p className="mt-2 text-sm text-(--color-ink-muted)">{store.description}</p>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-(--color-ink)">Contact</p>
            <ul className="mt-2 space-y-1 text-sm text-(--color-ink-muted)">
              {store.contact_phone && <li>{store.contact_phone}</li>}
              {store.contact_email && <li>{store.contact_email}</li>}
              {[store.city, store.region].filter(Boolean).length > 0 && (
                <li>{[store.city, store.region].filter(Boolean).join(", ")}</li>
              )}
              {store.whatsapp_number && (
                <li>
                  <a
                    href={whatsappLink(store.whatsapp_number, `Hi ${store.name}, I have a question.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-(--store-accent) hover:underline"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden />
                    Chat on WhatsApp
                  </a>
                </li>
              )}
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-(--color-ink)">Track an order</p>
            <p className="mt-2 text-sm">
              <Link href={`/store/${store.slug}/order`} className="text-(--store-accent) hover:underline">
                Look up your order status
              </Link>
            </p>
          </div>
        </div>
        <p className="mt-8 border-t border-(--color-border) pt-6 text-center text-xs text-(--color-ink-muted)">
          Powered by {PLATFORM_NAME}
        </p>
      </div>
    </footer>
  );
}
