import { AlertTriangle } from 'lucide-react';
import { Meter } from '@/components/ui/meter';
import type { SearchResultItem } from '@/types/domain';

export function FitBreakdown({ job }: { job: SearchResultItem }) {
  return (
    <div>
      <Meter label="Location" value={job.locationScore} />
      <Meter label="Domain" value={job.domainScore} />
      <Meter label="Seniority" value={job.seniorityScore} />
      {job.skillsScore !== null ? (
        <Meter label="Skills fit" value={job.skillsScore} />
      ) : (
        <div className="mt-2 flex items-start gap-2 text-sm text-text/60">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-tier-mid-text" />
          <span>
            Skills-fit scoring was unavailable for this listing (the AI call failed) — no score is
            shown rather than a guessed one.
          </span>
        </div>
      )}
    </div>
  );
}
