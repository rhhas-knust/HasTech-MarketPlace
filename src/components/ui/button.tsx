import { cn } from "@/lib/cn";
import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "store";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand-gradient text-white shadow-glow hover:-translate-y-0.5 hover:brightness-110 hover:shadow-lift",
  secondary: "bg-(--color-ink) text-(--color-surface) shadow-soft hover:-translate-y-0.5 hover:opacity-90",
  outline:
    "border border-(--color-border) bg-(--color-surface) text-(--color-ink) shadow-soft hover:-translate-y-0.5 hover:border-(--color-brand)/40",
  ghost: "text-(--color-ink) hover:bg-(--color-surface-subtle)",
  danger: "bg-(--color-danger) text-white shadow-soft hover:-translate-y-0.5 hover:opacity-90",
  store:
    "bg-(--store-accent) text-white shadow-soft hover:-translate-y-0.5 hover:bg-(--store-accent-hover) hover:shadow-lift",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-4 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-13 px-7 text-base gap-2",
};

const base =
  "inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-brand)";

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
