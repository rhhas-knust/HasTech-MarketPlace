"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The number on the cart icon. It bumps only when the count goes up, so
 * moving between pages (which re-renders the header) doesn't animate it.
 */
export function CartCountBadge({ count }: { count: number }) {
  const previous = useRef(count);
  const [bumps, setBumps] = useState(0);

  useEffect(() => {
    if (count > previous.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to a prop change from the server
      setBumps((n) => n + 1);
    }
    previous.current = count;
  }, [count]);

  if (count <= 0) return null;

  return (
    <span
      key={bumps}
      className={`absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-md bg-(--store-accent) px-1 text-xs font-medium text-(--store-on-accent) ring-2 ring-(--color-surface) ${bumps > 0 ? "badge-bump" : ""}`}
    >
      {count}
    </span>
  );
}
