import { Skeleton } from '@/components/ui/skeleton';

function SectionSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div>
      <div className="mb-5 flex items-center gap-3 border-b border-border pb-2.5">
        <Skeleton className="h-6 w-1.5 rounded-pill" />
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" style={{ width: i === lines - 1 ? '70%' : undefined }} />
        ))}
      </div>
    </div>
  );
}

/** Mirrors JobDetailClient's real structure — capped header, then a 3-column grid at lg
 * (requirements | main | matches) that collapses to one column below it — so the swap
 * from skeleton to content never jumps to a different layout. */
export function JobDetailSkeleton() {
  return (
    <div>
      <div className="lg:mx-auto lg:max-w-[1040px]">
        <Skeleton className="mb-8 h-4 w-32" />

        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-4">
            <Skeleton className="h-14 w-14 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-7 w-3/4 max-w-72" />
              <Skeleton className="mt-2.5 h-4 w-40" />
            </div>
            <Skeleton className="hidden h-[116px] w-[116px] shrink-0 rounded-full sm:block" />
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Skeleton className="h-5 w-20 rounded-pill" />
            <Skeleton className="h-5 w-24 rounded-pill" />
            <Skeleton className="h-5 w-28 rounded-pill" />
          </div>

          <Skeleton className="h-12 w-full rounded-lg" />

          <div className="flex flex-wrap items-center gap-2.5">
            <Skeleton className="h-10 w-40 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-10 rounded-md" />
          </div>
        </div>
      </div>

      <div className="mt-14 grid grid-cols-1 items-start gap-y-14 lg:grid-cols-[320px_minmax(0,1fr)_380px] lg:gap-x-10 xl:gap-x-12">
        <div className="flex flex-col gap-14 lg:col-start-2 lg:row-start-1">
          <SectionSkeleton lines={4} />
          <SectionSkeleton lines={5} />
          <SectionSkeleton lines={2} />
        </div>
        <div className="lg:col-start-3 lg:row-start-1">
          <SectionSkeleton lines={3} />
        </div>
        <div className="lg:col-start-1 lg:row-start-1">
          <SectionSkeleton lines={3} />
        </div>
      </div>
    </div>
  );
}
