"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/input";

/** A sort dropdown that keeps the page's other filters in the URL. */
export function SortSelect({ options, value }: { options: { value: string; label: string }[]; value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <label className="flex items-center gap-2 text-sm text-(--color-ink-muted)">
      <span className="shrink-0">Sort</span>
      <Select
        value={value}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          if (e.target.value === options[0].value) params.delete("sort");
          else params.set("sort", e.target.value);
          const qs = params.toString();
          router.push(`${pathname}${qs ? `?${qs}` : ""}`);
        }}
        className="h-10 w-auto py-0"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </label>
  );
}
