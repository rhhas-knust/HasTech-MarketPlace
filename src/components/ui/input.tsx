import { cn } from "@/lib/cn";
import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, LabelHTMLAttributes } from "react";

const fieldBase =
  "w-full rounded-3xl border border-(--color-border)/70 bg-(--color-surface) shadow-soft px-4 py-2.5 text-sm text-(--color-ink) shadow-[inset_0_1px_2px_rgb(15_23_42/0.04)] transition-[border-color,box-shadow] placeholder:text-(--color-ink-muted)/80 hover:border-(--color-brand)/30 focus:border-(--color-brand) focus:outline-none focus:ring-4 focus:ring-(--color-brand)/15 disabled:opacity-50";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, "min-h-28", className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldBase, className)} {...props} />;
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-(--color-ink)", className)}
      {...props}
    />
  );
}

export function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return <p className="mt-1 text-sm text-(--color-danger)">{children}</p>;
}

export function FieldHint({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1 text-sm text-(--color-ink-muted)">{children}</p>;
}
