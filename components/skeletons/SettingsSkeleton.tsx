import { Skeleton } from '@/components/ui/skeleton';

function SectionSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div>
      <div className="mb-5 flex items-center gap-3 border-b border-border pb-2.5">
        <Skeleton className="h-6 w-1.5 rounded-pill" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="flex flex-col gap-3.5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div>
      <Skeleton className="mb-12 h-9 w-40" />
      <div className="flex flex-col gap-14">
        <SectionSkeleton rows={2} />
        <SectionSkeleton rows={6} />
        <div>
          <div className="mb-5 flex items-center gap-3 border-b border-border pb-2.5">
            <Skeleton className="h-6 w-1.5 rounded-pill" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-9 w-28 rounded-pill" />
        </div>
      </div>
    </div>
  );
}
