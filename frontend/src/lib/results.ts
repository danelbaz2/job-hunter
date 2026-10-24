// Presentation rules for search results: score tiers, labels, dates, quote highlighting.

export type Tier = 'high' | 'mid' | 'low'

/** v1's score tiers (docs/design-v1/handoff/README.md): green 85+, amber 65-84, red below. */
export function tier(score: number): Tier {
  if (score >= 85) return 'high'
  if (score >= 65) return 'mid'
  return 'low'
}

const BOARD_LABELS: Record<string, string> = {
  drushim: 'Drushim',
  alljobs: 'AllJobs',
  jobnet: 'JobNet',
  ethosia: 'Ethosia',
  jobmaster: 'JobMaster',
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
}

export function boardLabel(board: string): string {
  return BOARD_LABELS[board] ?? board.charAt(0).toUpperCase() + board.slice(1)
}

/** "today", "yesterday", "5 days ago", "3 weeks ago"; null when the board gave no date. */
export function postedLabel(postedAt: string | null, today: Date = new Date()): string | null {
  if (!postedAt) return null
  const posted = Date.UTC(...ymd(postedAt))
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const days = Math.max(0, Math.round((now - posted) / 86_400_000))
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 14) return `${days} days ago`
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`
  return `${Math.floor(days / 30)} months ago`
}

function ymd(isoDate: string): [number, number, number] {
  const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number)
  return [y, m - 1, d]
}

export type Places = { region: string | null; places: string[] }

/**
 * A board's location string cut into places: "פתח תקווה, ראש העין" or
 * "מרכז - תל אביב, פתח תקווה" (a region, a dash, then the places).
 */
export function splitPlaces(location: string): Places {
  let region: string | null = null
  const pieces = location
    .split(',')
    .map((piece) => piece.trim())
    .filter(Boolean)
  const dash = pieces[0]?.match(/^(.+?)\s+[-\u2013]\s+(.+)$/)
  if (dash) {
    region = dash[1]
    pieces[0] = dash[2]
  }
  return { region, places: pieces }
}

/** The view-transition-name tying a result card to its detail header (a valid CSS ident). */
export function transitionName(listingId: string): string {
  return `job-${listingId.replace(/[^A-Za-z0-9_-]/g, '-')}`
}

export type Segment = {
  text: string
  /** Indexes, in the `quotes` given, of the quotes whose first occurrence starts here. */
  quotes: number[]
}

/**
 * The listing text cut into plain and quoted segments, so every quote a point relies on
 * is highlighted where it sits, and a point can link to its own highlight. Overlapping
 * quotes merge into one highlight.
 */
export function highlightQuotes(text: string, quotes: string[]): Segment[] {
  const ranges: { start: number; end: number; quotes: number[] }[] = []
  quotes.forEach((quote, index) => {
    if (!quote) return
    let first = true
    for (let at = text.indexOf(quote); at !== -1; at = text.indexOf(quote, at + 1)) {
      ranges.push({ start: at, end: at + quote.length, quotes: first ? [index] : [] })
      first = false
    }
  })
  ranges.sort((a, b) => a.start - b.start)
  const merged: typeof ranges = []
  for (const range of ranges) {
    const last = merged.at(-1)
    if (last && range.start <= last.end) {
      last.end = Math.max(last.end, range.end)
      last.quotes.push(...range.quotes)
    } else {
      merged.push({ ...range, quotes: [...range.quotes] })
    }
  }
  const segments: Segment[] = []
  let cursor = 0
  for (const { start, end, quotes: starting } of merged) {
    if (start > cursor) segments.push({ text: text.slice(cursor, start), quotes: [] })
    segments.push({ text: text.slice(start, end), quotes: starting.length ? starting : [-1] })
    cursor = end
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), quotes: [] })
  return segments
}

export function isQuoted(segment: Segment): boolean {
  return segment.quotes.length > 0
}

/** Right to left when the text's first letter is Hebrew, so a Hebrew listing reads as one. */
export function isRtl(text: string): boolean {
  const first = text.match(/[A-Za-z\u05d0-\u05ea]/)
  return first !== null && /[\u05d0-\u05ea]/.test(first[0])
}
