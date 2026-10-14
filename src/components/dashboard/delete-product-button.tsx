"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteProductButton({
  name,
  onDelete,
  children,
}: {
  name: string;
  onDelete: () => Promise<void>;
  children: ReactNode;
}) {
  return (
    <ConfirmDialog
      title={`Delete "${name}"?`}
      description="This removes the product from your store. Past orders keep their details. This can't be undone."
      confirmLabel="Delete product"
      pendingLabel="Deleting…"
      onConfirm={onDelete}
      trigger={(open) => (
        <Button type="button" variant="outline" size="sm" onClick={open} className="text-(--color-danger)">
          {children}
        </Button>
      )}
    />
  );
}
