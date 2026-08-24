/** Inline Phosphor-outline-style icons (stroke-width ~1.75), per design handoff Assets note. */

type IconProps = { size?: number; className?: string };

export function BookmarkIcon({ size = 20, className, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill={filled ? 'currentColor' : 'none'} className={className}>
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

export function HouseIcon({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 21V8l8-5 8 5v13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 21v-8h6v8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GoogleIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.28-1.7 3.75-5.5 3.75-3.31 0-6.01-2.74-6.01-6.12S8.69 5.6 12 5.6c1.89 0 3.16.8 3.88 1.49l2.65-2.55C16.9 2.9 14.68 2 12 2 6.98 2 2.9 6.03 2.9 11.05S6.98 20.1 12 20.1c6.93 0 8.86-4.85 8.86-7.35 0-.5-.06-.88-.13-1.25H12z"
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
