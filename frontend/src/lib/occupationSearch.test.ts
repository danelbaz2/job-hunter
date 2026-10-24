import { describe, expect, it } from 'vitest'
import type { Taxonomy } from '../api/client'
import { buildIndex, normalize, search } from './occupationSearch'

const taxonomy: Taxonomy = {
  version: 1,
  families: [
    {
      id: 'software',
      en: 'Software Development',
      he: 'פיתוח תוכנה',
      roles: [
        {
          id: 'backend-developer',
          en: 'Backend Developer',
          he: 'מפתח בקאנד',
          synonyms: ['server side', 'צד שרת'],
          generic: false,
        },
        {
          id: 'frontend-developer',
          en: 'Frontend Developer',
          he: 'מפתח פרונטאנד',
          synonyms: [],
          generic: false,
        },
      ],
    },
    {
      id: 'finance',
      en: 'Finance & Accounting',
      he: 'כספים וחשבונאות',
      roles: [
        {
          id: 'accountant',
          en: 'Accountant',
          he: 'רואה חשבון',
          synonyms: ['cpa', 'רו"ח'],
          generic: false,
        },
      ],
    },
  ],
}
const index = buildIndex(taxonomy)
const ids = (query: string) => search(index, query).map((s) => s.id)

describe('normalize', () => {
  it('matches the backend rules', () => {
    expect(normalize('  Backend   DEVELOPER ')).toBe('backend developer')
    expect(normalize('מפתח/ת בקאנד')).toBe('מפתח בקאנד')
    expect(normalize('רו״ח')).toBe('רו"ח')
  })
})

describe('search', () => {
  it('suggests nothing for an empty query', () => {
    expect(search(index, '   ')).toEqual([])
  })

  it('finds families and roles from the start of any word, in English', () => {
    expect(ids('dev')).toEqual(['software', 'backend-developer', 'frontend-developer'])
  })

  it('finds roles in Hebrew, gender slash included', () => {
    expect(ids('מפתח/ת בק')).toEqual(['backend-developer'])
  })

  it('finds a role from a synonym and says which one matched', () => {
    const [hit] = search(index, 'צד ש')
    expect(hit.id).toBe('backend-developer')
    expect(hit.matchedSynonym).toBe('צד שרת')
  })

  it('finds Hebrew abbreviations whatever the quote mark', () => {
    expect(ids('רו״ח')).toEqual(['accountant'])
  })

  it('puts a family before its roles at the same rank', () => {
    expect(ids('so')[0]).toBe('software')
  })

  it('ranks name matches above synonym matches', () => {
    // "cpa" is only a synonym; "acc" starts the name.
    expect(ids('acc')).toEqual(['finance', 'accountant'])
    expect(search(index, 'cpa')[0].matchedSynonym).toBe('cpa')
  })

  it('respects the limit', () => {
    expect(search(index, 'e', 2)).toHaveLength(2)
  })
})
