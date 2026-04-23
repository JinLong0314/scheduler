import { forwardRef } from 'react';
import type { InputHTMLAttributes, LabelHTMLAttributes } from 'react';
import { cn } from './cn.js';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          'h-10 w-full rounded-[var(--radius-md)] px-3 text-sm outline-none transition',
          'border border-[color:var(--color-border)] bg-[color:var(--color-surface)]',
          'text-[color:var(--color-fg)] placeholder:text-[color:var(--color-fg-muted)]',
          'focus:border-[color:var(--color-accent)] focus:ring-2 focus:ring-[color:var(--color-ring)]/30',
          className,
        )}
        {...rest}
      />
    );
  },
);

export function Label({ className, ...rest }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        'mb-1 block text-xs font-medium text-[color:var(--color-fg-muted)]',
        className,
      )}
      {...rest}
    />
  );
}
