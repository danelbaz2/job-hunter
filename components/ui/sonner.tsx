'use client';

import { Toaster as Sonner } from 'sonner';

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: 'bg-surface-raised! border-border! text-text! shadow-md! rounded-md!',
          description: 'text-text/70!',
          actionButton: 'bg-accent-500! text-neutral-900!',
          cancelButton: 'bg-neutral-800! text-text!',
        },
      }}
    />
  );
}
