import { KpiRowSkeleton, LoadingRegion, PageTitleSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingRegion label="Loading your dashboard">
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-(--color-border) pb-6">
          <div className="space-y-3">
            <PageTitleSkeleton />
            <Skeleton className="h-4 w-40" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-28" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="ml-auto h-4 w-20" />
            <Skeleton className="h-8 w-36" />
          </div>
        </div>
        <KpiRowSkeleton />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-72 lg:col-span-2" />
          <Skeleton className="h-72" />
        </div>
      </div>
    </LoadingRegion>
  );
}
