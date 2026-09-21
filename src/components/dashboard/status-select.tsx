"use client";

import { useTransition } from "react";
import { Select } from "@/components/ui/input";

export function StatusSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      defaultValue={value}
      disabled={pending}
      onChange={(e) => startTransition(() => onChange(e.target.value))}
      className="w-auto"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </Select>
  );
}
