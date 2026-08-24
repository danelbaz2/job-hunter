export function daysAgoLabel(postedAt: string | null): string {
  if (!postedAt) return 'posting date unknown';
  const days = Math.floor((Date.now() - new Date(postedAt).getTime()) / 86_400_000);
  if (days <= 0) return 'posted today';
  if (days === 1) return 'posted 1 day ago';
  return `posted ${days} days ago`;
}
