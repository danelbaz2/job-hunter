import { MapPin } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { isRtl, splitPlaces } from '../../lib/results'

/**
 * The listing's location: the first place, then "+N" when there are more. The full list
 * shows while the mouse is over it and hides when it leaves; on a phone (no hover) a tap
 * opens it and a tap elsewhere closes it.
 */
export function LocationChip({ location }: { location: string }) {
  const { region, places } = splitPlaces(location)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  // With a mouse, hover alone opens and closes the list; a click must not toggle it.
  const pointerType = useRef('')
  const listId = useId()
  const more = places.length - 1

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('click', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!places.length) {
    return (
      <span className={CHIP}>
        <MapPin size={15} aria-hidden="true" className="shrink-0 text-accent-400" />
        <span className="text-text/50">Location not given</span>
      </span>
    )
  }
  if (!more) {
    return (
      <span className={CHIP}>
        <MapPin size={15} aria-hidden="true" className="shrink-0 text-accent-400" />
        <span dir="auto">{places[0]}</span>
      </span>
    )
  }

  return (
    <div
      ref={rootRef}
      className="relative"
      onPointerEnter={(e) => e.pointerType === 'mouse' && setOpen(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${places[0]} and ${more} more places`}
        onPointerDown={(e) => (pointerType.current = e.pointerType)}
        onClick={() => pointerType.current !== 'mouse' && setOpen((o) => !o)}
        className={`${CHIP} ${INTERACTIVE}`}
      >
        <MapPin size={15} aria-hidden="true" className="shrink-0 text-accent-400" />
        <span dir="auto">{places[0]}</span>
        <span className="font-medium text-accent-300">+{more}</span>
      </button>

      {open && (
        // pt-2 instead of a margin: the gap stays inside the hover area, so moving the
        // mouse from the chip to the list doesn't close it.
        <div className="absolute start-0 top-full z-30 pt-2">
          <div
            id={listId}
            className="w-64 animate-fade-in rounded-lg border border-border bg-surface-raised p-2 shadow-lg"
            dir={isRtl(places[0]) ? 'rtl' : 'ltr'}
          >
            {region && (
              <p className="px-2.5 pt-1 pb-2 text-xs font-medium tracking-[0.12em] text-text/45 uppercase">
                {region}
              </p>
            )}
            <ul className="max-h-64 overflow-y-auto overscroll-contain">
              {places.map((place) => (
                <li
                  key={place}
                  className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-text/85"
                >
                  <MapPin size={13} aria-hidden="true" className="shrink-0 text-text/40" />
                  {place}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export const CHIP = 'inline-flex min-h-11 items-center gap-1.5 text-sm text-text/70'
export const INTERACTIVE = 'cursor-pointer transition-colors hover:text-text'
