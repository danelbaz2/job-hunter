'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Collapse } from '@/components/motion/Collapse';
import { cn } from '@/lib/utils';

export function CollapsibleList({
  items,
  collapsedCount = 4,
  listClassName,
}: {
  items: string[];
  collapsedCount?: number;
  listClassName?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = items.slice(0, collapsedCount);
  const rest = items.slice(collapsedCount);
  const hasMore = rest.length > 0;

  return (
    <div className="mb-10">
      <ul className={cn('flex flex-col gap-1.5 text-sm text-text/85', listClassName)}>
        {visible.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
      {hasMore && (
        <Collapse open={expanded}>
          <ul className={cn('flex flex-col gap-1.5 pt-1.5 text-sm text-text/85', listClassName)}>
            {rest.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </Collapse>
      )}
      {hasMore && (
        <button
          type="button"
          className="mt-2 flex items-center gap-1 text-sm text-accent-400 hover:underline"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Show less' : `Read more (${rest.length} more)`}
          <ChevronDown size={14} className={cn('transition-transform duration-300', expanded && 'rotate-180')} />
        </button>
      )}
    </div>
  );
}
