export function OrDivider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <div className="h-px flex-1 bg-(--color-border)" />
      <span className="text-xs font-medium uppercase tracking-wide text-(--color-ink-muted)">or</span>
      <div className="h-px flex-1 bg-(--color-border)" />
    </div>
  );
}
