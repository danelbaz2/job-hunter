import { Skeleton } from '@/components/ui/skeleton';

export function NavSkeleton() {
  return (
    <nav className="flex items-center gap-4 px-4 py-3 sm:px-6">
      <span className="mr-auto font-[family-name:var(--font-heading)] text-lg font-medium">
        Job<span className="text-accent-500">Hunter</span>
      </span>
      <Skeleton className="h-4 w-14" />
      <Skeleton className="hidden h-4 w-16 sm:block" />
      <Skeleton className="h-9 w-9 rounded-full" />
    </nav>
  );
}
