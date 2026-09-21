import Link from "next/link";
import { PLATFORM_NAME } from "@/lib/constants";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-(--color-surface-subtle) px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center text-lg font-semibold text-(--color-ink)">
          {PLATFORM_NAME}
        </Link>
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
