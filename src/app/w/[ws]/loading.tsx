export default function Loading() {
  return (
    <div className="space-y-4 pt-4" aria-busy="true" aria-live="polite">
      <div className="h-7 w-40 animate-pulse rounded-lg bg-surface2" />
      <div className="h-28 animate-pulse rounded-2xl bg-surface2" />
      <div className="h-28 animate-pulse rounded-2xl bg-surface2" />
      <div className="h-28 animate-pulse rounded-2xl bg-surface2" />
      <span className="sr-only">A carregar…</span>
    </div>
  );
}
