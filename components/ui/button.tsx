import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Nocturne says the primary action is an accent outline, never a fill — kept here as
 * "outline". The one deliberate exception (ui-refactor-plan.md §3.2) is "solid": the
 * single main CTA per view, which gets a solid accent fill so it doesn't compete
 * visually with the outline/ghost controls around it.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium text-sm transition-colors disabled:opacity-45 disabled:cursor-not-allowed [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        outline:
          'border border-accent-500 text-accent-500 bg-transparent hover:bg-accent-500/12 active:bg-accent-500/22',
        solid:
          'border border-accent-500 bg-accent-500 text-neutral-900 hover:bg-accent-400 active:bg-accent-600',
        secondary:
          'border border-border bg-transparent text-text hover:bg-text/7 active:bg-text/14',
        ghost: 'text-accent-500 border border-transparent hover:bg-accent-500/10 active:bg-accent-500/18',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-11 px-6 text-base',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'outline',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';
