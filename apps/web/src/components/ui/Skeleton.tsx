import { cx } from '../../lib/cx';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cx('animate-skeleton rounded-lg bg-slate-200 dark:bg-slate-800', className)}
      aria-hidden="true"
    />
  );
}

export function SkeletonList({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cx('flex flex-col gap-2', className)} role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}
