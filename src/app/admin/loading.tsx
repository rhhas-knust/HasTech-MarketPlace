import { KpiRowSkeleton, LoadingRegion, PageTitleSkeleton, Skeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingRegion label="Loading the console">
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-6 border-b border-(--color-border) pb-6">
          <PageTitleSkeleton />
          <Skeleton className="h-8 w-36" />
        </div>
        <KpiRowSkeleton />
        <TableSkeleton rows={5} />
      </div>
    </LoadingRegion>
  );
}
