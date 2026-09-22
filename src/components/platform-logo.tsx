import { PLATFORM_NAME } from "@/lib/constants";

export function PlatformLogo({ iconSize = 24 }: { iconSize?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/hastech-icon.png" alt="" width={iconSize} height={iconSize} className="shrink-0" />
      {PLATFORM_NAME}
    </span>
  );
}
