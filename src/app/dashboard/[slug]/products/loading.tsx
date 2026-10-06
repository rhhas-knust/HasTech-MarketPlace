import { LoadingRegion, PageTitleSkeleton, Skeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingRegion label="Loading products">
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <PageTitleSkeleton />
          <Skeleton className="h-10 w-32" />
        </div>
        <TableSkeleton />
      </div>
    </LoadingRegion>
  );
}
