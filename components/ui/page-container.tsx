import { cn } from '@/lib/utils';

export function PageContainer({
  className,
  wide = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { wide?: boolean }) {
  return (
    <div
      className={cn(
        'mx-auto px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14',
        wide ? 'max-w-[1500px]' : 'max-w-[640px]',
        className
      )}
      {...props}
    />
  );
}
