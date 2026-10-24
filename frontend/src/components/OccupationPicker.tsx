import { useQuery } from '@tanstack/react-query'
import { useId, useMemo, useState } from 'react'
import { api } from '../api/client'
import { buildIndex, hasHebrew, normalize, search, type Suggestion } from '../lib/occupationSearch'

export type OccupationPick =
  | { kind: 'family' | 'role'; id: string; label: string }
  | { kind: 'free'; text: string; label: string }

type Option =
  | { kind: 'suggestion'; suggestion: Suggestion; hebrew: boolean }
  | { kind: 'free'; text: string }

/**
 * Occupation search bar (SPEC criterion 28): suggestions on every keystroke, filtered in
 * the browser from the cached taxonomy, in English or Hebrew, from synonyms too. Text that
 * matches nothing can still be added as a free-text occupation.
 */
export function OccupationPicker({
  value,
  onChange,
}: {
  value: OccupationPick[]
  onChange: (picks: OccupationPick[]) => void
}) {
  const taxonomy = useQuery({
    queryKey: ['occupations'],
    queryFn: api.occupations,
    staleTime: Infinity,
  })
  const index = useMemo(() => (taxonomy.data ? buildIndex(taxonomy.data) : []), [taxonomy.data])

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const listId = useId()
  const inputId = useId()

  const options = useMemo<Option[]>(() => {
    const trimmed = query.trim()
    if (!trimmed) return []
    const hebrew = hasHebrew(trimmed)
    const picked = new Set(value.map((p) => (p.kind === 'free' ? `free:${normalize(p.text)}` : p.id)))
    const suggestions: Option[] = search(index, trimmed)
      .filter((s) => !picked.has(s.id))
      .map((suggestion) => ({ kind: 'suggestion', suggestion, hebrew }))
    const free: Option[] = picked.has(`free:${normalize(trimmed)}`)
      ? []
      : [{ kind: 'free', text: trimmed }]
    return [...suggestions, ...free]
  }, [query, index, value])

  function choose(option: Option) {
    const pick: OccupationPick =
      option.kind === 'free'
        ? { kind: 'free', text: option.text, label: option.text }
        : {
            kind: option.suggestion.kind,
            id: option.suggestion.id,
            label: option.hebrew ? option.suggestion.he : option.suggestion.en,
          }
    onChange([...value, pick])
    setQuery('')
    setActive(0)
  }

  function remove(i: number) {
    onChange(value.filter((_, j) => j !== i))
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' && options.length) {
      e.preventDefault()
      setOpen(true)
      setActive((a) => (a + 1) % options.length)
    } else if (e.key === 'ArrowUp' && options.length) {
      e.preventDefault()
      setActive((a) => (a - 1 + options.length) % options.length)
    } else if (e.key === 'Enter' && open && options[active]) {
      e.preventDefault()
      choose(options[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    } else if (e.key === 'Backspace' && !query && value.length) {
      remove(value.length - 1)
    }
  }

  const expanded = open && options.length > 0

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium">
        Occupation
      </label>

      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Chosen occupations">
          {value.map((pick, i) => (
            <li key={pick.kind === 'free' ? `free:${pick.text}` : pick.id}>
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remove ${pick.label}`}
                className="flex min-h-11 items-center gap-2 rounded-full border border-line px-3 text-sm"
                dir="auto"
              >
                <span>{pick.label}</span>
                {pick.kind === 'family' && <span className="text-xs text-muted">all roles</span>}
                {pick.kind === 'free' && <span className="text-xs text-muted">free text</span>}
                <span aria-hidden="true" className="text-muted">
                  ×
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={expanded ? `${listId}-${active}` : undefined}
          autoComplete="off"
          dir="auto"
          placeholder="e.g. Backend developer, רואה חשבון, nurse…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          // 16px text keeps iOS from zooming into the field.
          className="min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-base outline-none focus:border-accent"
        />

        {expanded && (
          <ul
            id={listId}
            role="listbox"
            className="absolute inset-x-0 top-full z-10 mt-1 max-h-80 overflow-y-auto rounded-lg border border-line bg-surface shadow-lg"
          >
            {options.map((option, i) => (
              <li
                key={option.kind === 'free' ? 'free' : option.suggestion.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                // mousedown, not click: the input's blur would close the list first.
                onMouseDown={(e) => {
                  e.preventDefault()
                  choose(option)
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex min-h-11 cursor-pointer flex-col justify-center px-3 py-2 ${
                  i === active ? 'bg-accent/10' : ''
                }`}
              >
                <OptionContent option={option} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {taxonomy.isError && (
        <p className="text-sm text-red-600" role="status">
          Couldn't load the occupation list. You can still type an occupation and add it as
          free text.
        </p>
      )}
    </div>
  )
}

function OptionContent({ option }: { option: Option }) {
  if (option.kind === 'free') {
    return (
      <span dir="auto">
        Search for “{option.text}” <span className="text-xs text-muted">as free text</span>
      </span>
    )
  }
  const { suggestion: s, hebrew } = option
  const [primary, secondary] = hebrew ? [s.he, s.en] : [s.en, s.he]
  const family = hebrew ? s.familyHe : s.familyEn
  return (
    <>
      <span dir="auto">
        {primary}
        {s.kind === 'family' && <span className="ms-2 text-xs text-muted">all roles</span>}
      </span>
      <span className="text-xs text-muted" dir="auto">
        {secondary}
        {family && ` · ${family}`}
        {s.matchedSynonym && ` · matches “${s.matchedSynonym}”`}
      </span>
    </>
  )
}
