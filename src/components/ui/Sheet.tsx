"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
};

/** Painel modal: folha inferior no telemóvel, cartão centrado no computador. */
export default function Sheet({ open, onClose, title, description, children }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = `sheet-${title.replace(/\s+/g, "-").toLowerCase()}`;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Foca o primeiro campo do formulário (e não o botão de fechar).
    const field =
      panel.current?.querySelector<HTMLElement>("input:not([type=hidden]), textarea, select") ??
      panel.current?.querySelector<HTMLElement>("button");
    field?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 animate-fadeIn bg-black/35 backdrop-blur-[2px]"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 max-h-[90vh] w-full animate-sheetIn overflow-y-auto rounded-t-3xl border border-border/70 bg-surface p-5 shadow-lift sm:max-w-lg sm:rounded-3xl"
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border sm:hidden" />
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description ? <p className="mt-1 text-[13px] text-muted">{description}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="btn-ghost btn-sm -mr-1 -mt-1" aria-label="Fechar">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
