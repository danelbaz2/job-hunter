import type { ReactNode } from 'react';

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-border py-16 text-center">
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-800 text-neutral-400">
          {icon}
        </div>
      )}
      <p className="text-base text-text/85">{title}</p>
      {description && <p className="max-w-sm text-sm text-text/60">{description}</p>}
      {action}
    </div>
  );
}
