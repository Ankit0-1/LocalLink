import {
  forwardRef,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cx } from '../../lib/cx';

const controlStyles =
  'w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-raised)] ' +
  'px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] ' +
  'shadow-xs transition-shadow duration-150 ' +
  'hover:border-slate-400 dark:hover:border-slate-600 ' +
  'focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cx(controlStyles, className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cx(controlStyles, 'min-h-20 resize-y', className)} {...props} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, ...props },
  ref,
) {
  return <select ref={ref} className={cx(controlStyles, 'pr-8', className)} {...props} />;
});

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cx('mb-1.5 block text-sm font-medium text-[var(--text-secondary)]', className)}
      {...props}
    />
  );
}
