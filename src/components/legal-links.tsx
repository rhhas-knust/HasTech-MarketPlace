import Link from "next/link";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/refunds", label: "Refunds" },
  { href: "/cookies", label: "Cookies" },
  { href: "/contact", label: "Contact" },
];

export function LegalLinks({ className }: { className?: string }) {
  return (
    <nav aria-label="Legal" className={cn("text-sm text-(--color-ink-muted)", className)}>
      <ul className="flex flex-wrap gap-x-4 gap-y-2">
        {LINKS.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="underline-offset-4 hover:text-(--color-ink) hover:underline">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
