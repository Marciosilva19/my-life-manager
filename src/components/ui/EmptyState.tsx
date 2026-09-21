import type { ReactNode } from "react";

export default function EmptyState({
  emoji = "✨",
  title,
  hint,
  action,
}: {
  emoji?: string;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-surface/60 px-5 py-9 text-center">
      <span aria-hidden className="text-2xl">
        {emoji}
      </span>
      <p className="font-medium">{title}</p>
      {hint ? <p className="max-w-xs text-[14px] leading-relaxed text-muted">{hint}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
