import Link from "next/link";
import { MessageCircle } from "lucide-react";
import type { Store } from "@/lib/types/database";
import { PLATFORM_NAME } from "@/lib/constants";
import { whatsappLink } from "@/lib/whatsapp";

export function StoreFooter({ store }: { store: Store }) {
  const location = [store.address, store.city, store.region].filter(Boolean).join(", ");

  return (
    <footer className="border-t border-(--color-border) bg-(--color-surface)">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="font-semibold text-(--color-ink)">{store.name}</p>
            {store.description && <p className="mt-2 text-sm text-(--color-ink-muted)">{store.description}</p>}
          </div>
          <div>
            <h2 className="text-sm font-medium text-(--color-ink)">Contact the seller</h2>
            <address className="mt-2 space-y-1 text-sm not-italic text-(--color-ink-muted)">
              {location && <p>{location}</p>}
              {store.contact_phone && (
                <p>
                  <a href={`tel:${store.contact_phone.replace(/\s+/g, "")}`} className="hover:text-(--color-ink) hover:underline">
                    {store.contact_phone}
                  </a>
                </p>
              )}
              {store.contact_email && (
                <p>
                  <a href={`mailto:${store.contact_email}`} className="hover:text-(--color-ink) hover:underline">
                    {store.contact_email}
                  </a>
                </p>
              )}
              {store.whatsapp_number && (
                <p>
                  <a
                    href={whatsappLink(store.whatsapp_number, `Hi ${store.name}, I have a question.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-(--color-ink) hover:underline"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden />
                    WhatsApp
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </p>
              )}
            </address>
          </div>
          <nav aria-label="Store information">
            <h2 className="text-sm font-medium text-(--color-ink)">Orders</h2>
            <ul className="mt-2 space-y-1 text-sm text-(--color-ink-muted)">
              <li>
                <Link href={`/store/${store.slug}/order`} className="hover:text-(--color-ink) hover:underline">
                  Track an order
                </Link>
              </li>
              <li>
                <Link href={`/store/${store.slug}/refunds`} className="hover:text-(--color-ink) hover:underline">
                  Refunds and returns
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="mt-8 flex flex-col gap-3 border-t border-(--color-border) pt-6 text-xs text-(--color-ink-muted) sm:flex-row sm:items-center sm:justify-between">
          <p>
            Store hosted by{" "}
            <Link href="/" className="hover:text-(--color-ink) hover:underline">
              {PLATFORM_NAME}
            </Link>
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            <li>
              <Link href="/privacy" className="hover:text-(--color-ink) hover:underline">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-(--color-ink) hover:underline">
                Terms
              </Link>
            </li>
            <li>
              <Link href="/cookies" className="hover:text-(--color-ink) hover:underline">
                Cookies
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
