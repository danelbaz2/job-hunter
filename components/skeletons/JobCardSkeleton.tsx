import { Skeleton } from '@/components/ui/skeleton';

export function JobCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-md bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-5 w-5 rounded-sm" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-6 w-14 rounded-pill" />
      </div>
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-20 rounded-[6px]" />
        <Skeleton className="h-5 w-14 rounded-[6px]" />
      </div>
    </div>
  );
}
