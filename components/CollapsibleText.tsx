'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1] as const;

export function CollapsibleText({ text, collapsedLines = 4 }: { text: string; collapsedLines?: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-10">
      <motion.div layout="size" transition={{ duration: 0.4, ease: EASE }} className="relative overflow-hidden">
        <p
          className={cn('whitespace-pre-line text-sm leading-relaxed text-text/85', !expanded && 'overflow-hidden')}
          style={!expanded ? { display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: collapsedLines } : undefined}
        >
          {text}
        </p>
        {!expanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-bg to-transparent" />
        )}
      </motion.div>
      <button
        type="button"
        className="mt-2 flex items-center gap-1 text-sm text-accent-400 hover:underline underline-offset-2"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? 'Show less' : 'Read more'}
        <ChevronDown size={14} className={cn('transition-transform duration-300', expanded && 'rotate-180')} />
      </button>
    </div>
  );
}
