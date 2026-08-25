'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Collapse } from '@/components/motion/Collapse';
import { cn } from '@/lib/utils';
import type { MatchPoint } from '@/types/domain';

/**
 * Every point shows its source quote (README/SPEC.md non-negotiable): the API only ever
 * stores points whose quote verified as a verbatim substring of the listing text, so this
 * component can trust what it renders.
 */
function List({ title, points }: { title: string; points: MatchPoint[] }) {
  return (
    <div className="mb-4">
      <div className="mb-2 text-xs uppercase tracking-wide text-text/50">
        {title} — {points.length}
      </div>
      {points.map((p, i) => (
        <div key={i} className="mb-3 rounded-md bg-surface p-3">
          <div className="text-sm text-text/90">{p.text}</div>
          <div className="mt-1.5 text-xs italic text-text/50">From listing: &quot;{p.quote}&quot;</div>
        </div>
      ))}
    </div>
  );
}

export function MatchedGapList({ matched, gaps }: { matched: MatchPoint[]; gaps: MatchPoint[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2.5 text-sm"
        onClick={() => setExpanded((v) => !v)}
      >
        <span>
          {matched.length} matched · {gaps.length} gaps
        </span>
        <ChevronDown size={16} className={cn('transition-transform duration-300', expanded && 'rotate-180')} />
      </button>

      <Collapse open={expanded}>
        <div className="pt-3">
          <List title="Matched" points={matched} />
          <List title="Gaps" points={gaps} />
        </div>
      </Collapse>
    </div>
  );
}
