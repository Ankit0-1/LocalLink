import { Spinner } from '../components/ui/Spinner';

export function RouteLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-[var(--text-secondary)]">
      <Spinner />
      <p className="text-sm">Loading…</p>
    </div>
  );
}
