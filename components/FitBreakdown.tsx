import { AlertTriangle } from 'lucide-react';
import { RadialMeter } from '@/components/ui/radial-meter';
import type { SearchResultItem } from '@/types/domain';

export function FitBreakdown({ job }: { job: SearchResultItem }) {
  return (
    <div>
      <div className="flex flex-wrap gap-6 sm:gap-8">
        <RadialMeter label="Location" value={job.locationScore} delay={0} />
        <RadialMeter label="Domain" value={job.domainScore} delay={0.06} />
        <RadialMeter label="Seniority" value={job.seniorityScore} delay={0.12} />
        {job.skillsScore !== null && <RadialMeter label="Skills fit" value={job.skillsScore} delay={0.18} />}
      </div>
      {job.skillsScore === null && (
        <div className="mt-4 flex items-start gap-2 text-sm text-text/60">
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
