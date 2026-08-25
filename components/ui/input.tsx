import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full min-h-9 rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-text',
        'placeholder:text-neutral-500 caret-accent-500',
        'hover:border-text/45 focus-visible:border-accent-500 focus-visible:outline-none',
        'disabled:opacity-45 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';
