"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

/** A submit button that disables itself and shows `pendingLabel` while its form is submitting. */
export function SubmitButton({ pendingLabel, children, ...props }: ButtonProps & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || props.disabled} {...props}>
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
