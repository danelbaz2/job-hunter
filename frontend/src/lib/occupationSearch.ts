import type { Taxonomy } from '../api/client'

// Same rules as the backend's jobhunter.text.normalize, so what the user types finds what
// the scoring matches: lowercase, one kind of quote mark, no niqqud, no gender suffix
// ("מפתח/ת" → "מפתח"), single spaces.
const GERSHAYIM = /[\u05f4\u201c\u201d]/g
const GERESH = /[\u05f3\u2018\u2019`]/g
const NIQQUD = /[\u0591-\u05c7]/g
const GENDER_SUFFIX = /(?<=[\u05d0-\u05ea])\/(?:ת|ה|ית|ות|יה)(?![\u05d0-\u05ea])/g

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(GERSHAYIM, '"')
    .replace(GERESH, "'")
    .replace(NIQQUD, '')
    .replace(GENDER_SUFFIX, '')
    .split(/\s+/)
    .filter(Boolean)
    .join(' ')
}

export function hasHebrew(text: string): boolean {
  return /[\u05d0-\u05ea]/.test(text)
}

export type Suggestion = {
  kind: 'family' | 'role'
  id: string
  en: string
  he: string
  /** For a role, the family it belongs to (English name). */
  familyEn?: string
  familyHe?: string
  /** Set when the query matched a synonym rather than a name, to show why it appears. */
  matchedSynonym?: string
}

type Entry = Suggestion & { names: string[]; synonyms: string[] }

export type OccupationIndex = Entry[]

export function buildIndex(taxonomy: Taxonomy): OccupationIndex {
  const entries: Entry[] = []
  for (const family of taxonomy.families) {
    entries.push({
      kind: 'family',
      id: family.id,
      en: family.en,
      he: family.he,
      names: [normalize(family.en), normalize(family.he)],
      synonyms: [],
    })
    for (const role of family.roles) {
      entries.push({
        kind: 'role',
        id: role.id,
        en: role.en,
        he: role.he,
        familyEn: family.en,
        familyHe: family.he,
        names: [normalize(role.en), normalize(role.he)],
        synonyms: role.synonyms,
      })
    }
  }
  return entries
}

// Lower ranks first: a name starting with the query beats a name containing it, which
// beats a synonym. Within a rank, families come before roles, then shorter names first.
const NAME_PREFIX = 0
const NAME_CONTAINS = 1
const SYNONYM_PREFIX = 2
const SYNONYM_CONTAINS = 3

function rank(entry: Entry, query: string): { rank: number; synonym?: string } | null {
  if (entry.names.some((name) => startsWithWord(name, query))) return { rank: NAME_PREFIX }
  if (entry.names.some((name) => name.includes(query))) return { rank: NAME_CONTAINS }
  let best: { rank: number; synonym?: string } | null = null
  for (const synonym of entry.synonyms) {
    const normalized = normalize(synonym)
    if (startsWithWord(normalized, query)) return { rank: SYNONYM_PREFIX, synonym }
    if (!best && normalized.includes(query)) best = { rank: SYNONYM_CONTAINS, synonym }
  }
  return best
}

/** True when one of the words of `text` starts with `query` ("dev" in "backend developer"). */
function startsWithWord(text: string, query: string): boolean {
  return text.startsWith(query) || text.includes(` ${query}`)
}

export function search(index: OccupationIndex, query: string, limit = 8): Suggestion[] {
  const q = normalize(query)
  if (!q) return []
  return index
    .map((entry) => ({ entry, match: rank(entry, q) }))
    .filter((hit): hit is { entry: Entry; match: NonNullable<ReturnType<typeof rank>> } =>
      hit.match !== null,
    )
    .sort(
      (a, b) =>
        a.match.rank - b.match.rank ||
        (a.entry.kind === b.entry.kind ? 0 : a.entry.kind === 'family' ? -1 : 1) ||
        a.entry.en.length - b.entry.en.length,
    )
    .slice(0, limit)
    .map(({ entry, match }) => {
      const { kind, id, en, he, familyEn, familyHe } = entry
      return { kind, id, en, he, familyEn, familyHe, matchedSynonym: match.synonym }
    })
}
