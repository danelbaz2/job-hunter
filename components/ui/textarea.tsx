import * as React from 'react';
import { cn } from '@/lib/utils';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full min-h-24 rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-text resize-y',
        'placeholder:text-neutral-500 caret-accent-500',
        'hover:border-text/45 focus-visible:border-accent-500 focus-visible:outline-none',
        'disabled:opacity-45 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';
