'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, AlertTriangle, RotateCw } from 'lucide-react';
import { useNavVisibility } from '@/components/NavVisibility';
import { cn } from '@/lib/utils';
import { SOURCE_LABELS, SOURCES, type SourceProgress, type SearchLogEntry } from '@/types/domain';

const EASE = [0.16, 1, 0.3, 1] as const;

const LOG_COLOR: Record<SearchLogEntry['level'], string> = {
  info: 'text-text/55',
  success: 'text-tier-high-text',
  warn: 'text-tier-low-text',
  error: 'text-tier-mid-text',
};

/**
 * The "still working" screen: a live badge per source while they report in (all four run
 * at once, so they start together and settle on their own beat), then a "Scoring fit…"
 * pill once they're all done. The badges stay visible through scoring so the run's outcome
 * — which sources succeeded, which failed — is readable the whole time.
 *
 * `logs` is populated only by the demo failure scenario; when present it renders a
 * terminal-style activity log so a viewer can follow exactly what the pipeline is doing.
 */
export function SearchingState({
  sourceProgress,
  retryAttempts,
  logs = [],
}: {
  sourceProgress: SourceProgress;
  retryAttempts?: Partial<Record<string, number>>;
  logs?: SearchLogEntry[];
}) {
  const { setHidden } = useNavVisibility();
  useEffect(() => {
    setHidden(true);
    return () => setHidden(false);
  }, [setHidden]);

  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [logs.length]);

  const rows = SOURCES.map((source) => ({
    key: source,
    label: SOURCE_LABELS[source],
    status: sourceProgress[source],
    retry: retryAttempts?.[source] ?? 0,
  }));
  // A source mid-retry is still working — only 'ok'/'failed' count as settled.
  const settled = rows.filter((r) => r.status === 'ok' || r.status === 'failed').length;
  const phase: 'sourcing' | 'scoring' = settled === rows.length ? 'scoring' : 'sourcing';

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <div className="space-y-2">
        <h1 className="text-shimmer text-3xl tracking-tight sm:text-4xl">Searching for your next role…</h1>
        <p className="text-sm text-text/45">
          {phase === 'sourcing'
            ? `Querying ${rows.length} Israeli job boards in parallel · ${settled}/${rows.length} done`
            : `${settled}/${rows.length} sources reported · scoring your fit`}
        </p>
      </div>

      <div
        className={cn(
          'flex flex-wrap items-center justify-center gap-2.5 transition-opacity duration-300',
          phase === 'scoring' && 'opacity-70'
        )}
      >
        {rows.map((row) => (
          <span
            key={row.key}
            className={cn(
              'flex items-center gap-2 rounded-pill border px-4 py-2 text-sm transition-colors duration-300',
              row.status === 'ok' && 'border-tier-high-border bg-tier-high-bg text-tier-high-text',
              row.status === 'failed' && 'border-tier-mid-border bg-tier-mid-bg text-tier-mid-text',
              row.status === 'retrying' && 'border-tier-low-border bg-tier-low-bg text-tier-low-text',
              row.status === 'pending' && 'border-border text-text/60'
            )}
          >
            {row.status === 'ok' && <Check size={14} />}
            {row.status === 'failed' && <AlertTriangle size={14} />}
            {row.status === 'retrying' && <RotateCw size={14} className="animate-spin" />}
            {row.status === 'pending' && (
              <span className="size-1.5 animate-pulse rounded-full bg-current opacity-60" />
            )}
            {row.label}
            {row.status === 'retrying' && (
              <span className="tabular-nums opacity-80">· retrying {row.retry}/2</span>
            )}
          </span>
        ))}
      </div>

      <AnimatePresence>
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

      {logs.length > 0 && (
        <div
          ref={logRef}
          className="mt-2 max-h-56 w-full max-w-xl overflow-y-auto rounded-lg border border-border bg-surface/50 p-4 text-left font-mono text-xs leading-relaxed"
        >
          {logs.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className={cn('flex gap-2', LOG_COLOR[entry.level])}
            >
              <span className="shrink-0 text-text/30">
                {new Date(entry.at).toLocaleTimeString([], { hour12: false })}
              </span>
              <span>{entry.message}</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
