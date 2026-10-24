import type { HTMLAttributes } from 'react'

/** v1's page width and padding: 640 px for forms, 1500 px for grids. */
export function PageContainer({
  className = '',
  wide = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { wide?: boolean }) {
  return (
    <div
      className={`mx-auto px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14 ${
        wide ? 'max-w-[1500px]' : 'max-w-[640px]'
      } ${className}`}
      {...props}
    />
  )
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-body text-sm font-medium tracking-[0.14em] text-text/45 uppercase">
      {children}
    </h2>
  )
}
