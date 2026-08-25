import { Skeleton } from '@/components/ui/skeleton';

export function SettingsSkeleton() {
  return (
    <div>
      <Skeleton className="mb-6 h-8 w-32" />
      <div className="mb-6 flex flex-col gap-3 rounded-md bg-surface p-4">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
      </div>
      <Skeleton className="h-9 w-28 rounded-pill" />
    </div>
  );
}
