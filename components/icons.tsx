/** Inline Phosphor-outline-style icons (stroke-width ~1.75), per design handoff Assets note. */

type IconProps = { size?: number; className?: string };

export function BookmarkIcon({ size = 20, className }: IconProps & { filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="none" className={className}>
      <path
        d="M184 32H72a8 8 0 0 0-8 8v176a8 8 0 0 0 12.31 6.74L128 181.7l51.69 41a8 8 0 0 0 12.31-6.7V40a8 8 0 0 0-8-8Z"
        stroke="currentColor"
        strokeWidth="14"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WarningIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="none" className={className}>
      <path
        d="m128 24 104 192H24Z"
        stroke="currentColor"
        strokeWidth="14"
        strokeLinejoin="round"
      />
      <line x1="128" y1="104" x2="128" y2="144" stroke="currentColor" strokeWidth="14" strokeLinecap="round" />
      <circle cx="128" cy="176" r="6" fill="currentColor" />
    </svg>
  );
}

export function ChevronLeftIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="none" className={className}>
      <polyline
        points="160,48 80,128 160,208"
        stroke="currentColor"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function UserIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="none" className={className}>
      <circle cx="128" cy="96" r="48" stroke="currentColor" strokeWidth="14" />
      <path
        d="M32 216c15-40 55-64 96-64s81 24 96 64"
        stroke="currentColor"
        strokeWidth="14"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ArrowUpRightIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="none" className={className}>
      <line x1="64" y1="192" x2="192" y2="64" stroke="currentColor" strokeWidth="14" strokeLinecap="round" />
      <polyline
        points="80,64 192,64 192,176"
        stroke="currentColor"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function UploadIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="none" className={className}>
      <polyline
        points="88,96 128,56 168,96"
        stroke="currentColor"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <line x1="128" y1="56" x2="128" y2="160" stroke="currentColor" strokeWidth="14" strokeLinecap="round" />
      <path
        d="M40 160v40a16 16 0 0 0 16 16h144a16 16 0 0 0 16-16v-40"
        stroke="currentColor"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
