import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from './cn.js';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const base =
  'inline-flex items-center justify-center gap-2 font-medium transition outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-[color:var(--color-bg)] disabled:opacity-50 disabled:pointer-events-none ' +
  'rounded-[var(--radius-md)]';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-[color:var(--color-accent)] text-[color:var(--color-accent-fg)] hover:bg-[color:var(--color-accent-hover)] shadow-[var(--shadow-sm)]',
  secondary:
    'bg-[color:var(--color-surface)] text-[color:var(--color-fg)] border border-[color:var(--color-border)] hover:bg-[color:var(--color-surface-muted)]',
  ghost: 'bg-transparent text-[color:var(--color-fg)] hover:bg-[color:var(--color-surface-muted)]',
  danger: 'bg-[color:var(--color-danger)] text-white hover:opacity-90 shadow-[var(--shadow-sm)]',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    />
  );
});
