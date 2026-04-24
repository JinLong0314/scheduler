import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from './cn.js';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function Card(
  { className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-[var(--radius-lg)] border border-[color:var(--color-border)]',
        'bg-[color:var(--color-surface)] text-[color:var(--color-fg)]',
        'shadow-[var(--shadow-sm)]',
        className,
      )}
      {...rest}
    />
  );
});

export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('border-b border-[color:var(--color-border)] p-4', className)} {...rest} />
  );
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4', className)} {...rest} />;
}

export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('border-t border-[color:var(--color-border)] p-4', className)} {...rest} />
  );
}
