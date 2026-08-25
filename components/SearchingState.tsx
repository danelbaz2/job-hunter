'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, AlertTriangle } from 'lucide-react';
import { useNavVisibility } from '@/components/NavVisibility';
import { cn } from '@/lib/utils';
import { SOURCE_LABELS, SOURCES, type SourceProgress } from '@/types/domain';

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Only ever shows the two "still working" states — badges while sources report in,
 * then a single "Scoring fit…" pill once they're all done — and stays on the second
 * state for as long as it takes the real data to arrive. The parent navigates directly
 * from here straight to the results route once it has somewhere to go; there is no
 * separate skeleton stage in between (see feedback: no intermediate screen).
 */
export function SearchingState({ sourceProgress }: { sourceProgress: SourceProgress }) {
  const { setHidden } = useNavVisibility();
  useEffect(() => {
    setHidden(true);
    return () => setHidden(false);
  }, [setHidden]);

  const rows = SOURCES.map((source) => ({ key: source, label: SOURCE_LABELS[source], status: sourceProgress[source] }));
  const allSourcesDone = rows.every((r) => r.status !== 'pending');
  const phase: 'sourcing' | 'scoring' = allSourcesDone ? 'scoring' : 'sourcing';

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <h1 className="text-shimmer text-3xl sm:text-4xl">Searching for your next role…</h1>

      <AnimatePresence mode="wait">
        {phase === 'sourcing' && (
          <motion.div
            key="badges"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="flex flex-wrap items-center justify-center gap-2.5"
          >
            {rows.map((row) => (
              <span
                key={row.key}
                className={cn(
                  'flex items-center gap-2 rounded-pill border px-4 py-2 text-sm transition-colors duration-300',
                  row.status === 'ok' && 'border-tier-high-border bg-tier-high-bg text-tier-high-text',
                  row.status === 'failed' && 'border-tier-mid-border bg-tier-mid-bg text-tier-mid-text',
                  row.status === 'pending' && 'border-border text-text/50'
                )}
              >
                {row.status === 'ok' && <Check size={14} />}
                {row.status === 'failed' && <AlertTriangle size={14} />}
                {row.label}
              </span>
            ))}
          </motion.div>
        )}

        {phase === 'scoring' && (
          <motion.div
            key="scoring-fit"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="rounded-pill border border-accent-500 bg-accent-500/10 px-6 py-3 text-base text-accent-200"
            style={{ animation: 'glow-pulse 2.4s ease-in-out infinite' }}
          >
            <span className="text-shimmer">Scoring fit…</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
