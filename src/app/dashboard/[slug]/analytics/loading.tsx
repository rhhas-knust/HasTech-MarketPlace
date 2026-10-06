import { KpiRowSkeleton, LoadingRegion, PageTitleSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingRegion label="Loading analytics">
      <div className="space-y-6">
        <PageTitleSkeleton />
        <KpiRowSkeleton />
        <Skeleton className="h-80" />
      </div>
    </LoadingRegion>
  );
}
