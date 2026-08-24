/**
 * Some actors (Drushim, AllJobs) return `requirements` as a single free-text string rather
 * than an array — real dataset output showed this only after checking the actor's actual
 * output (not just its documented input schema). Newline-separated first; if the source
 * flattened everything onto one line, fall back to splitting on " - " bullet separators.
 */
export function splitRequirementsText(text: string | null | undefined): string[] {
  if (!text) return [];

  let parts = text
    .split(/\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length <= 1) {
    parts = text
      .split(/\s-\s/)
      .map((p) => p.trim())
      .filter(Boolean);
  }

  return parts.filter((p) => p.length > 1);
}

/** Indeed/LinkedIn embed requirements as <li> bullets inside their HTML description — pull those out directly instead of guessing at a structured field that doesn't exist. */
export function extractListItems(html: string | null | undefined): string[] {
  if (!html) return [];
  const matches = [...html.matchAll(/<li[^>]*>(.*?)<\/li>/gis)];
  return matches
    .map((m) => m[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim())
    .filter((t) => t.length > 1);
}
