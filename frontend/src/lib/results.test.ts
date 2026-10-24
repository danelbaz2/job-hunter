import { describe, expect, it } from 'vitest'
import {
  boardLabel,
  highlightQuotes,
  isQuoted,
  isRtl,
  postedLabel,
  splitPlaces,
  tier,
  transitionName,
} from './results'

describe('tier', () => {
  it('follows the v1 thresholds', () => {
    expect([100, 85, 84, 65, 64, 0].map(tier)).toEqual(['high', 'high', 'mid', 'mid', 'low', 'low'])
  })
})

describe('boardLabel', () => {
  it('names known boards and capitalizes unknown ones', () => {
    expect(boardLabel('alljobs')).toBe('AllJobs')
    expect(boardLabel('newboard')).toBe('Newboard')
  })
})

describe('postedLabel', () => {
  const today = new Date(2026, 9, 24)
  it('counts days, then weeks, then months', () => {
    expect(postedLabel('2026-10-24', today)).toBe('today')
    expect(postedLabel('2026-10-23', today)).toBe('yesterday')
    expect(postedLabel('2026-10-12', today)).toBe('12 days ago')
    expect(postedLabel('2026-09-14', today)).toBe('5 weeks ago')
    expect(postedLabel('2026-06-01', today)).toBe('4 months ago')
  })
  it('accepts full timestamps and says nothing without a date', () => {
    expect(postedLabel('2026-10-22T18:46:54.014Z', today)).toBe('2 days ago')
    expect(postedLabel(null, today)).toBeNull()
  })
})

describe('highlightQuotes', () => {
  const join = (text: string, quotes: string[]) =>
    highlightQuotes(text, quotes)
      .map((s) => (isQuoted(s) ? `[${s.text}]` : s.text))
      .join('')

  it('marks every quote where it sits, Hebrew included', () => {
    expect(join('מפתח/ת דאטה\nפתח תקווה\nSQL', ['פתח תקווה', 'מפתח/ת דאטה'])).toBe(
      '[מפתח/ת דאטה]\n[פתח תקווה]\nSQL',
    )
  })

  it('merges overlapping quotes and keeps the text whole', () => {
    const text = 'Requirements: 5+ years of experience. Python.'
    expect(join(text, ['5+ years of experience.', 'Requirements: 5+ years'])).toBe(
      '[Requirements: 5+ years of experience.] Python.',
    )
    expect(highlightQuotes(text, []).map((s) => s.text).join('')).toBe(text)
  })
})

describe('highlightQuotes anchors', () => {
  it('says which quotes start in each highlight, so points can link to them', () => {
    const text = 'Python. Requirements: 5+ years of experience. Tel Aviv'
    const segments = highlightQuotes(text, ['Tel Aviv', '5+ years of experience.', 'Requirements: 5+'])
    const marked = segments.filter(isQuoted)
    expect(marked.map((s) => s.quotes)).toEqual([[2, 1], [0]])
  })
})

describe('isRtl', () => {
  it('follows the first letter', () => {
    expect(isRtl('מפתח/ת Python בכיר/ה')).toBe(true)
    expect(isRtl('Python developer, תל אביב')).toBe(false)
    expect(isRtl('5+ שנות ניסיון')).toBe(true)
    expect(isRtl('')).toBe(false)
  })
})

describe('transitionName', () => {
  it('turns any listing id into a valid, stable CSS name', () => {
    expect(transitionName('drushim:12345')).toBe('job-drushim-12345')
    expect(transitionName('alljobs:https://x.co/a?b=1')).toMatch(/^job-[A-Za-z0-9_-]+$/)
  })
})

describe('splitPlaces', () => {
  it('splits the places, whatever the spacing around commas', () => {
    expect(splitPlaces('לוד , פתח תקווה , ראשון לציון , תל אביב יפו')).toEqual({
      region: null,
      places: ['לוד', 'פתח תקווה', 'ראשון לציון', 'תל אביב יפו'],
    })
  })
  it('takes a leading region off the first place', () => {
    expect(splitPlaces('מרכז - תל אביב, פתח תקווה, רמת גן וגבעתיים')).toEqual({
      region: 'מרכז',
      places: ['תל אביב', 'פתח תקווה', 'רמת גן וגבעתיים'],
    })
  })
  it('keeps a single place, a hyphenated name, or nothing', () => {
    expect(splitPlaces('לוד')).toEqual({ region: null, places: ['לוד'] })
    expect(splitPlaces('תל אביב-יפו')).toEqual({ region: null, places: ['תל אביב-יפו'] })
    expect(splitPlaces('  ')).toEqual({ region: null, places: [] })
  })
})
