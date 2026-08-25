import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-[6px] text-xs tracking-wide px-2.5 py-0.5',
  {
    variants: {
      variant: {
        accent: 'bg-accent-800 text-accent-100',
        neutral: 'bg-neutral-800 text-neutral-100',
        outline: 'border border-accent-500 text-accent-500',
      },
    },
    defaultVariants: { variant: 'neutral' },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
