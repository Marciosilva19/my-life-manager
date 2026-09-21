import type { ReactNode } from "react";

export default function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h1>{title}</h1>
        {subtitle ? <p className="mt-0.5 text-[14px] text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </header>
  );
}
