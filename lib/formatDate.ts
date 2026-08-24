/** Apify actors sometimes return unparseable/relative date strings (e.g. "3 days ago")
 *  instead of a real timestamp — treat those as unknown rather than an Invalid Date. */
export function parseDateOrNull(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function daysAgoLabel(postedAt: string | null): string {
  const date = parseDateOrNull(postedAt);
  if (!date) return 'posting date unknown';
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return 'posted today';
  if (days === 1) return 'posted 1 day ago';
  return `posted ${days} days ago`;
}
