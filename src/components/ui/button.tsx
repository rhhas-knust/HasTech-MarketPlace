import { cn } from "@/lib/cn";
import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "store";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary: "bg-(--color-brand) text-(--color-on-brand) hover:bg-(--color-brand-hover)",
  secondary: "bg-(--color-ink) text-(--color-surface) hover:opacity-90",
  outline:
    "border border-(--color-border-strong)/60 bg-(--color-surface) text-(--color-ink) hover:bg-(--color-surface-subtle)",
  ghost: "text-(--color-ink) hover:bg-(--color-surface-subtle)",
  danger: "bg-(--color-danger) text-white hover:opacity-90",
  store: "bg-(--store-accent) text-(--store-on-accent) hover:opacity-90",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-base gap-2",
};

const base =
  "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-[background-color,opacity,transform] duration-150 ease-out active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(base, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    />
  );
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  href,
  ...props
}: ButtonProps & { href: string }) {
  return (
    <Link
      href={href}
      className={cn(base, variantClasses[variant], sizeClasses[size], className)}
      {...(props as object)}
    />
  );
}
