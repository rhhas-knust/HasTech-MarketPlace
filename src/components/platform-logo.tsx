import { PLATFORM_NAME } from "@/lib/constants";

export function PlatformLogo({ iconSize = 24, textClassName }: { iconSize?: number; textClassName?: string }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/hastech-icon.png" alt="" width={iconSize} height={iconSize} className="shrink-0" />
      <span className={textClassName}>{PLATFORM_NAME}</span>
    </span>
  );
}
