import { Skeleton } from '@/components/ui/skeleton';
import { JobCardSkeleton } from './JobCardSkeleton';

export function ResultsGridSkeleton() {
  return (
    <div>
      <div className="mb-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-5 w-40" />
      </div>
      <div className="mb-6 flex justify-between">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-pill" />
          <Skeleton className="h-8 w-20 rounded-pill" />
        </div>
        <Skeleton className="h-8 w-40 rounded-md" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <JobCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
