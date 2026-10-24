import { useQuery } from '@tanstack/react-query'
import { Check, Plus, Search, X } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
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
  const rootRef = useRef<HTMLDivElement>(null)

  // The list closes only on a deliberate tap outside the picker. Not on blur: on a phone,
  // closing the keyboard blurs the field. Not on pointerdown: a finger starting to scroll
  // the page fires it. The browser fires `click` only for a real tap, never for a scroll.
  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [open])

  // Picked items stay in the list, marked as selected, so tapping one again unselects it.
  const options = useMemo<Option[]>(() => {
    const trimmed = query.trim()
    if (!trimmed) return []
    const hebrew = hasHebrew(trimmed)
    const suggestions: Option[] = search(index, trimmed).map((suggestion) => ({
      kind: 'suggestion',
      suggestion,
      hebrew,
    }))
    return [...suggestions, { kind: 'free', text: trimmed }]
  }, [query, index])

  const pickedKeys = useMemo(() => new Set(value.map(pickKey)), [value])

  function toggle(option: Option) {
    const key = optionKey(option)
    if (pickedKeys.has(key)) {
      onChange(value.filter((pick) => pickKey(pick) !== key))
      return
    }
    const pick: OccupationPick =
      option.kind === 'free'
        ? { kind: 'free', text: option.text, label: option.text }
        : {
            kind: option.suggestion.kind,
            id: option.suggestion.id,
            label: option.hebrew ? option.suggestion.he : option.suggestion.en,
          }
    // The query and the list stay, so several occupations can be picked in a row.
    onChange([...value, pick])
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
      toggle(options[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    } else if (e.key === 'Backspace' && !query && value.length) {
      remove(value.length - 1)
    }
  }

  const expanded = open && options.length > 0

  return (
    <div
      ref={rootRef}
      className="space-y-3"
      onBlur={(e) => {
        // Tab to another field closes the list. A blur with no next focus (the phone
        // keyboard closing) leaves it open.
        const next = e.relatedTarget
        if (next && !e.currentTarget.contains(next)) setOpen(false)
      }}
    >
      <label htmlFor={inputId} className="sr-only">
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
                className="flex min-h-11 items-center gap-2 rounded-pill border border-accent-500 bg-accent-500/12 ps-4 pe-3 text-base text-accent-300 transition-colors hover:bg-accent-500/20"
                dir="auto"
              >
                <span>{pick.label}</span>
                {pick.kind === 'family' && <span className="text-xs text-accent-300/70">all roles</span>}
                {pick.kind === 'free' && <span className="text-xs text-accent-300/70">free text</span>}
                <X size={15} aria-hidden="true" className="text-accent-300/80" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <Search
          size={18}
          strokeWidth={1.75}
          aria-hidden="true"
          className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-neutral-500"
        />
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
          placeholder="Backend developer, רואה חשבון, nurse…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          // 16px text keeps iOS from zooming into the field.
          className="min-h-12 w-full rounded-lg border border-border bg-transparent ps-11 pe-12 text-[16px] text-text caret-accent-500 transition-colors placeholder:text-neutral-500 hover:border-text/45 focus:border-accent-500 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setActive(0)
            }}
            aria-label="Clear the search text"
            className="absolute end-0.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md text-neutral-500 transition-colors hover:text-text"
          >
            <X size={17} aria-hidden="true" />
          </button>
        )}

        {expanded && (
          <ul
            id={listId}
            role="listbox"
            aria-multiselectable="true"
            className="absolute inset-x-0 top-full z-20 mt-2 max-h-80 animate-fade-in overflow-y-auto overscroll-contain rounded-lg border border-border bg-surface p-1.5 shadow-md"
          >
            {options.map((option, i) => {
              const selected = pickedKeys.has(optionKey(option))
              return (
                <li
                  key={optionKey(option)}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={selected}
                  // mousedown, not click: keeps focus in the field on desktop.
                  onMouseDown={(e) => {
                    e.preventDefault()
                    toggle(option)
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                    selected ? 'bg-accent-500/12' : ''
                  } ${i === active ? (selected ? 'bg-accent-500/18' : 'bg-text/7') : ''}`}
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <OptionContent option={option} selected={selected} />
                  </div>
                  {selected && (
                    <Check size={18} aria-hidden="true" className="shrink-0 text-accent-400" />
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {taxonomy.isError && (
        <p
          className="rounded-lg border border-tier-low-border bg-tier-low-bg px-4 py-3 text-sm text-tier-low-text"
          role="status"
        >
          Couldn&apos;t load the occupation list. You can still type an occupation and add it as
          free text.
        </p>
      )}
    </div>
  )
}

function pickKey(pick: OccupationPick): string {
  return pick.kind === 'free' ? `free:${normalize(pick.text)}` : pick.id
}

function optionKey(option: Option): string {
  return option.kind === 'free' ? `free:${normalize(option.text)}` : option.suggestion.id
}

function OptionContent({ option, selected }: { option: Option; selected: boolean }) {
  if (option.kind === 'free') {
    return (
      <span
        className={`flex items-center gap-2 text-base ${selected ? 'text-accent-300' : 'text-text/85'}`}
        dir="auto"
      >
        {!selected && <Plus size={16} aria-hidden="true" className="shrink-0 text-accent-400" />}
        <span>
          {selected ? `“${option.text}”` : `Add “${option.text}”`}{' '}
          <span className="text-sm text-text/45">as free text</span>
        </span>
      </span>
    )
  }
  const { suggestion: s, hebrew } = option
  const [primary, secondary] = hebrew ? [s.he, s.en] : [s.en, s.he]
  const family = hebrew ? s.familyHe : s.familyEn
  return (
    <>
      <span
        className={`flex items-center gap-2 text-base ${selected ? 'text-accent-300' : 'text-text'}`}
        dir="auto"
      >
        {primary}
        {s.kind === 'family' && (
          <span className="rounded-pill border border-accent-500/50 px-2 py-0.5 text-xs text-accent-300">
            all roles
          </span>
        )}
      </span>
      <span className="text-sm text-text/50" dir="auto">
        {secondary}
        {family && ` · ${family}`}
        {s.matchedSynonym && ` · matches “${s.matchedSynonym}”`}
      </span>
    </>
  )
}
