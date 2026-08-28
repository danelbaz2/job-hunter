import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Banner({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'inline-flex w-fit max-w-full items-start gap-2.5 rounded-md border border-tier-mid-border bg-tier-mid-bg px-3 py-2.5 text-sm text-text/90',
        className
      )}
    >
      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-tier-mid-text" />
      <span>{children}</span>
    </div>
  );
}
