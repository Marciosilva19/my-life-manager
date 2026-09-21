import Link from "next/link";
import type { ReactNode } from "react";

export default function CardShell({
  title,
  href,
  hint,
  children,
  footer,
}: {
  title: string;
  href?: string;
  hint?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="card animate-riseIn">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-[16px]">{title}</h2>
        {href ? (
          <Link href={href} className="text-[13px] font-medium text-primaryInk">
            Ver tudo
          </Link>
        ) : hint ? (
          <span className="text-[12px] text-muted">{hint}</span>
        ) : null}
      </div>
      {children}
      {footer ? <div className="mt-3 border-t border-border/70 pt-3">{footer}</div> : null}
    </section>
  );
}
