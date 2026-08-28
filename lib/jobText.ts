/**
 * Source actors return `description` and `requirements` as separate fields, but
 * `description` is frequently the whole posting body — including the same requirement
 * bullets that also come back structured in `requirements` (confirmed on real AllJobs/
 * Drushim/Indeed/LinkedIn output). Rendered as-is, the job-detail page showed every
 * requirement twice: once buried in prose, once again in its own bulleted section.
 *
 * This only reshapes what's *displayed* — `rawText` (description + requirements, stored
 * verbatim) is left untouched, since AI-matched quotes are verified as substrings of it;
 * trimming that would risk breaking quote verification for text inside the removed lines.
 */
function normalizeLine(line: string): string {
  return line
    .trim()
    .replace(/^[-•*•●–]\s*/, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/** `description` with any line that's an (near-)exact duplicate of a `requirements`
 * bullet removed, so the narrative text and the Requirements section don't repeat the
 * same line twice. Conservative on purpose: only drops a line that matches a whole
 * requirement, never rewrites or shortens surrounding prose. */
const DANGLING_HEADING = /^(requirements?|qualifications?|what you('ll| will) need|must[ -]haves?)\s*:?\s*$/i;

export function dedupeDescription(description: string, requirements: string[]): string {
  if (!description || requirements.length === 0) return description;

  const reqLines = new Set(requirements.map(normalizeLine).filter(Boolean));
  if (reqLines.size === 0) return description;

  let lines = description.split(/\r?\n/).filter((line) => {
    const norm = normalizeLine(line);
    return !norm || !reqLines.has(norm);
  });

  // A heading whose whole bulleted list just got removed above now dangles with
  // nothing under it (e.g. "Requirements:" immediately followed by a blank line or
  // the end of the text) — drop those too, rather than leave an empty label behind.
  lines = lines.filter((line, i) => {
    if (!DANGLING_HEADING.test(line.trim())) return true;
    const next = lines[i + 1]?.trim();
    return !(next === undefined || next === '');
  });

  return lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
