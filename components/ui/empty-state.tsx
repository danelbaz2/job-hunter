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
    <div className="flex flex-col items-center gap-3 rounded-lg border border-border py-16 text-center">
      {icon && <div className="text-neutral-500">{icon}</div>}
      <p className="text-base text-text/85">{title}</p>
      {description && <p className="max-w-sm text-sm text-text/60">{description}</p>}
      {action}
    </div>
  );
}
